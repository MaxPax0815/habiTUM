// Read-only aggregation endpoints backing the manager dashboard: portfolio
// overview, per-community stats, and per-challenge adherence.
// Data chain the metrics traverse:
//   Community -> CommunityMembership (members)
//   Community -> Challenge -> Habit (kind: 'challenge') -> Checkin (activity)

const mongoose = require('mongoose');
const Community = require('../communities/communityModel');
const CommunityMembership = require('../communities/communityMembershipModel');
const Challenge = require('../challenges/challengeModel');
const ChallengeParticipation = require('../challenges/challengeParticipationModel');
const Habit = require ('../habit/habitModel');
const Checkin = require('../checkins/checkinModel');

const getManagerOverview = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7); // pulse banner + member growth this week
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // member growth this month

    const communities = await Community.find({ createdBy: req.user._id });

    // Brand-new managers have no communities yet: return a fully shaped empty
    // response so the dashboard renders without null checks.
    if (communities.length === 0) {
        return res.status(200).json({
            pulse: {
                activeMembers: 0, totalMembers: 0, score: null }, 
                kpis: { reach: 0, reachDeltaMonth: 0, adoption: null, momentum: null, completionRate: null },
                communities: []
            });
    }

    const communityIds = communities.map(c => c._id);

    // Member counts and recent growth per community, one aggregate each.
        const memberCounts = await CommunityMembership.aggregate([
            { $match: { community: { $in: communityIds } } },
            { $group: { _id: '$community', members: { $sum: 1 } } }
        ])

        const newThisWeek = await CommunityMembership.aggregate([
            { $match: { community: { $in: communityIds }, joinedAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: '$community', members: { $sum: 1 } } }
        ])

        const newThisMonthTotal = await CommunityMembership.countDocuments({
            community: { $in: communityIds },
            joinedAt: { $gte: startOfMonth }
        })

        // Lookup tables. Keys are stringed: two ObjectIds with the same
        // bytes are still different objects, so Map.get() would miss them.
        const membersByCommunity = new Map(
            memberCounts.map(m => [m._id.toString(), m.members])
        )
        const newWeekByCommunity = new Map(
            newThisWeek.map(m => [m._id.toString(), m.members])
        )

        // Challenges and their habits (the bridge to check-ins)
        const challenges = await Challenge.find({ community: { $in: communityIds } })
            .select('community status')

        const challengeIds = challenges.map(ch => ch._id)
        const communityByChallenge = new Map(
            challenges.map(ch => [ch._id.toString(), ch.community.toString()])
        )

        // kind: 'challenge' keeps personal habits (challenge: null) out of community engagement numbers.
        const habits = await Habit.find({ kind: 'challenge', challenge: { $in: challengeIds } })
            .select('challenge')

        const habitIds = habits.map(h => h._id)
        const communityByHabit = new Map(
            habits.map(h => [h._id.toString(), communityByChallenge.get(h.challenge.toString())])
        )

        // Weekly active members (pulse + per-community engagement + sparkline trend)
        // One fetch covers the last 7 weeks: week 0 (the last 7 days) feeds the
        // pulse and engagement, week 1 feeds momentum, and all 7 weeks feed the
        // per-community "weekly active members" sparkline on the dashboard cards.
        // Fetch documents, not a count: a member with 5 check-ins this week is
        // still ONE active member, and the Sets do the deduplication.
        const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
        const TREND_WEEKS = 7
        const trendStart = new Date(now)
        trendStart.setDate(now.getDate() - TREND_WEEKS * 7)

        const recentCheckins = await Checkin.find({
            habit: { $in: habitIds },
            date: { $gte: trendStart }
        }).select('user habit date')

        const activeUsersTotal = new Set()
        const activeUsersByCommunity = new Map()   // communityId -> Set of userIds
        // communityId -> array of TREND_WEEKS Sets, index 0 = oldest week
        const weeklySetsByCommunity = new Map()
        let checkinsThisWeek = 0
        let checkinsLastWeek = 0

        for (const checkin of recentCheckins) {
            const userId = checkin.user.toString()
            // weeksAgo: 0 = the last 7 days, 1 = the 7 days before that, ...
            const weeksAgo = Math.min(TREND_WEEKS - 1, Math.floor((now - checkin.date) / MS_PER_WEEK))

            if (weeksAgo === 0) {
                checkinsThisWeek++
                activeUsersTotal.add(userId)
            } else if (weeksAgo === 1) {
                checkinsLastWeek++
            }

            const communityId = communityByHabit.get(checkin.habit.toString())
            if (!communityId) continue

            if (weeksAgo === 0) {
                if (!activeUsersByCommunity.has(communityId)) {
                    activeUsersByCommunity.set(communityId, new Set())
                }
                activeUsersByCommunity.get(communityId).add(userId)
            }

            if (!weeklySetsByCommunity.has(communityId)) {
                weeklySetsByCommunity.set(communityId,
                    Array.from({ length: TREND_WEEKS }, () => new Set()))
            }
            // index 0 = oldest week so the sparkline reads left → right in time
            weeklySetsByCommunity.get(communityId)[TREND_WEEKS - 1 - weeksAgo].add(userId)
        }

        // null (not 0) when last week is empty — the UI renders "—".
        const momentum = checkinsLastWeek === 0
            ? null
            : Math.round(((checkinsThisWeek - checkinsLastWeek) / checkinsLastWeek) * 100)

        // Completion rate across finalized challenges
        // Denominator includes 'left': quitting is a real non-completion.
        const finalizedChallengeIds = challenges
            .filter(ch => ch.status === 'finalized')
            .map(ch => ch._id)

        let completionRate = null
        if (finalizedChallengeIds.length > 0) {
            const totalParticipations = await ChallengeParticipation.countDocuments({
                challenge: { $in: finalizedChallengeIds }
            })
            const completedParticipations = await ChallengeParticipation.countDocuments({
                challenge: { $in: finalizedChallengeIds },
                participationStatus: 'completed'
            })
            if (totalParticipations > 0) {
                completionRate = Math.round((completedParticipations / totalParticipations) * 100)
            }
        }

        // Adoption: distinct participants in active challenges
        const activeChallengeIds = challenges
            .filter(ch => ch.status === 'active')
            .map(ch => ch._id)

        const activeParticipations = await ChallengeParticipation.find({
            challenge: { $in: activeChallengeIds },
            participationStatus: { $ne: 'left' }
        }).select('user challenge')

        const participantsByCommunity = new Map()  // communityId -> Set of userIds
        for (const p of activeParticipations) {
            const communityId = communityByChallenge.get(p.challenge.toString())
            if (!communityId) continue
            if (!participantsByCommunity.has(communityId)) {
                participantsByCommunity.set(communityId, new Set())
            }
            participantsByCommunity.get(communityId).add(p.user.toString())
        }

        const activeChallengeCountByCommunity = new Map()
        for (const ch of challenges) {
            if (ch.status !== 'active') continue
            const key = ch.community.toString()
            activeChallengeCountByCommunity.set(key, (activeChallengeCountByCommunity.get(key) || 0) + 1)
        }

        // Assemble one card object per community
        // Iterate over `communities` (not the maps) so a community with zero
        // members/challenges/activity still gets a card.
        const communityCards = communities.map(c => {
            const id = c._id.toString()
            const members = membersByCommunity.get(id) || 0
            const active = activeUsersByCommunity.get(id)?.size || 0
            const participants = participantsByCommunity.get(id)?.size || 0

            // Sparkline data: distinct active members per week, oldest week first.
            // Communities without any check-ins get a flat all-zero series.
            const weeklySets = weeklySetsByCommunity.get(id)
                || Array.from({ length: TREND_WEEKS }, () => new Set())

            return {
                _id: c._id,
                name: c.name,
                members,
                newThisWeek: newWeekByCommunity.get(id) || 0,
                activeChallenges: activeChallengeCountByCommunity.get(id) || 0,
                engagement: members > 0 ? Math.round((active / members) * 100) : null,
                adoption: members > 0 ? Math.round((participants / members) * 100) : null,
                trend: weeklySets.map(set => set.size)
            }
        })

        // Portfolio-level numbers + response
        const totalMembers = communityCards.reduce((sum, c) => sum + c.members, 0)

        // Average adoption only over communities that have members,
        // so an empty community doesn't poison the average.
        const cardsWithMembers = communityCards.filter(c => c.adoption !== null)
        const adoption = cardsWithMembers.length > 0
            ? Math.round(cardsWithMembers.reduce((sum, c) => sum + c.adoption, 0) / cardsWithMembers.length)
            : null

        res.status(200).json({
            pulse: {
                activeMembers: activeUsersTotal.size,
                totalMembers,
                score: totalMembers > 0 ? Math.round((activeUsersTotal.size / totalMembers) * 100) : null
            },
            kpis: {
                reach: totalMembers,
                reachDeltaMonth: newThisMonthTotal,
                adoption,
                momentum,
                completionRate
            },
            communities: communityCards
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch manager overview' });
    }
}

