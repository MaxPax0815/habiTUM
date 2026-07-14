// Challenge lifecycle: creation, participation (join/leave), challenge-owned
// habits and their leaderboards, plus the public landing-page endpoints
// (preview, trending) that expose only public, non-archived communities.

const Challenge = require('./challengeModel')
const ChallengeParticipation = require('./challengeParticipationModel')
const Habit = require('../habit/habitModel')
const HabitProgress = require('../habit/habitProgressModel')
const Checkin = require('../checkins/checkinModel')
const CommunityMembership = require('../communities/communityMembershipModel')
const Community = require('../communities/communityModel')
const CommunityPost = require('../communityPosts/communityPostModel')
const mongoose = require('mongoose')
const { getPeriodKey } = require('../habit/periodUtils')

const emptyHabitProgress = {
    currentStreak: 0,
    bestStreak: 0,
    lastCheckinAt: null,
    lastPeriodKey: null,
    totalCheckins: 0
}

const attachProgressToChallengeHabit = (habit, progress, checkins = []) => {
    const habitObject = habit.toObject ? habit.toObject() : habit
    const progressObject = progress || emptyHabitProgress

    return {
        ...habitObject,
        checkins,
        progress: {
            ...emptyHabitProgress,
            ...progressObject
        },
        streak: progressObject.currentStreak || 0,
        bestStreak: progressObject.bestStreak || 0,
        lastCheckin: progressObject.lastCheckinAt || null,
        totalCheckins: progressObject.totalCheckins || 0
    }
}

const attachProgressToChallengeHabits = async (habits, userId) => {
    const habitObjects = habits.map((habit) => habit.toObject ? habit.toObject() : habit)
    const habitIds = habitObjects.map((habit) => habit._id)

    if (habitIds.length === 0) return []

    const [checkins, progresses] = await Promise.all([
        Checkin.find({
            habit: { $in: habitIds },
            user: userId
        }).sort({ date: 1 }).lean(),
        HabitProgress.find({
            habit: { $in: habitIds },
            user: userId
        }).lean()
    ])

    const checkinsByHabit = checkins.reduce((acc, checkin) => {
        const habitId = checkin.habit.toString()
        if (!acc[habitId]) acc[habitId] = []
        acc[habitId].push(checkin)
        return acc
    }, {})

    const progressByHabit = progresses.reduce((acc, progress) => {
        acc[progress.habit.toString()] = progress
        return acc
    }, {})

    return habitObjects.map((habit) => {
        const habitId = habit._id.toString()
        return attachProgressToChallengeHabit(
            habit,
            progressByHabit[habitId],
            checkinsByHabit[habitId] || []
        )
    })
}

