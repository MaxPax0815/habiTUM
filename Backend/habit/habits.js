// Routing for all /api/habits endpoints, including check-in and undo.

const express = require('express')
const router = express.Router()

const {
    createHabit,
    getHabits,
    getHabit,
    deleteHabit,
    updateHabit,
    checkinHabit,  // creates a check-in record and advances the habit's streak/state
    undoCheckin    // reverses the most recent check-in
} = require('./habitController')

// Every habit route is user-scoped, so all require a verified token.
const requireAuth = require('../auth/requireAuth')
router.use(requireAuth)

router.get('/', getHabits)
router.get('/:id', getHabit)
router.post('/', createHabit)
router.delete('/:id', deleteHabit)
router.patch('/:id', updateHabit)
router.post('/:id/checkin', checkinHabit)
router.post('/:id/undo', undoCheckin)

module.exports = router