// =============================================================================
// GET /api/manager/communities/:id/stats — detail page for ONE community
// =============================================================================
// Returns the summary tile row (members, weekly active, adoption, retention,
// check-ins this week) plus one KPI row per challenge for the challenges table.

const getManagerCommunityStats = async (req, res) => {
    try {
        // Reject malformed ids up front — findById would throw a CastError
        // (and surface as a 500) instead of a clean 404.
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        const community = await Community.findById(req.params.id)
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        // Managers may only inspect their own communities.
        if (community.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only view stats for communities you created.' })
        }

        const now = new Date()
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(now.getDate() - 7)
        const fourteenDaysAgo = new Date(now)
        fourteenDaysAgo.setDate(now.getDate() - 14)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // ---- Members ----
        const members = await CommunityMembership.countDocuments({ community: community._id })
        const newThisMonth = await CommunityMembership.countDocuments({
            community: community._id,
            joinedAt: { $gte: startOfMonth }
        })

        // ---- Challenges + their habits (bridge to check-ins) ----
        const challenges = await Challenge.find({ community: community._id })
            .select('title status difficulty starts ends')

        const challengeIds = challenges.map(ch => ch._id)
        const habits = await Habit.find({ kind: 'challenge', challenge: { $in: challengeIds } })
            .select('challenge')
        const habitIds = habits.map(h => h._id)

        // ---- Activity: weekly active members + check-in volume this vs last week ----
        const recentCheckins = await Checkin.find({
            habit: { $in: habitIds },
            date: { $gte: fourteenDaysAgo }
        }).select('user date')

        const activeUsers = new Set()
        let checkinsThisWeek = 0
        let checkinsLastWeek = 0
        for (const checkin of recentCheckins) {
            if (checkin.date >= sevenDaysAgo) {
                checkinsThisWeek++
                activeUsers.add(checkin.user.toString())
            } else {
                checkinsLastWeek++
            }
        }
        const checkinsDelta = checkinsLastWeek === 0
            ? null
            : Math.round(((checkinsThisWeek - checkinsLastWeek) / checkinsLastWeek) * 100)

        // ---- Participations, grouped per challenge in one pass ----
        const participations = await ChallengeParticipation.find({ challenge: { $in: challengeIds } })
            .select('challenge participationStatus user')

        const activeChallengeIdSet = new Set(
            challenges.filter(ch => ch.status === 'active').map(ch => ch._id.toString())
        )

        const statsByChallenge = new Map()   // challengeId -> { total, completed, left }
        const activeParticipantUsers = new Set()
        let leftTotal = 0

        for (const p of participations) {
            const key = p.challenge.toString()
            if (!statsByChallenge.has(key)) {
                statsByChallenge.set(key, { total: 0, completed: 0, left: 0 })
            }
            const s = statsByChallenge.get(key)
            s.total++
            if (p.participationStatus === 'completed') s.completed++
            if (p.participationStatus === 'left') {
                s.left++
                leftTotal++
            }
            // Adoption counts distinct users still in a currently active challenge.
            if (activeChallengeIdSet.has(key) && p.participationStatus !== 'left') {
                activeParticipantUsers.add(p.user.toString())
            }
        }

        // Retention = share of all participations (across every challenge of this
        // community) that did NOT end in 'left'.
        const retention = participations.length > 0
            ? Math.round(((participations.length - leftTotal) / participations.length) * 100)
            : null

        const adoption = members > 0 && activeChallengeIdSet.size > 0
            ? Math.round((activeParticipantUsers.size / members) * 100)
            : null

        // ---- One KPI row per challenge, newest first ----
        const challengeRows = challenges.map(ch => {
            const s = statsByChallenge.get(ch._id.toString()) || { total: 0, completed: 0, left: 0 }
            const joined = s.total - s.left   // participants still in (joined or completed)

            return {
                _id: ch._id,
                title: ch.title,
                status: ch.status,
                difficulty: ch.difficulty,
                starts: ch.starts,
                ends: ch.ends,
                joined,
                // Drafts haven't opened yet, so their rates would be misleading zeros.
                adoption: members > 0 && ch.status !== 'draft'
                    ? Math.round((joined / members) * 100) : null,
                dropout: s.total > 0
                    ? Math.round((s.left / s.total) * 100) : null,
                // Completion is only knowable once the challenge is finalized.
                completion: ch.status === 'finalized' && s.total > 0
                    ? Math.round((s.completed / s.total) * 100) : null
            }
        }).sort((a, b) => new Date(b.starts) - new Date(a.starts))

        res.status(200).json({
            community: {
                _id: community._id,
                name: community.name,
                description: community.description
            },
            summary: {
                members,
                newThisMonth,
                weeklyActive: members > 0 ? Math.round((activeUsers.size / members) * 100) : null,
                adoption,
                retention,
                checkinsThisWeek,
                checkinsDelta
            },
            challenges: challengeRows
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch community stats' });
    }
}

// =============================================================================
// GET /api/manager/challenges/:id/adherence — daily check-in adherence series
// =============================================================================
// For each elapsed day of the challenge: what % of the participants who had
// joined by that day checked in? Feeds the line chart on the community detail
// page. Day 1 = the challenge's start date; future days are not included.

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Normalises a date to local midnight so day-bucket arithmetic ignores times.
const atMidnight = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

const getManagerChallengeAdherence = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        const challenge = await Challenge.findById(req.params.id)
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        // Ownership runs through the community: managers may only inspect
        // challenges that belong to a community they created.
        const community = await Community.findById(challenge.community).select('createdBy')
        if (!community || community.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only view stats for your own challenges.' })
        }

        const now = new Date()
        const start = atMidnight(challenge.starts)
        const end = atMidnight(challenge.ends)
        const today = atMidnight(now)

        // Number of days to plot: from the start through today, but never past
        // the end date, and nothing before the challenge has started.
        const lastDay = today < end ? today : end
        const elapsedDays = start > today
            ? 0
            : Math.floor((lastDay - start) / MS_PER_DAY) + 1
        const totalDays = Math.floor((end - start) / MS_PER_DAY) + 1

        // Drafts / future challenges have nothing to plot yet.
        if (elapsedDays === 0 || challenge.status === 'draft') {
            return res.status(200).json({
                challenge: {
                    _id: challenge._id, title: challenge.title, status: challenge.status,
                    starts: challenge.starts, ends: challenge.ends, totalDays
                },
                adherence: []
            })
        }

        const habits = await Habit.find({ kind: 'challenge', challenge: challenge._id })
            .select('_id')
        const habitIds = habits.map(h => h._id)

        const participations = await ChallengeParticipation.find({ challenge: challenge._id })
            .select('user joinedAt leftAt participationStatus')

        const checkins = await Checkin.find({
            habit: { $in: habitIds },
            date: { $gte: start, $lt: new Date(lastDay.getTime() + MS_PER_DAY) }
        }).select('user date')

        // Bucket check-ins: one Set of distinct users per elapsed day.
        const usersByDay = Array.from({ length: elapsedDays }, () => new Set())
        for (const checkin of checkins) {
            const dayIndex = Math.floor((atMidnight(checkin.date) - start) / MS_PER_DAY)
            if (dayIndex >= 0 && dayIndex < elapsedDays) {
                usersByDay[dayIndex].add(checkin.user.toString())
            }
        }

        // For each day: numerator = distinct users who checked in, denominator =
        // participants who had joined by the end of that day and had not left yet.
        const adherence = usersByDay.map((users, dayIndex) => {
            const dayEnd = new Date(start.getTime() + (dayIndex + 1) * MS_PER_DAY)
            const dayStart = new Date(start.getTime() + dayIndex * MS_PER_DAY)

            const eligible = participations.filter(p =>
                new Date(p.joinedAt) < dayEnd &&
                !(p.leftAt && new Date(p.leftAt) < dayStart)
            ).length

            return {
                day: dayIndex + 1,
                date: dayStart,
                rate: eligible > 0 ? Math.round((users.size / eligible) * 100) : null
            }
        })

        res.status(200).json({
            challenge: {
                _id: challenge._id, title: challenge.title, status: challenge.status,
                starts: challenge.starts, ends: challenge.ends, totalDays
            },
            adherence
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch challenge adherence' });
    }
}

module.exports = { getManagerOverview, getManagerCommunityStats, getManagerChallengeAdherence }

