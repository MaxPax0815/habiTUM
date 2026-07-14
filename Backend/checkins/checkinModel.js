const mongoose = require('mongoose')

// Immutable checkin log row; periodKey buckets daily/weekly completions.
const checkinSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    periodKey: {
        type: String,
        required: true
    },
    isPrivate: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

// Supports chronological habit history reads for analytics.
checkinSchema.index({ user: 1, habit: 1, date: 1 })

// Enforces one checkin per user/habit/period; duplicate inserts throw code 11000.
checkinSchema.index({ user: 1, habit: 1, periodKey: 1 }, { unique: true })

module.exports = mongoose.model('Checkin', checkinSchema)