const createChallenge = async (req, res) => {
    const { community, title, description, starts, ends, status, difficulty } = req.body

    const emptyFields = []
    if (!community) emptyFields.push('community')
    if (!title) emptyFields.push('title')
    if (!starts) emptyFields.push('starts')
    if (!ends) emptyFields.push('ends')

    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all required fields', emptyFields })
    }

    try {
        const challenge = await Challenge.create({
            community,
            title,
            description,
            starts,
            ends,
            status,
            difficulty,
            createdBy: req.user._id
        })

        res.status(201).json(challenge)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// PATCH /api/challenges/:id — edit a challenge's details.
// requireChallengeManageAccess has already verified the caller is the owning
// community's creator/admin. The community itself is intentionally immutable
// here, so a challenge can never be moved to a different community.
const updateChallenge = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Not a valid challenge id.' })
    }

    const { title, description, starts, ends, difficulty } = req.body

    const emptyFields = []
    if (!title) emptyFields.push('title')
    if (!starts) emptyFields.push('starts')
    if (!ends) emptyFields.push('ends')

    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all required fields', emptyFields })
    }

    if (new Date(ends) <= new Date(starts)) {
        return res.status(400).json({ error: 'End date must be after start date.', emptyFields: ['ends'] })
    }

    try {
        const challenge = await Challenge.findByIdAndUpdate(
            id,
            { title, description, starts, ends, difficulty },
            { new: true, runValidators: true }
        )

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        res.status(200).json(challenge)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

const deleteChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndDelete(req.params.id)

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        const challengeHabits = await Habit.find({
            kind: 'challenge',
            challenge: challenge._id
        }).select('_id')

        const challengeHabitIds = challengeHabits.map((habit) => habit._id)

        // Cascade cleanup: remove everything that hangs off the challenge and
        // detach it from any posts, so no orphaned records or dangling refs remain.
        await Promise.all([
            ChallengeParticipation.deleteMany({ challenge: challenge._id }),
            Habit.deleteMany({ _id: { $in: challengeHabitIds } }),
            Checkin.deleteMany({ habit: { $in: challengeHabitIds } }),
            HabitProgress.deleteMany({ habit: { $in: challengeHabitIds } }),
            CommunityPost.updateMany({ challenge: challenge._id }, { $set: { challenge: null } })
        ])

        res.status(200).json(challenge)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

const joinChallenge = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Not a valid challenge id.' })
    }

    try {
        const challenge = await Challenge.findById(id).select('_id community')

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        const communityMembership = await CommunityMembership.findOne({
            user: req.user._id,
            community: challenge.community,
            membershipStatus: 'accepted'
        }).select('_id')

        if (!communityMembership) {
            return res.status(403).json({ error: 'You must join this community before joining its challenges.' })
        }

        let participation = await ChallengeParticipation.findOne({
            user: req.user._id,
            challenge: challenge._id
        })

        if (participation) {
            if (participation.participationStatus !== 'joined') {
                participation.participationStatus = 'joined'
                participation.joinedAt = new Date()
                participation.completedAt = null
                participation.leftAt = null
                await participation.save()
            }
        } else {
            participation = await ChallengeParticipation.create({
                user: req.user._id,
                challenge: challenge._id,
                participationStatus: 'joined'
            })
        }

        res.status(200).json(participation)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

const leaveChallenge = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Not a valid challenge id.' })
    }

    try {
        const challenge = await Challenge.findById(id).select('_id')

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        const participation = await ChallengeParticipation.findOne({
            user: req.user._id,
            challenge: challenge._id
        })

        if (participation && participation.participationStatus !== 'left') {
            participation.participationStatus = 'left'
            participation.leftAt = new Date()
            participation.completedAt = null
            await participation.save()
        }

        res.status(200).json({
            left: id,
            participation
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

const getChallengeHabits = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Not a valid challenge id.' })
    }

    try {
        const challenge = await Challenge.findById(id).select('_id').lean()

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        const habits = await Habit.find({
            kind: 'challenge',
            challenge: id
        }).sort({ createdAt: 1 })

        const habitsWithProgress = await attachProgressToChallengeHabits(habits, req.user._id)
        res.status(200).json(habitsWithProgress)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// Ranks joined participants by progress-backed streak. Shared by the authed
// leaderboard endpoint and the public challenge preview. Pass currentUserId to
// flag the requesting user's own row ("you"); omit it for the public view.
const buildLeaderboardEntries = (participations, challengeHabits, progressRecords, currentUserId = null) => {
    const currentPeriodKeyByHabit = challengeHabits.reduce((acc, habit) => {
        acc[habit._id.toString()] = getPeriodKey(new Date(), habit.frequency)
        return acc
    }, {})

    const progressByUser = progressRecords.reduce((acc, progress) => {
        const userId = progress.user.toString()
        if (!acc[userId]) {
            acc[userId] = { currentStreak: 0, bestStreak: 0, totalCheckins: 0, doneToday: false }
        }

        acc[userId].currentStreak += progress.currentStreak || 0
        acc[userId].bestStreak += progress.bestStreak || 0
        acc[userId].totalCheckins += progress.totalCheckins || 0
        acc[userId].doneToday = acc[userId].doneToday ||
            progress.lastPeriodKey === currentPeriodKeyByHabit[progress.habit.toString()]
        return acc
    }, {})

    return participations
        .map((participation) => {
            const stats = progressByUser[participation.user?._id?.toString()] || {}
            return {
                participationStatus: participation.participationStatus,
                joinedAt: participation.joinedAt,
                completedAt: participation.completedAt,
                leftAt: participation.leftAt,
                streak: stats.currentStreak || 0,
                bestStreak: stats.bestStreak || 0,
                totalCheckins: stats.totalCheckins || 0,
                doneToday: stats.doneToday || false,
                isCurrentUser: currentUserId
                    ? participation.user?._id?.toString() === currentUserId.toString()
                    : false,
                user: participation.user
            }
        })
        .sort((a, b) => b.streak - a.streak || new Date(a.joinedAt) - new Date(b.joinedAt))
        .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

const getChallengeLeaderboard = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Not a valid challenge id.' })
    }

    try {
        const challenge = await Challenge.findById(id)
            .populate('community', 'name')
            .lean()

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        const participations = await ChallengeParticipation.find({
            challenge: id,
            participationStatus: 'joined'
        })
            .populate('user', 'firstName lastName username')
            .sort({ joinedAt: 1 })
            .lean()

        const challengeHabits = await Habit.find({
            kind: 'challenge',
            challenge: id
        }).select('_id frequency').lean()

        const challengeHabitIds = challengeHabits.map((habit) => habit._id)
        const participantUserIds = participations
            .map((participation) => participation.user?._id)
            .filter(Boolean)

        const progressRecords = await HabitProgress.find({
            habit: { $in: challengeHabitIds },
            user: { $in: participantUserIds }
        }).lean()

        const leaderboard = buildLeaderboardEntries(
            participations, challengeHabits, progressRecords, req.user._id
        )

        const currentUserEntry = leaderboard.find((entry) => entry.isCurrentUser)
        const participantCount = leaderboard.length
        const isJoined = Boolean(currentUserEntry)

        res.status(200).json({
            challenge: {
                ...challenge,
                participantCount,
                isJoined
            },
            leaderboard,
            currentUserRank: currentUserEntry?.rank || null,
            participantCount,
            isJoined
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// POST /api/challenges/:id/habits — add a habit to a challenge.
// Route middleware (requireChallengeManageAccess) has already verified the
// challenge exists and that req.user is the community's creator (or admin).
// Mirrors habitController.createHabit, but creates a 'challenge' habit that
// belongs to the challenge instead of a user.
const createChallengeHabit = async (req, res) => {
    const { title, frequency, habitType, motivation, icon, category } = req.body

    const emptyFields = []
    if (!title)     emptyFields.push('title')
    if (!frequency) emptyFields.push('frequency')
    if (!habitType) emptyFields.push('habitType')
    if (!category)  emptyFields.push('category')

    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all required fields', emptyFields })
    }

    try {
        const habit = await Habit.create({
            title, frequency, habitType, content: motivation, category, icon,
            kind: 'challenge',
            challenge: req.params.id
        })

        // Return the same enriched shape getChallengeHabits produces (empty
        // checkins, zeroed progress) so the frontend can render it immediately.
        res.status(201).json(attachProgressToChallengeHabit(habit, null, []))
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// GET /api/challenges/joined — the requesting user's active joined challenges,
// used by the "Active challenges" panel on the Home dashboard.
const getJoinedChallenges = async (req, res) => {
    try {
        const participations = await ChallengeParticipation.find({
            user: req.user._id,
            participationStatus: 'joined'
        }).populate({
            path: 'challenge',
            select: 'title status starts ends community',
            populate: { path: 'community', select: 'name' }
        })

        // populate leaves challenge null if it was deleted; drop those and
        // anything not currently running.
        const activeChallenges = participations
            .map(p => p.challenge)
            .filter(ch => ch && ch.status === 'active')

        res.status(200).json(activeChallenges)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// GET /api/challenges/:id/preview — PUBLIC (no auth). Read-only challenge view
// for the landing page: the same shape the in-app page renders (header + habits
// + leaderboard), minus anything user-specific (no join state, no "you" row).
// Only challenges in public, non-archived communities are exposed.
const getChallengePreview = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Not a valid challenge id.' })
    }

    try {
        const challenge = await Challenge.findById(id)
            .populate('community', 'name isPrivate isArchived')
            .lean()

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        // Never leak challenges from private or archived communities to visitors.
        if (!challenge.community || challenge.community.isPrivate || challenge.community.isArchived) {
            return res.status(403).json({ error: 'This challenge is not publicly viewable.' })
        }

        const participations = await ChallengeParticipation.find({
            challenge: id,
            participationStatus: 'joined'
        })
            .populate('user', 'firstName lastName username')
            .sort({ joinedAt: 1 })
            .lean()

        const challengeHabits = await Habit.find({
            kind: 'challenge',
            challenge: id
        }).sort({ createdAt: 1 }).lean()

        const challengeHabitIds = challengeHabits.map((habit) => habit._id)
        const participantUserIds = participations
            .map((participation) => participation.user?._id)
            .filter(Boolean)

        const progressRecords = await HabitProgress.find({
            habit: { $in: challengeHabitIds },
            user: { $in: participantUserIds }
        }).lean()

        const leaderboard = buildLeaderboardEntries(participations, challengeHabits, progressRecords)
        const participantCount = leaderboard.length

        // No requesting user → every habit renders with zeroed, read-only progress.
        const habits = challengeHabits.map((habit) => attachProgressToChallengeHabit(habit, null, []))

        res.status(200).json({
            challenge: {
                ...challenge,
                community: { _id: challenge.community._id, name: challenge.community.name },
                participantCount,
                isJoined: false
            },
            habits,
            leaderboard,
            currentUserRank: null,
            participantCount,
            isJoined: false
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// GET /api/challenges/trending — PUBLIC (no auth). Powers the landing page's
// Challenges section. "Trending" = active challenges with the most joined
// participants. Only challenges from public, non-archived communities are
// returned, so nothing from private/invite-only communities leaks to visitors.
const getTrendingChallenges = async (req, res) => {
    try {
        const publicCommunities = await Community.find({
            isPrivate: false,
            isArchived: { $ne: true }
        }).select('_id name').lean()

        const communityById = {}
        publicCommunities.forEach((c) => { communityById[c._id.toString()] = c })
        const publicCommunityIds = publicCommunities.map((c) => c._id)

        const challenges = await Challenge.find({
            status: 'active',
            community: { $in: publicCommunityIds }
        }).select('title description difficulty starts ends community').lean()

        const challengeIds = challenges.map((challenge) => challenge._id)

        // One aggregate for joined-participant counts, then rank by it.
        const counts = await ChallengeParticipation.aggregate([
            { $match: { challenge: { $in: challengeIds }, participationStatus: 'joined' } },
            { $group: { _id: '$challenge', count: { $sum: 1 } } }
        ])
        const countByChallenge = {}
        counts.forEach((c) => { countByChallenge[c._id.toString()] = c.count })

        const result = challenges
            .map((challenge) => ({
                _id: challenge._id,
                title: challenge.title,
                description: challenge.description,
                difficulty: challenge.difficulty,
                starts: challenge.starts,
                ends: challenge.ends,
                community: {
                    _id: challenge.community,
                    name: communityById[challenge.community.toString()]?.name || null
                },
                participantCount: countByChallenge[challenge._id.toString()] || 0
            }))
            .sort((a, b) => b.participantCount - a.participantCount)
            .slice(0, 5)

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    createChallenge,
    updateChallenge,
    deleteChallenge,
    joinChallenge,
    leaveChallenge,
    getChallengeHabits,
    getChallengeLeaderboard,
    createChallengeHabit,
    getJoinedChallenges,
    getTrendingChallenges,
    getChallengePreview
}
