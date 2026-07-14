// Turns habit check-ins into community feed activities. Enforces the scope rule
// (only challenge habits reach a feed) and keeps posts idempotent under undo and
// concurrent check-ins by reusing a single Activity row per user/habit/period.

const Activity = require('./activityModel')
const Challenge = require('../challenges/challengeModel')
const User = require('../auth/userModel')
const feedBus = require('./feedBus')

// Legacy SSE publish; active polling clients read the same Activity rows from Mongo.
const publishActivity = (activity) => {
    feedBus.publish({ kind: 'activity', community: activity.community.toString(), activity })
}

// Legacy SSE removal publish; polling clients learn removal from revoked rows.
const publishRemoval = (activity) => {
    feedBus.publish({
        kind: 'activity_removed',
        community: activity.community.toString(),
        activityId: activity._id.toString(),
        activity
    })
}

// Spam guard: undo revokes and same-period re-checkin restores one unique Activity doc.

const restoreActivity = async (existing, checkinId) => {
    existing.revoked = false
    existing.checkin = checkinId || existing.checkin
    existing.feedVersion = (existing.feedVersion || 0) + 1
    await existing.save()
    publishActivity(existing)
    return existing
}

const upsertActivity = async ({ type, baseFields, periodKey }) => {
    const existing = await Activity.findOne({
        user: baseFields.user,
        habit: baseFields.habit,
        type,
        'meta.periodKey': periodKey
    })
    if (existing) {
        // Same period: restore if undone, otherwise reuse the already-live post.
        return existing.revoked ? restoreActivity(existing, baseFields.checkin) : existing
    }

    try {
        const activity = await Activity.create({ type, ...baseFields })
        publishActivity(activity)
        return activity
    } catch (error) {
        // 11000 = concurrent create hit the unique spam-guard index; reuse winner.
        if (error.code === 11000) {
            const winner = await Activity.findOne({
                user: baseFields.user,
                habit: baseFields.habit,
                type,
                'meta.periodKey': periodKey
            })
            if (winner && winner.revoked) return restoreActivity(winner, baseFields.checkin)
            return winner
        }
        throw error
    }
}

// Called after progress updates; scope gate keeps personal checkins out of feeds.
// Feed failures are secondary effects, so missing/deleted targets return null.
const recordCheckinActivity = async ({ userId, habit, checkin, progress }) => {
    // Scope rule: personal-habit checkins are private and never reach a feed.
    if (habit.kind !== 'challenge' || !habit.challenge) return null

    const [challenge, user] = await Promise.all([
        Challenge.findById(habit.challenge).select('community title').lean(),
        User.findById(userId).select('firstName username').lean()
    ])
    if (!challenge || !user) return null

    const streak = progress?.currentStreak || 0
    const periodKey = checkin?.periodKey || null
    const baseFields = {
        user: userId,
        community: challenge.community,
        challenge: challenge._id,
        habit: habit._id,
        checkin: checkin?._id || null,
        meta: {
            actorName: user.firstName || user.username || 'Someone',
            habitTitle: habit.title,
            challengeTitle: challenge.title,
            streak,
            frequency: habit.frequency,
            periodKey
        }
    }

    // Milestones are rendered as checkin variants; legacy milestone type remains readable.
    return upsertActivity({ type: 'checkin', baseFields, periodKey })
}

// Undo soft-deletes by revoking; keeping the row lets same-period re-checkin restore it.
const removeCheckinActivity = async (checkinId) => {
    if (!checkinId) return

    const activities = await Activity.find({ checkin: checkinId, revoked: false })
    if (activities.length === 0) return

    for (const activity of activities) {
        activity.revoked = true
        activity.feedVersion = (activity.feedVersion || 0) + 1
        await activity.save()
        publishRemoval(activity)
    }
}

module.exports = { recordCheckinActivity, removeCheckinActivity }
