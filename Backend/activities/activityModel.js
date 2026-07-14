const mongoose = require('mongoose')

// Activity rows are feed posts for challenge checkins, stamped with one resolved community.
const ACTIVITY_TYPES = ['checkin', 'streak_milestone']

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ACTIVITY_TYPES,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    habit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit',
        required: true
    },
    // Source checkin id lets undo revoke the exact feed item.
    checkin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Checkin',
        default: null
    },
    // Soft delete for undo; same-period re-checkin restores this document instead of duplicating.
    revoked: {
        type: Boolean,
        default: false
    },
    // Bumps on revoke/restore so cursors advance even when _id stays the same.
    feedVersion: {
        type: Number,
        default: 0
    },
    // Frozen render snapshot: old feed text should not change after renames or streak growth.
    // Also keeps feed reads join-free; the frontend formats from meta only.
    meta: {
        actorName: { type: String, required: true },
        habitTitle: { type: String, required: true },
        challengeTitle: { type: String, default: '' },
        streak: { type: Number, default: 0 },
        frequency: { type: String, enum: ['daily', 'weekly'], required: true },
        periodKey: { type: String, default: null }
    }
}, { timestamps: true })

// Initial feed pages sort by time-ordered _id and page with "older than this id".
activitySchema.index({ community: 1, _id: -1 })

// Polling/replay order: updatedAt, then version flips, then id for stable tie-breaks.
activitySchema.index({ community: 1, updatedAt: 1, feedVersion: 1, _id: 1 })

// DB spam guard: one post per user/habit/type/period; 11000 means restore/reuse.
activitySchema.index(
    { user: 1, habit: 1, type: 1, 'meta.periodKey': 1 },
    { unique: true }
)

module.exports = mongoose.model('Activity', activitySchema)
