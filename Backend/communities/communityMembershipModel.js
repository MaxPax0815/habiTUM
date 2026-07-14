const mongoose = require('mongoose')

const COMMUNITY_ROLES = ['member', 'admin', 'creator']
// No 'pending' state: there is no approval queue anywhere in the product.
// Public communities are joined directly; private ones are joined via an invite
// link, and the invite itself IS the approval — both land on 'accepted'.
const MEMBERSHIP_STATUSES = ['accepted', 'rejected', 'blocked']

const communityMembershipSchema = new mongoose.Schema({
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
    role: {
        type: String,
        enum: COMMUNITY_ROLES,
        default: 'member'
    },
    membershipStatus: {
        type: String,
        enum: MEMBERSHIP_STATUSES,
        default: 'accepted'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

communityMembershipSchema.index({ user: 1, community: 1 }, { unique: true })

module.exports = mongoose.model('CommunityMembership', communityMembershipSchema)
