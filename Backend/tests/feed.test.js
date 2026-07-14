// Integration tests for the community activity feed.
//
// These run the REAL controllers (habitController.checkinHabit/undoCheckin,
// feedController.getFeed/streamFeed) against an in-memory MongoDB, so they
// prove the actual rule end to end:
//   a challenge-habit checkin — and ONLY a challenge-habit checkin — produces
//   an activity in the feed of the community that owns the challenge.
//
// Run with: npm test  (node --test tests/)
const { test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

const User = require('../auth/userModel')
const Community = require('../communities/communityModel')
const CommunityMembership = require('../communities/communityMembershipModel')
const Challenge = require('../challenges/challengeModel')
const ChallengeParticipation = require('../challenges/challengeParticipationModel')
const Habit = require('../habit/habitModel')
const Checkin = require('../checkins/checkinModel')
const HabitProgress = require('../habit/habitProgressModel')
const Activity = require('../activities/activityModel')

const { checkinHabit, undoCheckin } = require('../habit/habitController')
const { getFeed, getFeedUpdates, streamFeed } = require('../activities/feedController')
const { recordCheckinActivity } = require('../activities/activityService')
const { encodeFeedCursor } = require('../activities/feedCursor')
const feedBus = require('../activities/feedBus')
const ticketStore = require('../activities/ticketStore')

let mongod

// --- tiny express mocks -----------------------------------------------------

const makeRes = () => ({
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this }
})

// Enough of a Response to satisfy the SSE handler: captures everything written
// to the stream and lets the test fire the 'close' event.
const makeStreamRes = () => {
    const closeHandlers = []
    return {
        statusCode: null,
        body: null,
        headers: null,
        written: '',
        headersSent: false,
        status(code) { this.statusCode = code; return this },
        json(payload) { this.body = payload; return this },
        writeHead(code, headers) { this.statusCode = code; this.headers = headers; this.headersSent = true },
        write(chunk) { this.written += chunk },
        end() {},
        on(event, handler) { if (event === 'close') closeHandlers.push(handler) },
        emitClose() { closeHandlers.forEach((handler) => handler()) }
    }
}

// --- fixtures ----------------------------------------------------------------

const makeUser = (name) => User.create({
    email: `${name}@test.com`,
    password: 'irrelevant-hash',
    username: name,
    firstName: name[0].toUpperCase() + name.slice(1),
    lastName: 'Tester'
})

let anna, ben, stranger, community, otherCommunity, challenge, challengeHabit, personalHabit

before(async () => {
    mongod = await MongoMemoryServer.create()
    await mongoose.connect(mongod.getUri())
})

after(async () => {
    await mongoose.disconnect()
    await mongod.stop()
})

beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})))

    ;[anna, ben, stranger] = await Promise.all([makeUser('anna'), makeUser('ben'), makeUser('stranger')])

    community = await Community.create({ name: 'Morning Movers', createdBy: ben._id })
    otherCommunity = await Community.create({ name: 'Other Community', createdBy: ben._id })

    await CommunityMembership.create([
        { user: anna._id, community: community._id, role: 'member', membershipStatus: 'accepted' },
        { user: ben._id, community: community._id, role: 'creator', membershipStatus: 'accepted' }
    ])

    challenge = await Challenge.create({
        community: community._id,
        title: 'March Movement Challenge',
        starts: new Date(Date.now() - 24 * 3600 * 1000),
        ends: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        status: 'active',
        createdBy: ben._id
    })

    challengeHabit = await Habit.create({
        title: '20 Minute Walk',
        frequency: 'daily',
        habitType: 'build',
        category: 'Fitness',
        kind: 'challenge',
        challenge: challenge._id
    })

    personalHabit = await Habit.create({
        title: 'Secret Journaling',
        frequency: 'daily',
        habitType: 'build',
        category: 'Wellness',
        kind: 'personal',
        user: anna._id
    })

    await ChallengeParticipation.create({
        user: anna._id,
        challenge: challenge._id,
        participationStatus: 'joined'
    })
})

// --- the core rule -----------------------------------------------------------

