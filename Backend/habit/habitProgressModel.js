const mongoose = require('mongoose')

// Per-user streak snapshot; challenge habits share Habit docs but not progress rows.
const habitProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    habit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit',
        required: true
    },
    currentStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    bestStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    lastCheckinAt: {
        type: Date,
        default: null
    },
    lastPeriodKey: {
        type: String,
        default: null
    },
    totalCheckins: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true })

// One progress row per user+habit; undo can rebuild it from Checkin history.
habitProgressSchema.index({ user: 1, habit: 1 }, { unique: true })

// Supports challenge leaderboard-style reads by current streak.
habitProgressSchema.index({ habit: 1, currentStreak: -1 })
habitProgressSchema.index({ user: 1 })

module.exports = mongoose.model('HabitProgress', habitProgressSchema)
