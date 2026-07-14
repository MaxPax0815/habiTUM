const mongoose = require('mongoose')
const Activity = require('./activityModel')
const CommunityMembership = require('../communities/communityMembershipModel')
const feedBus = require('./feedBus')
const ticketStore = require('./ticketStore')
const {
    buildReplayCursorQuery,
    compareFeedCursors,
    encodeFeedCursor,
    makeCurrentFeedCursor
} = require('./feedCursor')

const HEARTBEAT_INTERVAL_MS = 25 * 1000
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

// Server-side feed gate: only accepted community members can read activity.
const hasAcceptedMembership = async (userId, communityId) => {
    const membership = await CommunityMembership.findOne({
        user: userId,
        community: communityId,
        membershipStatus: 'accepted'
    }).select('_id').lean()
    return Boolean(membership)
}

// Clamp user-provided page size so feed queries stay bounded.
const parsePageLimit = (rawLimit) => {
    const parsed = parseInt(rawLimit, 10)
    if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE
    return Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE)
}

// Adds the cursor field used by polling/SSE clients.
const serializeActivity = (activity) => {
    const plainActivity = activity.toObject ? activity.toObject() : activity
    return {
        ...plainActivity,
        feedEventId: encodeFeedCursor(activity)
    }
}

// Picks the newest cursor in a page using the same ordering as replay queries.
const newestCursorFor = (activities) => {
    if (activities.length === 0) return makeCurrentFeedCursor()
    return activities
        .map((activity) => encodeFeedCursor(activity))
        .sort(compareFeedCursors)
        .at(-1)
}

// LEGACY SSE auth: exchange Bearer JWT for a 30s single-use stream ticket.
const createTicket = (req, res) => {
    const ticket = ticketStore.createTicket(req.user._id)
    res.status(200).json({ ticket, expiresInMs: ticketStore.TICKET_TTL_MS })
}