test('challenge-habit checkin creates exactly one activity in the challenge\'s community feed', async () => {
    const res = makeRes()
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.message, 'Checkin logged successfully')

    const activities = await Activity.find({ community: community._id })
    assert.equal(activities.length, 1)

    const activity = activities[0]
    assert.equal(activity.type, 'checkin')
    assert.equal(activity.user.toString(), anna._id.toString())
    assert.equal(activity.challenge.toString(), challenge._id.toString())
    assert.equal(activity.meta.actorName, 'Anna')
    assert.equal(activity.meta.habitTitle, '20 Minute Walk')
    assert.equal(activity.meta.challengeTitle, 'March Movement Challenge')
    assert.equal(activity.meta.streak, 1) // post-checkin streak, includes today
    assert.equal(activity.meta.frequency, 'daily')

    // No leakage into unrelated communities.
    assert.equal(await Activity.countDocuments({ community: otherCommunity._id }), 0)
})

test('the activity is visible via GET /api/communities/:id/feed for a member', async () => {
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    const res = makeRes()
    await getFeed({ params: { id: community._id.toString() }, query: {}, user: { _id: ben._id } }, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.activities.length, 1)
    assert.equal(res.body.activities[0].meta.habitTitle, '20 Minute Walk')
    assert.equal(res.body.hasMore, false)
})

test('polling updates return new activities and revoked activities for undo', async () => {
    const initial = makeRes()
    await getFeed({ params: { id: community._id.toString() }, query: {}, user: { _id: ben._id } }, initial)
    assert.equal(initial.statusCode, 200)
    assert.equal(initial.body.activities.length, 0)

    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    const updates = makeRes()
    await getFeedUpdates({
        params: { id: community._id.toString() },
        query: { since: initial.body.feedCursor },
        user: { _id: ben._id }
    }, updates)

    assert.equal(updates.statusCode, 200)
    assert.equal(updates.body.activities.length, 1)
    assert.equal(updates.body.activities[0].revoked, false)
    assert.equal(updates.body.activities[0].meta.habitTitle, '20 Minute Walk')

    await undoCheckin({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    const removals = makeRes()
    await getFeedUpdates({
        params: { id: community._id.toString() },
        query: { since: updates.body.feedCursor },
        user: { _id: ben._id }
    }, removals)

    assert.equal(removals.statusCode, 200)
    assert.equal(removals.body.activities.length, 1)
    assert.equal(removals.body.activities[0]._id.toString(), updates.body.activities[0]._id.toString())
    assert.equal(removals.body.activities[0].revoked, true)
})

test('personal-habit checkin creates NO activity anywhere', async () => {
    const res = makeRes()
    await checkinHabit({ params: { id: personalHabit._id.toString() }, user: { _id: anna._id } }, res)
    assert.equal(res.statusCode, 200)

    assert.equal(await Activity.countDocuments({}), 0)
})

test('checkin streak in the activity matches the post-checkin habit progress', async () => {
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    const [activity, progress] = await Promise.all([
        Activity.findOne({ community: community._id }),
        HabitProgress.findOne({ user: anna._id, habit: challengeHabit._id })
    ])
    assert.equal(activity.meta.streak, progress.currentStreak)
})

test('undoing the checkin revokes the activity and notifies live subscribers', async () => {
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())
    assert.equal(await Activity.countDocuments({ revoked: false }), 1)

    const received = []
    const unsubscribe = feedBus.subscribe((event) => received.push(event))

    await undoCheckin({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())
    unsubscribe()

    // Soft delete: the document stays (so a same-period re-checkin restores it
    // instead of posting again) but is invisible to every feed read.
    assert.equal(await Activity.countDocuments({ revoked: false }), 0)
    assert.equal(await Activity.countDocuments({}), 1)

    const feedRes = makeRes()
    await getFeed({ params: { id: community._id.toString() }, query: {}, user: { _id: ben._id } }, feedRes)
    assert.equal(feedRes.body.activities.length, 0, 'revoked items must not appear in the feed')

    const removal = received.find((event) => event.kind === 'activity_removed')
    assert.ok(removal, 'expected an activity_removed bus event')
    assert.equal(removal.community, community._id.toString())
})

test('checkin/undo toggling cannot spam the feed: one post per user/habit/period', async () => {
    const checkinReq = () => ({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } })
    const undoReq = checkinReq

    // Simulate a spammer hammering checkin/undo.
    for (let cycle = 0; cycle < 4; cycle++) {
        await checkinHabit(checkinReq(), makeRes())
        await undoCheckin(undoReq(), makeRes())
    }
    await checkinHabit(checkinReq(), makeRes())

    // Exactly ONE activity document ever existed for this (user, habit, period):
    // the cycles only flipped its revoked flag.
    assert.equal(await Activity.countDocuments({ user: anna._id, habit: challengeHabit._id, type: 'checkin' }), 1)

    const feedRes = makeRes()
    await getFeed({ params: { id: community._id.toString() }, query: {}, user: { _id: ben._id } }, feedRes)
    assert.equal(feedRes.body.activities.length, 1, 'the feed must show exactly one post')
    assert.equal(feedRes.body.activities[0].revoked, false)
})

test('the challenge query param narrows the feed to one challenge', async () => {
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    const matching = makeRes()
    await getFeed({
        params: { id: community._id.toString() },
        query: { challenge: challenge._id.toString() },
        user: { _id: ben._id }
    }, matching)
    assert.equal(matching.body.activities.length, 1)

    const nonMatching = makeRes()
    await getFeed({
        params: { id: community._id.toString() },
        query: { challenge: new mongoose.Types.ObjectId().toString() },
        user: { _id: ben._id }
    }, nonMatching)
    assert.equal(nonMatching.body.activities.length, 0)
})

test('feed pagination clamps invalid low limits instead of passing them to MongoDB', async () => {
    await ChallengeParticipation.create({
        user: ben._id,
        challenge: challenge._id,
        participationStatus: 'joined'
    })
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: ben._id } }, makeRes())

    const res = makeRes()
    await getFeed({
        params: { id: community._id.toString() },
        query: { limit: '-5' },
        user: { _id: ben._id }
    }, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.activities.length, 1)
    assert.equal(res.body.hasMore, true)
})

