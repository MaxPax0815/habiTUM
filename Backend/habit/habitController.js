const Habit = require('./habitModel')
const HabitProgress = require('./habitProgressModel')
const Checkin = require('../checkins/checkinModel')
const ChallengeParticipation = require('../challenges/challengeParticipationModel')
const mongoose = require('mongoose')
const { getPeriodKey, isConsecutivePeriod, periodsElapsedSinceKey } = require('./periodUtils')
const { recordCheckinActivity, removeCheckinActivity } = require('../activities/activityService')

// Default progress shape keeps API fields stable before the first checkin.
const emptyProgress = {
    currentStreak: 0,
    bestStreak: 0,
    lastCheckinAt: null,
    lastPeriodKey: null,
    totalCheckins: 0
}

// Merges HabitProgress plus raw checkins while preserving legacy top-level streak fields.
const attachProgressToHabit = (habitObject, progress, checkins = []) => {
    const progressObject = progress
        ? (progress.toObject ? progress.toObject() : progress)
        : emptyProgress

    return {
        ...habitObject,
        checkins,
        progress: {
            ...emptyProgress,
            ...progressObject
        },
        // Keep the old response shape so the current frontend does not break.
        streak: progressObject.currentStreak || 0,
        bestStreak: progressObject.bestStreak || 0,
        lastCheckin: progressObject.lastCheckinAt || null,
        totalCheckins: progressObject.totalCheckins || 0
    }
}

// Fetches one habit's checkins and per-user progress for Today/Progress responses.
const attachCheckinsToHabit = async (habit, userId) => {
    const habitObject = habit.toObject ? habit.toObject() : habit

    const [checkins, progress] = await Promise.all([
        Checkin.find({
            habit: habitObject._id,
            user: userId
        }).sort({ date: 1 }).lean(),
        HabitProgress.findOne({
            habit: habitObject._id,
            user: userId
        }).lean()
    ])

    return attachProgressToHabit(habitObject, progress, checkins)
}

// Batch version: one query for all checkins/progress, then group by habit id.
const attachCheckinsToHabits = async (habits, userId) => {
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
        return attachProgressToHabit(
            habit,
            progressByHabit[habitId],
            checkinsByHabit[habitId] || []
        )
    })
}

// Allows personal owners and joined challenge participants to act on a habit.
const getHabitForUserAction = async (habitId, userId) => {
    const habit = await Habit.findById(habitId)

    if (!habit) {
        return { allowed: false, status: 404, error: 'No habit found with that id' }
    }

    if (habit.kind === 'personal') {
        return habit.user?.toString() === userId.toString()
            ? { allowed: true, habit }
            : { allowed: false, status: 404, error: 'No habit found with that id' }
    }

    const participation = await ChallengeParticipation.findOne({
        user: userId,
        challenge: habit.challenge,
        participationStatus: 'joined'
    }).select('_id')

    return participation
        ? { allowed: true, habit }
        : { allowed: false, status: 403, error: 'You must join this challenge before checking in.' }
}

// Forward update after a new period checkin; consecutive keys extend, gaps restart at 1.
const updateProgressAfterCheckin = async (habit, userId, checkedInAt, periodKey) => {
    const progress = await HabitProgress.findOne({
        user: userId,
        habit: habit._id
    })

    const currentStreak = !progress?.lastPeriodKey
        ? 1
        : isConsecutivePeriod(progress.lastPeriodKey, periodKey, habit.frequency)
            ? progress.currentStreak + 1
            : 1

    const bestStreak = Math.max(progress?.bestStreak || 0, currentStreak)

    // upsert creates the snapshot if missing; new returns the updated row for feed/response use.
    return HabitProgress.findOneAndUpdate(
        { user: userId, habit: habit._id },
        {
            currentStreak,
            bestStreak,
            lastCheckinAt: checkedInAt,
            lastPeriodKey: periodKey,
            totalCheckins: (progress?.totalCheckins || 0) + 1
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    )
}

// Rebuilds progress from Checkin rows after undo; countedPeriods ignores duplicate legacy rows.
const recomputeProgressFromCheckins = async (habit, userId) => {
    const checkins = await Checkin.find({
        habit: habit._id,
        user: userId
    }).sort({ date: 1, createdAt: 1 }).lean()

    if (checkins.length === 0) {
        await HabitProgress.findOneAndDelete({ user: userId, habit: habit._id })
        return null
    }

    let currentStreak = 0
    let bestStreak = 0
    let lastCheckinAt = null
    let lastPeriodKey = null
    const countedPeriods = new Set()

    for (const checkin of checkins) {
        const periodKey = checkin.periodKey || getPeriodKey(checkin.date, habit.frequency)
        if (countedPeriods.has(periodKey)) continue

        currentStreak = !lastPeriodKey
            ? 1
            : isConsecutivePeriod(lastPeriodKey, periodKey, habit.frequency)
                ? currentStreak + 1
                : 1

        bestStreak = Math.max(bestStreak, currentStreak)
        lastCheckinAt = checkin.date
        lastPeriodKey = periodKey
        countedPeriods.add(periodKey)
    }

    // If the latest checkin skipped more than one period, keep bestStreak but reset current.
    if (lastPeriodKey && periodsElapsedSinceKey(lastPeriodKey, new Date(), habit.frequency) > 1) {
        currentStreak = 0
    }

    return HabitProgress.findOneAndUpdate(
        { user: userId, habit: habit._id },
        {
            currentStreak,
            bestStreak,
            lastCheckinAt,
            lastPeriodKey,
            totalCheckins: countedPeriods.size
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    )
}


// GET all personal habits with checkins/progress attached for Today and Progress.
const getHabits = async (req, res) => {
    const habits = await Habit.find({ user: req.user._id }).sort({ createdAt: -1 })
    const habitsWithCheckins = await attachCheckinsToHabits(habits, req.user._id)
    res.status(200).json(habitsWithCheckins)
}


// GET one habit for a personal owner or joined challenge participant.
const getHabit = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Not a valid habit id' })
    }

    const access = await getHabitForUserAction(id, req.user._id)
    if (!access.allowed) {
        return res.status(access.status).json({ error: access.error })
    }

    const habitWithCheckins = await attachCheckinsToHabit(access.habit, req.user._id)
    res.status(200).json(habitWithCheckins)
}


