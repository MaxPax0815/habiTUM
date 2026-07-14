const mongoose = require('mongoose')

const PARTICIPATION_STATUSES = ['joined', 'completed', 'left']

const challengeParticipationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    participationStatus: {
        type: String,
        enum: PARTICIPATION_STATUSES,
        default: 'joined'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    },
    leftAt: {
        type: Date,
        default: null
    }
}, { timestamps: true })

challengeParticipationSchema.index({ user: 1, challenge: 1 }, { unique: true })
challengeParticipationSchema.index({ challenge: 1, participationStatus: 1 })
challengeParticipationSchema.index({ user: 1, participationStatus: 1 })

module.exports = mongoose.model('ChallengeParticipation', challengeParticipationSchema)
