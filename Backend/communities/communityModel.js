const mongoose = require('mongoose')

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    logoUrl: {
        type: String,
        trim: true
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    // Unguessable code behind the community's invite link. Generated on first
    // use (see getInviteCode) so communities created before this feature still
    // work. sparse: those older communities have no code until someone asks.
    inviteCode: {
        type: String,
        unique: true,
        sparse: true
    },
    // Set when the owning manager's subscription ends: archived communities are
    // hidden from listings, cannot be joined, and don't count toward slot limits,
    // but stay in the database (soft delete, reversible on re-subscription).
    isArchived: {
        type: Boolean,
        default: false
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true })

// Community exposes virtual challenges/challengeCount from Challenge.community.
// These are populated at query time and are not stored as arrays on Community.
communitySchema.virtual('challenges', {
    ref: 'Challenge',
    localField: '_id',
    foreignField: 'community'
})

communitySchema.virtual('challengeCount', {
    ref: 'Challenge',
    localField: '_id',
    foreignField: 'community',
    count: true
})

communitySchema.set('toJSON', { virtuals: true })
communitySchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Community', communitySchema)