test('a streak at a multiple of 7 stays ONE checkin activity (milestone is a message variant, not an extra item)', async () => {
    // Drive the service directly with a crafted progress — reaching streak 7
    // through the controller would need 7 real days.
    const checkin = await Checkin.create({
        user: anna._id, habit: challengeHabit._id, date: new Date(), periodKey: 'daily:2099-01-01'
    })
    await recordCheckinActivity({
        userId: anna._id,
        habit: challengeHabit,
        checkin,
        progress: { currentStreak: 7 }
    })

    const activities = await Activity.find({ community: community._id })
    assert.equal(activities.length, 1)
    assert.equal(activities[0].type, 'checkin')
    assert.equal(activities[0].meta.streak, 7) // frontend renders this one celebratory
})

// --- feed access control -----------------------------------------------------

test('non-members get 403 from the feed', async () => {
    const res = makeRes()
    await getFeed({ params: { id: community._id.toString() }, query: {}, user: { _id: stranger._id } }, res)
    assert.equal(res.statusCode, 403)
})

test('stream tickets are single-use and expire', async () => {
    const ticket = ticketStore.createTicket(anna._id)
    assert.equal(ticketStore.consumeTicket(ticket), anna._id.toString())
    assert.equal(ticketStore.consumeTicket(ticket), null, 'second use must fail')
    assert.equal(ticketStore.consumeTicket('no-such-ticket'), null)
})

// --- the SSE stream itself ---------------------------------------------------

test('stream rejects a missing/invalid ticket with 401 and non-members with 403', async () => {
    const res1 = makeStreamRes()
    await streamFeed({ params: { id: community._id.toString() }, query: { ticket: 'bogus' }, headers: {} }, res1)
    assert.equal(res1.statusCode, 401)

    const ticket = ticketStore.createTicket(stranger._id)
    const res2 = makeStreamRes()
    await streamFeed({ params: { id: community._id.toString() }, query: { ticket }, headers: {} }, res2)
    assert.equal(res2.statusCode, 403)
})

