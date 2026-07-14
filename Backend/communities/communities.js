// Routing for communities, their posts, and their activity feed.

const express = require('express')
const router = express.Router()

const { getCommunities, getCommunity, getCommunityChallenges, getCommunityMembers, createCommunity, joinCommunity, leaveCommunity, deleteCommunity,
    getInviteCode, joinCommunityByInvite, updateCommunityMemberRole
} = require('./communityController')
const {
    getCommunityPosts,
    createCommunityPost,
    updateCommunityPost,
    deleteCommunityPost
} = require('../communityPosts/communityPostController')
const { getFeed, getFeedUpdates } = require('../activities/feedController')
const requireAuth = require('../auth/requireAuth')
const { requireCommunityCreatorAccess } = require('./requireCommunityCreatorAccess')

// All community routes, including active feed polling, need req.user from requireAuth.
router.use(requireAuth)

// GET /api/communities
router.get('/', getCommunities)

// POST /api/communities/invite/:code/join — join a (private) community via an
// invite link. Literal path, so it is registered before the /:id routes.
router.post('/invite/:code/join', joinCommunityByInvite)

// GET /api/communities/:id/invite — creator/admin fetches the invite link code
router.get('/:id/invite', getInviteCode)

// GET /api/communities/:id/feed/updates — active 5s polling delta.
router.get('/:id/feed/updates', getFeedUpdates)

// GET /api/communities/:id/feed — initial page/load more, members only.
router.get('/:id/feed', getFeed)

// GET /api/communities/:id/challenges
router.get('/:id/challenges', getCommunityChallenges)

// GET /api/communities/:id/members
router.get('/:id/members', getCommunityMembers)

// PATCH /api/communities/:id/members/:membershipId
router.patch('/:id/members/:membershipId', updateCommunityMemberRole)

// GET /api/communities/:id/posts
router.get('/:id/posts', getCommunityPosts)

// POST /api/communities/:id/posts
router.post('/:id/posts', createCommunityPost)

// PATCH /api/communities/:id/posts/:postId
router.patch('/:id/posts/:postId', updateCommunityPost)

// DELETE /api/communities/:id/posts/:postId
router.delete('/:id/posts/:postId', deleteCommunityPost)

// GET /api/communities/:id
router.get('/:id', getCommunity)

// POST /api/communities - only premium users or managers can create communities
router.post('/', requireCommunityCreatorAccess, createCommunity)

// POST /api/communities/:id/join - any authenticated user can join
router.post('/:id/join', joinCommunity)
 
// DELETE /api/communities/:id/leave
router.delete('/:id/leave', leaveCommunity)

// DELETE /api/communities/:id - only managers/premium, and only the creator (checked in controller)
router.delete('/:id', requireCommunityCreatorAccess, deleteCommunity)

module.exports = router
