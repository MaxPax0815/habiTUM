// CRUD for community posts (announcements/events). Reads are open to anyone who
// can see the community; writes are restricted to the community's creator/admins.

const mongoose = require('mongoose')

const Challenge = require('../challenges/challengeModel')
const Community = require('../communities/communityModel')
const CommunityMembership = require('../communities/communityMembershipModel')
const CommunityPost = require('./communityPostModel')

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// Authorizes post management: the community creator, or an accepted admin/creator member.
const getCommunityManagementAccess = async (userId, communityId) => {
    const community = await Community.findById(communityId).select('createdBy')

    if (!community) {
        return { allowed: false, status: 404, error: 'Community not found.' }
    }

    if (community.createdBy.toString() === userId.toString()) {
        return { allowed: true, community }
    }

    const membership = await CommunityMembership.findOne({
        user: userId,
        community: communityId,
        membershipStatus: 'accepted',
        role: { $in: ['admin', 'creator'] }
    }).select('_id')

    return membership
        ? { allowed: true, community }
        : { allowed: false, status: 403, error: 'Only community admins or creators can manage posts.' }
}

const normalizeOptionalDate = (value) => {
    if (!value) return null

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
}

const normalizeOptionalText = (value) => {
    if (typeof value !== 'string') return undefined

    const trimmedValue = value.trim()
    return trimmedValue || undefined
}

const normalizeOptionalChallenge = async (challengeId, communityId) => {
    if (!challengeId) return null

    if (!isValidObjectId(challengeId)) {
        return { error: 'Not a valid challenge id.' }
    }

    const challenge = await Challenge.findOne({
        _id: challengeId,
        community: communityId
    }).select('_id')

    if (!challenge) {
        return { error: 'Challenge not found in this community.' }
    }

    return challenge._id
}

const getQueryLimit = (value) => {
    if (!value) return null

    const limit = Number.parseInt(value, 10)
    if (!Number.isFinite(limit) || limit <= 0) return null

    return Math.min(limit, 50)
}

const getCommunityPosts = async (req, res) => {
    const { id } = req.params

    if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }

    try {
        const community = await Community.findById(id).select('_id')
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' })
        }

        const limit = getQueryLimit(req.query.limit)

        let query = CommunityPost.find({ community: id })
            .populate('author', 'firstName lastName username')
            .populate('challenge', 'title')
            .sort({ pinned: -1, createdAt: -1 })

        if (limit) query = query.limit(limit)

        const posts = await query.lean()

        res.status(200).json(posts)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const createCommunityPost = async (req, res) => {
    const { id } = req.params

    if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }

    const { title, body, imageUrl, challenge, eventDate, pinned } = req.body
    const normalizedTitle = normalizeOptionalText(title)
    if (!normalizedTitle) {
        return res.status(400).json({ error: 'Please provide a post title.', emptyFields: ['title'] })
    }

    try {
        const access = await getCommunityManagementAccess(req.user._id, id)
        if (!access.allowed) {
            return res.status(access.status).json({ error: access.error })
        }

        const normalizedChallenge = await normalizeOptionalChallenge(challenge, id)
        if (normalizedChallenge?.error) {
            return res.status(400).json({ error: normalizedChallenge.error })
        }

        const normalizedEventDate = normalizeOptionalDate(eventDate)
        if (normalizedEventDate === undefined) {
            return res.status(400).json({ error: 'Event date is not valid.' })
        }

        const post = await CommunityPost.create({
            community: id,
            author: req.user._id,
            title: normalizedTitle,
            body: normalizeOptionalText(body),
            imageUrl: normalizeOptionalText(imageUrl),
            challenge: normalizedChallenge,
            eventDate: normalizedEventDate,
            pinned: Boolean(pinned)
        })

        const populatedPost = await CommunityPost.findById(post._id)
            .populate('author', 'firstName lastName username')
            .populate('challenge', 'title')
            .lean()

        res.status(201).json(populatedPost)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

const updateCommunityPost = async (req, res) => {
    const { id, postId } = req.params

    if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }

    if (!isValidObjectId(postId)) {
        return res.status(400).json({ error: 'Not a valid post id.' })
    }

    try {
        const access = await getCommunityManagementAccess(req.user._id, id)
        if (!access.allowed) {
            return res.status(access.status).json({ error: access.error })
        }

        // Only pinning can be toggled after creation; other fields are immutable.
        const updates = {}
        if (Object.prototype.hasOwnProperty.call(req.body, 'pinned')) {
            updates.pinned = Boolean(req.body.pinned)
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No supported post updates provided.' })
        }

        const post = await CommunityPost.findOneAndUpdate(
            { _id: postId, community: id },
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        )
            .populate('author', 'firstName lastName username')
            .populate('challenge', 'title')
            .lean()

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' })
        }

        res.status(200).json(post)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

const deleteCommunityPost = async (req, res) => {
    const { id, postId } = req.params

    if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Not a valid community id.' })
    }

    if (!isValidObjectId(postId)) {
        return res.status(400).json({ error: 'Not a valid post id.' })
    }

    try {
        const access = await getCommunityManagementAccess(req.user._id, id)
        if (!access.allowed) {
            return res.status(access.status).json({ error: access.error })
        }

        const post = await CommunityPost.findOneAndDelete({
            _id: postId,
            community: id
        })

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' })
        }

        res.status(200).json({ deleted: post._id })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

module.exports = {
    getCommunityPosts,
    createCommunityPost,
    updateCommunityPost,
    deleteCommunityPost
}