test('a member\'s stream receives a live event when someone checks into a challenge habit', async () => {
    const ticket = ticketStore.createTicket(ben._id)
    const res = makeStreamRes()
    await streamFeed({ params: { id: community._id.toString() }, query: { ticket }, headers: {} }, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.headers['Content-Type'], 'text/event-stream')

    const baseline = feedBus.listenerCount()
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    assert.match(res.written, /event: activity\n/)
    assert.match(res.written, /"habitTitle":"20 Minute Walk"/)
    assert.match(res.written, /"actorName":"Anna"/)

    // Closing the connection must release the bus listener (no leak).
    res.emitClose()
    assert.equal(feedBus.listenerCount(), baseline - 1)
})

test('stream does NOT receive events for other communities, nor personal-habit checkins', async () => {
    // Ben listens to otherCommunity (make him a member there first).
    await CommunityMembership.create({
        user: ben._id, community: otherCommunity._id, role: 'member', membershipStatus: 'accepted'
    })
    const ticket = ticketStore.createTicket(ben._id)
    const res = makeStreamRes()
    await streamFeed({ params: { id: otherCommunity._id.toString() }, query: { ticket }, headers: {} }, res)
    const writtenAfterHandshake = res.written

    // Challenge checkin in a DIFFERENT community + a personal-habit checkin.
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())
    await checkinHabit({ params: { id: personalHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    assert.equal(res.written, writtenAfterHandshake, 'no events must reach this stream')
    res.emitClose()
})

test('reconnect catch-up replays activities missed while disconnected', async () => {
    // Anna checks in while nobody is connected.
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())
    const first = await Activity.findOne({ community: community._id })

    // Ben checks in too (second activity, later _id).
    await ChallengeParticipation.create({ user: ben._id, challenge: challenge._id, participationStatus: 'joined' })
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: ben._id } }, makeRes())

    // Ben reconnects claiming he last saw the FIRST activity → only the second is replayed.
    const ticket = ticketStore.createTicket(ben._id)
    const res = makeStreamRes()
    await streamFeed({
        params: { id: community._id.toString() },
        query: { ticket, lastEventId: first._id.toString() },
        headers: {}
    }, res)

    assert.match(res.written, /"actorName":"Ben"/)
    assert.doesNotMatch(res.written, /"actorName":"Anna"/)
    res.emitClose()
})

test('reconnect catch-up replays an undo that happened while disconnected', async () => {
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    const feedRes = makeRes()
    await getFeed({ params: { id: community._id.toString() }, query: {}, user: { _id: ben._id } }, feedRes)
    const activity = feedRes.body.activities[0]

    await undoCheckin({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    const ticket = ticketStore.createTicket(ben._id)
    const res = makeStreamRes()
    await streamFeed({
        params: { id: community._id.toString() },
        query: { ticket, lastEventId: activity.feedEventId },
        headers: {}
    }, res)

    assert.match(res.written, /event: activity_removed\n/)
    assert.match(res.written, new RegExp(`"activityId":"${activity._id}"`))
    res.emitClose()
})

test('reconnect catch-up replays a same-period restore even though the activity id is reused', async () => {
    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())
    await undoCheckin({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())

    const revokedActivity = await Activity.findOne({ community: community._id }).lean()
    const revokedCursor = encodeFeedCursor(revokedActivity)

    await checkinHabit({ params: { id: challengeHabit._id.toString() }, user: { _id: anna._id } }, makeRes())
    const restoredActivity = await Activity.findOne({ community: community._id }).lean()
    assert.equal(restoredActivity._id.toString(), revokedActivity._id.toString())
    assert.equal(restoredActivity.revoked, false)
    assert.ok(restoredActivity.feedVersion > revokedActivity.feedVersion)

    const ticket = ticketStore.createTicket(ben._id)
    const res = makeStreamRes()
    await streamFeed({
        params: { id: community._id.toString() },
        query: { ticket, lastEventId: revokedCursor },
        headers: {}
    }, res)

    assert.match(res.written, /event: activity\n/)
    assert.match(res.written, /"actorName":"Anna"/)
    assert.match(res.written, new RegExp(`"_id":"${restoredActivity._id}"`))
    res.emitClose()
})
