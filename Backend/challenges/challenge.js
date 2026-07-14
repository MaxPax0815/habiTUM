const express = require('express')
const router = express.Router()

const {
    createChallenge,
    updateChallenge,
    deleteChallenge,
    joinChallenge,
    leaveChallenge,
    getChallengeHabits,
    getChallengeLeaderboard,
    createChallengeHabit,
    getJoinedChallenges,
    getTrendingChallenges,
    getChallengePreview
} = require('./challengeController')
const requireAuth = require('../auth/requireAuth')
const {
    requireChallengeCreatorAccess,
    requireChallengeDeleteAccess,
    requireChallengeManageAccess
} = require('./requireChallengeCreatorAccess')

// PUBLIC routes — registered before requireAuth so the logged-out landing page
// can load trending challenges and a read-only challenge preview without a token.
router.get('/trending', getTrendingChallenges)
router.get('/:id/preview', getChallengePreview)

router.use(requireAuth)

// GET /api/challenges/joined — the user's active joined challenges (Home panel)
router.get('/joined', getJoinedChallenges)

router.get('/:id/leaderboard', getChallengeLeaderboard)
router.get('/:id/habits', getChallengeHabits)
router.post('/', requireChallengeCreatorAccess, createChallenge)
// POST /api/challenges/:id/habits — community creator/admin adds a challenge habit
router.post('/:id/habits', requireChallengeManageAccess, createChallengeHabit)
router.post('/:id/join', joinChallenge)
router.delete('/:id/leave', leaveChallenge)
// PATCH /api/challenges/:id — community creator/admin edits the challenge
router.patch('/:id', requireChallengeManageAccess, updateChallenge)
router.delete('/:id', requireChallengeDeleteAccess, deleteChallenge)

module.exports = router
