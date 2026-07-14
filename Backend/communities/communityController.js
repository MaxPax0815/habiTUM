const crypto = require('crypto')
const mongoose = require('mongoose')
const User = require('../auth/userModel')
const Community = require('./communityModel')
const CommunityMembership = require('./communityMembershipModel')
const Challenge = require('../challenges/challengeModel')
const ChallengeParticipation = require('../challenges/challengeParticipationModel')
const CommunityPost = require('../communityPosts/communityPostModel')

const COMMUNITY_MANAGER_ROLES = ['admin', 'creator']

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const serializeCommunityMember = (membership) => {
    const user = membership.user || {}

    return {
        _id: membership._id,
        role: membership.role,
        membershipStatus: membership.membershipStatus,
        joinedAt: membership.joinedAt,
        user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email
        }
    }
}

const getCommunityManagerAccess = async (userId, communityId) => {
    const community = await Community.findById(communityId).select('createdBy')

    if (!community) {
        return { allowed: false, status: 404, error: 'Community not found.' }
    }

    if (community.createdBy.toString() === userId.toString()) {
        return { allowed: true, isCreator: true, community }
    }

    const membership = await CommunityMembership.findOne({
        user: userId,
        community: communityId,
        membershipStatus: 'accepted',
        role: { $in: COMMUNITY_MANAGER_ROLES }
    }).select('role')

    return membership
        ? { allowed: true, isCreator: membership.role === 'creator', community }
        : { allowed: false, status: 403, error: 'Only community admins or creators can view members.' }
}

