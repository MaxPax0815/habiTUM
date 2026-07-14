const mongoose = require('mongoose')

const CHALLENGE_STATUSES = ['draft', 'active', 'finalized', 'cancelled']
const CHALLENGE_DIFFICULTIES = ['easy', 'medium', 'hard']

const challengeSchema = new mongoose.Schema({
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    starts: {
        type: Date,
        required: true
    },
    ends: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return !this.starts || value > this.starts
            },
            message: 'Challenge end date must be after start date.'
        }
    },
    status: {
        type: String,
        enum: CHALLENGE_STATUSES,
        // Challenges go live immediately — the draft stage is not used for now.
        // The enum keeps 'draft'/'finalized'/'cancelled' so a lifecycle (e.g.
        // auto-finalizing once `ends` has passed) can be added without a migration.
        default: 'active'
    },
    difficulty: {
        type: String,
        enum: CHALLENGE_DIFFICULTIES,
        default: 'medium'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true })

challengeSchema.index({ community: 1 })

module.exports = mongoose.model('Challenge', challengeSchema)
