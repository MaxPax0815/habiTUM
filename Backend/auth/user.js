const express = require('express')

// Auth endpoint handlers: credentials, current user, pending-manager cancel, reset flow.
const { loginUser, signupUser, getMe, cancelPendingManagerSignup, forgotPassword, resetPassword } = require('./userController')
const requireAuth = require('./requireAuth')

const router = express.Router()

// Public: first token comes from login.
router.post('/login', loginUser)

// Public: signup also returns the initial token.
router.post('/signup', signupUser)

// Protected: refresh current account snapshot from a verified token.
router.get('/me', requireAuth, getMe)

// Protected: only manager_pending accounts can be hard-deleted.
router.delete('/pending-manager', requireAuth, cancelPendingManagerSignup)

// Public reset flow: user has no valid session yet, so no requireAuth.
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)

module.exports = router