// GET /api/communities
// Returns all communities the user can see, each annotated with this user's
// membership status, so the frontend knows whether to show "Join" or "Joined".
// Memberships and member counts are each fetched in a single query and merged
// via lookup objects to avoid a query per community.
const getCommunities = async (req, res) => {
    try {
        // One query for the user's community memberships, then map by community ID
        const memberships = await CommunityMembership.find({ user: req.user._id })
        const byCommunity = {}
        memberships.forEach((m) => { byCommunity[m.community.toString()] = m })

        // Private communities are hidden from everyone who isn't a member — they
        // are invite-only and must not appear in Discover. Public communities are
        // visible to all; private ones only surface for their own members (so
        // they still show under "Your communities"). Archived communities (owning
        // manager's subscription ended) stay hidden from everyone. Newest to oldest.
        const memberCommunityIds = memberships.map((m) => m.community)
        const communities = await Community.find({
            isArchived: { $ne: true },
            $or: [
                { isPrivate: false },
                { _id: { $in: memberCommunityIds } }
            ]
        }).sort({ createdAt: -1 })

        // Member counts for every community in one aggregate.
        const counts = await CommunityMembership.aggregate([
            { $group: { _id: "$community", count: { $sum: 1 } } }
        ])
        const countByCommunity = {}
        counts.forEach((c) => { countByCommunity[c._id.toString()] = c.count })

        const result = communities.map((c) => {
            const membership = byCommunity[c._id.toString()]
            return {
                ...c.toObject(),
                memberCount: countByCommunity[c._id.toString()] || 0,
                membershipStatus: membership ? membership.membershipStatus : null,
                myRole: membership ? membership.role : null
            }
        })

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// GET /api/communities/:id  — for the community dashboard page
const getCommunity = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }
    try {
        const community = await Community.findById(req.params.id)
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        const membership = await CommunityMembership.findOne({
            user: req.user._id,
            community: community._id
        })
        const memberCount = await CommunityMembership.countDocuments({
            community: community._id,
            membershipStatus: 'accepted'
        })

        res.status(200).json({
            ...community.toObject(),
            memberCount,
            membershipStatus: membership ? membership.membershipStatus : null,
            myRole: membership ? membership.role : null
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// GET /api/communities/:id/members — visible to accepted admins/creators.
const getCommunityMembers = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }

    try {
        const access = await getCommunityManagerAccess(req.user._id, req.params.id)
        if (!access.allowed) {
            return res.status(access.status).json({ error: access.error })
        }

        const memberships = await CommunityMembership.find({
            community: req.params.id,
            membershipStatus: 'accepted'
        })
            .populate('user', 'firstName lastName username email')
            .lean()

        const roleRank = { creator: 0, admin: 1, member: 2 }
        const members = memberships
            .sort((a, b) => {
                const roleDelta = (roleRank[a.role] ?? 3) - (roleRank[b.role] ?? 3)
                if (roleDelta !== 0) return roleDelta

                const aName = `${a.user?.firstName || ''} ${a.user?.lastName || ''} ${a.user?.username || ''}`.trim()
                const bName = `${b.user?.firstName || ''} ${b.user?.lastName || ''} ${b.user?.username || ''}`.trim()
                return aName.localeCompare(bName)
            })
            .map(serializeCommunityMember)

        res.status(200).json({
            members,
            canManageRoles: access.isCreator
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// PATCH /api/communities/:id/members/:membershipId — creator promotes/demotes admins.
const updateCommunityMemberRole = async (req, res) => {
    const { id, membershipId } = req.params
    const { role } = req.body

    if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }

    if (!isValidObjectId(membershipId)) {
        return res.status(400).json({ error: 'Not a valid membership id.' })
    }

    if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ error: 'Role must be admin or member.' })
    }

    try {
        const community = await Community.findById(id).select('createdBy')
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        if (community.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the community creator can change member roles.' })
        }

        const membership = await CommunityMembership.findOne({
            _id: membershipId,
            community: id,
            membershipStatus: 'accepted'
        }).populate('user', 'firstName lastName username email')

        if (!membership) {
            return res.status(404).json({ error: 'Community member not found.' })
        }

        if (membership.role === 'creator' || membership.user?._id?.toString() === community.createdBy.toString()) {
            return res.status(400).json({ error: 'The community creator role cannot be changed.' })
        }

        membership.role = role
        await membership.save()

        res.status(200).json(serializeCommunityMember(membership))
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// GET /api/communities/:id/challenges — challenges shown on the community page
const getCommunityChallenges = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }

    try {
        const community = await Community.findById(req.params.id).select('_id name')
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        const challenges = await Challenge.find({ community: community._id })
            .sort({ starts: -1, createdAt: -1 })
            .lean()

        const challengeIds = challenges.map((challenge) => challenge._id)
        const [participantCounts, currentUserParticipations] = await Promise.all([
            ChallengeParticipation.aggregate([
                {
                    $match: {
                        challenge: { $in: challengeIds },
                        participationStatus: 'joined'
                    }
                },
                { $group: { _id: '$challenge', count: { $sum: 1 } } }
            ]),
            ChallengeParticipation.find({
                challenge: { $in: challengeIds },
                user: req.user._id,
                participationStatus: 'joined'
            }).select('challenge').lean()
        ])
        const countByChallenge = {}
        participantCounts.forEach((item) => {
            countByChallenge[item._id.toString()] = item.count
        })
        const joinedChallengeIds = new Set(
            currentUserParticipations.map((participation) => participation.challenge.toString())
        )

        const result = challenges.map((challenge) => ({
            ...challenge,
            community: {
                _id: community._id,
                name: community.name
            },
            participantCount: countByChallenge[challenge._id.toString()] || 0,
            isJoined: joinedChallengeIds.has(challenge._id.toString())
        }))

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// POST /api/communities  — guarded by requireCommunityCreatorAccess
const createCommunity = async (req, res) => {
    const { name, description, logoUrl, isPrivate } = req.body

    if (!name) {
        return res.status(400).json({ error: 'Please provide a community name', emptyFields: ['name'] })
    }

    try {
        // Managers have a community limit based on their subscription tier.
        // Only active (non-archived) communities count toward the limit.
        const creator = await User.findById(req.user._id).select('accountType subscription maxCommunities')
        if (creator?.accountType === 'manager' || creator?.subscription === 'manager') {
            const ownedCount = await Community.countDocuments({
                createdBy: req.user._id,
                isArchived: { $ne: true }
            })
            const limit = creator.maxCommunities || 1
            if (ownedCount >= limit) {
                return res.status(403).json({
                    error: `Community limit reached (${limit}). Add more community slots from your profile page to create additional communities.`
                })
            }
        }

        // Only managers may create public communities. Premium (non-manager)
        // users are limited to private, invite-only communities, so force the
        // flag server-side regardless of what the client sent.
        const isManager = creator?.accountType === 'manager'
        const effectiveIsPrivate = isManager ? !!isPrivate : true

        const community = await Community.create({
            name,
            description,
            logoUrl,
            isPrivate: effectiveIsPrivate,
            createdBy: req.user._id
        })

        // The creator is automatically an accepted member with the 'creator' role.
        await CommunityMembership.create({
            user: req.user._id,
            community: community._id,
            role: 'creator',
            membershipStatus: 'accepted'
        })

        res.status(201).json(community)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// POST /api/communities/:id/join  — any authenticated user
const joinCommunity = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }
    try {
        const community = await Community.findById(req.params.id)
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        // Archived communities (owner's manager subscription ended) cannot be joined.
        if (community.isArchived) {
            return res.status(403).json({ error: 'This community is no longer active.' })
        }

        // Private communities are invite-only — they can only be joined through
        // an invite link (see joinCommunityByInvite), never by hitting this route
        // with a known id.
        if (community.isPrivate) {
            return res.status(403).json({ error: 'This community is invite only. Ask the creator for an invite link.' })
        }

        // The unique index on {user, community} prevents double-joins.
        // upsert keeps this idempotent if they click twice.
        const membership = await CommunityMembership.findOneAndUpdate(
            { user: req.user._id, community: community._id },
            { $setOnInsert: { role: 'member', membershipStatus: 'accepted' } },
            { new: true, upsert: true }
        )

        res.status(200).json(membership)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// DELETE /api/communities/:id/leave
const leaveCommunity = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }
    try {
        const community = await Community.findById(req.params.id).select('_id')
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        const communityChallenges = await Challenge.find({
            community: community._id
        }).select('_id').lean()
        const challengeIds = communityChallenges.map((challenge) => challenge._id)

        const challengeParticipationDeletion = await ChallengeParticipation.deleteMany({
            user: req.user._id,
            challenge: { $in: challengeIds },
            participationStatus: 'joined'
        })

        await CommunityMembership.findOneAndDelete({
            user: req.user._id,
            community: community._id
        })

        res.status(200).json({
            left: req.params.id,
            leftChallenges: challengeParticipationDeletion.deletedCount
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// DELETE /api/communities/:id
// Only the user who created the community may delete it. Removing the community
// also removes every membership row that points at it, so no orphans are left.
const deleteCommunity = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }
    try {
        const community = await Community.findById(req.params.id)
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        // ownership check — the account-type gate (manager/premium) is handled
        // by requireCommunityCreatorAccess on the route; this ensures you can
        // only delete a community you created yourself.
        if (community.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the creator can delete this community.' })
        }

        await Promise.all([
            Community.findByIdAndDelete(community._id),
            CommunityMembership.deleteMany({ community: community._id }),
            CommunityPost.deleteMany({ community: community._id })
        ])

        res.status(200).json({ deleted: community._id })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// GET /api/communities/:id/invite — the community's invite link code.
// Creator/admin only. The code is generated on first request, so communities
// that existed before this feature get one the first time someone invites.
const getInviteCode = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }
    try {
        const community = await Community.findById(req.params.id)
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        const membership = await CommunityMembership.findOne({
            user: req.user._id,
            community: community._id
        }).select('role')

        const isCreator = community.createdBy.toString() === req.user._id.toString()
        const isAdmin = membership && ['creator', 'admin'].includes(membership.role)
        if (!isCreator && !isAdmin) {
            return res.status(403).json({ error: 'Only the community creator can share an invite link.' })
        }

        if (!community.inviteCode) {
            community.inviteCode = crypto.randomBytes(16).toString('hex')
            await community.save()
        }

        res.status(200).json({ inviteCode: community.inviteCode })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// POST /api/communities/invite/:code/join — join via an invite link.
// requireAuth already ran, so only logged-in users get here. The invite IS the
// approval: membership is accepted immediately. Idempotent — following the same
// link twice just returns the existing membership.
const joinCommunityByInvite = async (req, res) => {
    try {
        const community = await Community.findOne({ inviteCode: req.params.code })
        if (!community) {
            return res.status(404).json({ error: 'This invite link is not valid.' })
        }
        if (community.isArchived) {
            return res.status(403).json({ error: 'This community is no longer active.' })
        }

        const existing = await CommunityMembership.findOne({
            user: req.user._id,
            community: community._id
        }).select('membershipStatus')

        if (existing?.membershipStatus === 'blocked') {
            return res.status(403).json({ error: 'You cannot join this community.' })
        }

        const membership = await CommunityMembership.findOneAndUpdate(
            { user: req.user._id, community: community._id },
            {
                $setOnInsert: { role: 'member' },
                $set: { membershipStatus: 'accepted' }
            },
            { new: true, upsert: true }
        )

        res.status(200).json({
            community: { _id: community._id, name: community.name },
            membership
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

module.exports = {
    getCommunities,
    getCommunity,
    getCommunityMembers,
    getCommunityChallenges,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    deleteCommunity,
    getInviteCode,
    joinCommunityByInvite,
    updateCommunityMemberRole
}