// POST — create a new personal habit, linked to the logged-in user
const createHabit = async (req, res) => {
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
            user: req.user._id
        })

        const habitWithCheckins = await attachCheckinsToHabit(habit, req.user._id)
        res.status(201).json(habitWithCheckins)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


// DELETE a personal habit — only the owner can delete their habit
const deleteHabit = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Not a valid habit id' })
    }

    const habit = await Habit.findOneAndDelete({ _id: id, user: req.user._id })

    if (!habit) {
        return res.status(404).json({ error: 'No habit found with that id' })
    }

    const habitWithCheckins = await attachCheckinsToHabit(habit, req.user._id)
    await Promise.all([
        Checkin.deleteMany({ habit: habit._id, user: req.user._id }),
        HabitProgress.deleteMany({ habit: habit._id, user: req.user._id })
    ])

    res.status(200).json(habitWithCheckins)
}


// PATCH — partially update a personal habit — only the owner can update their habit
const updateHabit = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Not a valid habit id' })
    }

    const habit = await Habit.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { ...req.body },
        { new: true }
    )

    if (!habit) {
        return res.status(404).json({ error: 'No habit found with that id' })
    }

    const habitWithCheckins = await attachCheckinsToHabit(habit, req.user._id)
    res.status(200).json(habitWithCheckins)
}

// POST /api/habits/:id/checkin — records a checkin and updates per-user habit progress
const checkinHabit = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Not a valid habit id' })
    }

    const access = await getHabitForUserAction(id, req.user._id)
    if (!access.allowed) {
        return res.status(access.status).json({ error: access.error })
    }

    const habit = access.habit
    const now = new Date()
    const periodKey = getPeriodKey(now, habit.frequency)

    // App-level duplicate guard; the unique index below also protects concurrent clicks.
    const existingCheckin = await Checkin.findOne({
        habit: habit._id,
        user: req.user._id,
        periodKey
    })

    if (existingCheckin) {
        await recomputeProgressFromCheckins(habit, req.user._id)
        const habitWithCheckins = await attachCheckinsToHabit(habit, req.user._id)
        return res.status(200).json({ message: 'Already checked in for this period', habit: habitWithCheckins })
    }

    let checkin
    try {
        checkin = await Checkin.create({
            user: req.user._id,
            habit: habit._id,
            date: now,
            periodKey
        })
    } catch (error) {
        // 11000 = duplicate user/habit/periodKey from the unique checkin index.
        if (error.code === 11000) {
            await recomputeProgressFromCheckins(habit, req.user._id)
            const habitWithCheckins = await attachCheckinsToHabit(habit, req.user._id)
            return res.status(200).json({ message: 'Already checked in for this period', habit: habitWithCheckins })
        }
        return res.status(400).json({ error: error.message })
    }

    const progress = await updateProgressAfterCheckin(habit, req.user._id, now, periodKey)

    // Feed hook runs after progress so the activity carries the post-checkin streak.
    try {
        await recordCheckinActivity({ userId: req.user._id, habit, checkin, progress })
    } catch (error) {
        console.error('feed: failed to record checkin activity', error)
    }

    const habitWithCheckins = await attachCheckinsToHabit(habit, req.user._id)
    res.status(200).json({ message: 'Checkin logged successfully', habit: habitWithCheckins })
}

// POST /api/habits/:id/undo — reverses the most recent checkin and rebuilds per-user progress
const undoCheckin = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Not a valid habit id' })
    }

    const access = await getHabitForUserAction(id, req.user._id)
    if (!access.allowed) {
        return res.status(access.status).json({ error: access.error })
    }

    const habit = access.habit
    // Delete the newest raw checkin, then rebuild progress from the remaining history.
    const latestCheckin = await Checkin.findOne({
        habit: habit._id,
        user: req.user._id
    }).sort({ date: -1, createdAt: -1 })

    if (!latestCheckin) {
        return res.status(400).json({ error: 'No checkin to undo' })
    }

    await Checkin.deleteOne({ _id: latestCheckin._id })
    await recomputeProgressFromCheckins(habit, req.user._id)

    // Feed cleanup is isolated so an activity failure cannot break undo.
    try {
        await removeCheckinActivity(latestCheckin._id)
    } catch (error) {
        console.error('feed: failed to remove checkin activity', error)
    }

    const habitWithCheckins = await attachCheckinsToHabit(habit, req.user._id)
    res.status(200).json({ message: 'Checkin undone', habit: habitWithCheckins })
}

module.exports = {
    getHabits, getHabit, createHabit, deleteHabit, updateHabit, checkinHabit, undoCheckin
}
