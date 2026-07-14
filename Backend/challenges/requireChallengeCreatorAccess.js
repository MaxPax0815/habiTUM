const mongoose = require('mongoose')
const Community = require('../communities/communityModel')
const CommunityMembership = require('../communities/communityMembershipModel')
const Challenge = require('./challengeModel')

// Ownership helper: user must own the community or be accepted as admin/creator.
const hasCommunityManagementAccess = async (userId, communityId) => {
    const community = await Community.findById(communityId).select('createdBy')

    if (!community) {
        return { allowed: false, status: 404, error: 'Community not found.' }
    }

    // ObjectIds are objects; compare string values, not object identity.
    if (community.createdBy.toString() === userId.toString()) {
        return { allowed: true }
    }

    const membership = await CommunityMembership.findOne({
        user: userId,
        community: communityId,
        membershipStatus: 'accepted',
        role: { $in: ['admin', 'creator'] }
    }).select('_id')

    return membership
        ? { allowed: true }
        : { allowed: false, status: 403, error: 'Only community admins or creators can manage challenges.' }
}

// Shared middleware core: valid community id + community admin/creator access.
const requireChallengeCommunityAccess = async (req, res, next, communityId) => {
    if (!req.user?._id) {
        return res.status(401).json({ error: 'Authentication required.' })
    }

    if (!communityId) {
        return res.status(400).json({ error: 'Community is required.' })
    }

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }

    try {
        const communityAccess = await hasCommunityManagementAccess(req.user._id, communityId)
        if (!communityAccess.allowed) {
            return res.status(communityAccess.status).json({ error: communityAccess.error })
        }

        next()
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Create challenge: community id comes from the POST body.
const requireChallengeCreatorAccess = async (req, res, next) => {
    return requireChallengeCommunityAccess(req, res, next, req.body.community)
}

// Delete/manage challenge: resolve :id to its community, then reuse the shared gate.
const requireChallengeDeleteAccess = async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Not a valid challenge id.' })
    }

    try {
        const challenge = await Challenge.findById(req.params.id).select('community')

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found.' })
        }

        req.challenge = challenge
        return requireChallengeCommunityAccess(req, res, next, challenge.community)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    requireChallengeCreatorAccess,
    requireChallengeDeleteAccess,
    // Alias for non-delete challenge management routes that need the same :id gate.
    requireChallengeManageAccess: requireChallengeDeleteAccess
}
