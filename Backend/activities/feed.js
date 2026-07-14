// LEGACY SSE ticket router; active feed reads live on the communities router.
// Stream itself is mounted directly in server.js because EventSource cannot send Bearer headers.
const express = require('express')
const router = express.Router()

const { createTicket } = require('./feedController')
const requireAuth = require('../auth/requireAuth')

router.use(requireAuth)

// POST /api/feed/ticket
router.post('/ticket', createTicket)

module.exports = router