// GET /api/communities/:id/feed?before=<activityId>&limit=20&challenge=<id>
// ACTIVE initial page/load-more: _id cursor pagination, optional challenge filter.
const getFeed = async (req, res) => {
    const { id } = req.params
    const { before, challenge } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }
    if (before && !mongoose.Types.ObjectId.isValid(before)) {
        return res.status(400).json({ error: 'Not a valid cursor.' })
    }
    if (challenge && !mongoose.Types.ObjectId.isValid(challenge)) {
        return res.status(400).json({ error: 'Not a valid challenge id.' })
    }

    try {
        if (!await hasAcceptedMembership(req.user._id, id)) {
            return res.status(403).json({ error: 'Join this community to see its activity feed.' })
        }

        const limit = parsePageLimit(req.query.limit)
        const query = {
            community: id,
            // Initial pages hide revoked rows; $ne also keeps old docs without revoked.
            revoked: { $ne: true },
            ...(challenge && { challenge }),
            ...(before && { _id: { $lt: before } })
        }
        // limit+1 answers "has more?" without a second query.
        const activities = await Activity.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .lean()

        const hasMore = activities.length > limit
        const pageActivities = hasMore ? activities.slice(0, limit) : activities
        res.status(200).json({
            activities: pageActivities.map(serializeActivity),
            feedCursor: newestCursorFor(pageActivities),
            hasMore
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// GET /api/communities/:id/feed/updates?since=<feedCursor>&challenge=<id>
// ACTIVE poll endpoint: includes revoked rows so clients can remove undone posts.
const getFeedUpdates = async (req, res) => {
    const { id } = req.params
    const { since, challenge } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }
    if (challenge && !mongoose.Types.ObjectId.isValid(challenge)) {
        return res.status(400).json({ error: 'Not a valid challenge id.' })
    }

    try {
        if (!await hasAcceptedMembership(req.user._id, id)) {
            return res.status(403).json({ error: 'Join this community to see its activity feed.' })
        }

        // Invalid/missing cursors start from now instead of replaying old rows.
        const replayCursorQuery = buildReplayCursorQuery(since)
        if (!replayCursorQuery) {
            return res.status(200).json({
                activities: [],
                feedCursor: makeCurrentFeedCursor()
            })
        }

        // Sort matches the replay cursor triple: updatedAt, feedVersion, _id.
        const activities = await Activity.find({
            community: id,
            ...replayCursorQuery,
            ...(challenge && { challenge })
        })
            .sort({ updatedAt: 1, feedVersion: 1, _id: 1 })
            .limit(MAX_PAGE_SIZE)
            .lean()

        res.status(200).json({
            activities: activities.map(serializeActivity),
            feedCursor: newestCursorFor(activities)
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Writes one SSE frame; EventSource expects id/event/data lines ending in a blank line.
const writeSseEvent = (res, eventName, id, data) => {
    if (id) res.write(`id: ${id}\n`)
    res.write(`event: ${eventName}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
}

// Converts an Activity state into either an activity or activity_removed SSE event.
const writeActivityState = (res, activity) => {
    const eventId = encodeFeedCursor(activity)
    if (activity.revoked) {
        writeSseEvent(res, 'activity_removed', eventId, {
            activityId: activity._id.toString(),
            feedEventId: eventId
        })
    } else {
        writeSseEvent(res, 'activity', eventId, serializeActivity(activity))
    }
}

// GET /api/communities/:id/feed/stream?ticket=...&lastEventId=...
// LEGACY SSE stream mounted outside requireAuth because EventSource cannot send Bearer headers.
const streamFeed = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }

    const userId = ticketStore.consumeTicket(req.query.ticket)
    if (!userId) {
        return res.status(401).json({ error: 'Invalid or expired stream ticket.' })
    }

    try {
        if (!await hasAcceptedMembership(userId, id)) {
            return res.status(403).json({ error: 'Join this community to see its activity feed.' })
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            // Avoid proxy buffering so events flush immediately.
            'X-Accel-Buffering': 'no'
        })
        // Browser waits 3s before EventSource auto-reconnects.
        res.write('retry: 3000\n\n')

        const writeBusEvent = (event) => {
            if (event.kind === 'activity') {
                writeActivityState(res, event.activity)
            } else if (event.kind === 'activity_removed') {
                const eventId = event.activity ? encodeFeedCursor(event.activity) : null
                writeSseEvent(res, 'activity_removed', eventId, {
                    activityId: event.activityId,
                    feedEventId: eventId
                })
            }
        }

        // Subscribe before replay so events published during the query are buffered, not lost.
        let replaying = true
        const buffered = []
        const unsubscribe = feedBus.subscribe((event) => {
            if (event.community !== id) return
            if (replaying) buffered.push(event)
            else writeBusEvent(event)
        })

        // Reconnect catch-up uses the triple cursor so missed revoke/restore states replay.
        const lastEventId = req.headers['last-event-id'] || req.query.lastEventId
        const replayCursorQuery = buildReplayCursorQuery(lastEventId)
        if (replayCursorQuery) {
            const missed = await Activity.find({
                community: id,
                ...replayCursorQuery
            }).sort({ updatedAt: 1, feedVersion: 1, _id: 1 }).lean()
            for (const activity of missed) {
                writeActivityState(res, activity)
            }
        }

        // Go live: flush events buffered while replaying history.
        replaying = false
        buffered.forEach(writeBusEvent)

        // SSE comments keep idle connections alive through proxies.
        const heartbeat = setInterval(() => {
            res.write(': ping\n\n')
        }, HEARTBEAT_INTERVAL_MS)

        res.on('close', () => {
            clearInterval(heartbeat)
            unsubscribe()
        })
    } catch (error) {
        // If headers were flushed, close the stream instead of sending JSON.
        if (res.headersSent) {
            res.end()
        } else {
            res.status(500).json({ error: error.message })
        }
    }
}

module.exports = { createTicket, getFeed, getFeedUpdates, streamFeed }
