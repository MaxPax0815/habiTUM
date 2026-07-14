const express = require('express')
const {
    createCheckoutSession,
    confirmCheckoutSession,
    createPortalSession,
    scheduleSubscriptionCancellation,
    getBillingInfo,
    createManagerCheckoutSession,
    updateManagerCommunities
} = require('./stripeController')
const requireAuth = require('../auth/requireAuth')

const router = express.Router()

// Create Stripe Checkout Session for logged-in users
router.post('/create-checkout-session', requireAuth, createCheckoutSession)
// Confirm a completed Checkout Session after Stripe redirects back to the app
router.post('/confirm-checkout-session', requireAuth, confirmCheckoutSession)
// Create Stripe portal session
router.post('/create-portal-session', requireAuth, createPortalSession)
// Cancel Subscription at the end of the month
router.post('/schedule-cancellation', requireAuth, scheduleSubscriptionCancellation)
// Get Billing Information
router.post('/info', requireAuth, getBillingInfo)
// Create the initial Stripe Checkout Session for a pending manager (called from ConfigureManagerPlan)
router.post('/create-manager-checkout', requireAuth, createManagerCheckoutSession)
// Add or remove community slots on an active manager subscription (delta = +1 or -1)
router.post('/update-manager-communities', requireAuth, updateManagerCommunities)

module.exports = router
