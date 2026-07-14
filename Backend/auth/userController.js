const crypto = require('crypto')
const stripe = require('stripe')
const User = require('./userModel')
const Community = require('../communities/communityModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const validator = require('validator')
const config = require('../config')

const stripeClient = stripe(config.STRIPE_SECRET_KEY)

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000

// Sign a 1-day JWT carrying the user id; the frontend sends it as a Bearer token.
const createToken = (_id) => {
    return jwt.sign({ _id }, config.JWT_SECRET, { expiresIn: '1d' })
}

// Login endpoint: verifies credentials, returns the UI account snapshot plus a fresh JWT.
const loginUser = async (req, res) => {
    const { email, password} = req.body

    try {
        const user = await User.login(email, password)

        const token = createToken(user._id)
        res.status(200).json({firstName: user.firstName, lastName: user.lastName, username: user.username, accountType: user.accountType, subscription: user.subscription, token })

    } catch (error) {res.status(400).json({error: error.message})}

}

// Signup endpoint: creates a user, then branches into free, premium checkout, or pending-manager onboarding.
// Premium rolls back the DB user if Stripe fails; manager persists as manager_pending until payment.
const signupUser = async (req, res) => {
    const { firstName, lastName, username, email, password, plan, institutionName } = req.body

    // Manager signup needs an institution before creating the DB user, avoiding orphaned invalid accounts.
    if (plan === 'manager') {
        if (!institutionName || !institutionName.trim()) {
            return res.status(400).json({ error: 'Institution name is required for manager accounts.' })
        }
    }

    try {
        // User.signup validates uniqueness/strength and stores only the bcrypt hash.
        const user = await User.signup(firstName, lastName, username, email, password)
        const token = createToken(user._id)

        // Premium: create a Stripe customer/session and return checkoutUrl for the frontend redirect.
        if (plan === 'premium') {
            try {
                const customer = await stripeClient.customers.create({
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    metadata: { userId: user._id.toString() }
                })
                user.stripeCustomerId = customer.id
                await user.save()

                const session = await stripeClient.checkout.sessions.create({
                    mode: 'subscription',
                    customer: customer.id,
                    line_items: [{ price: config.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
                    client_reference_id: user._id.toString(),
                    metadata: { userId: user._id.toString(), role: 'user' },
                    subscription_data: {
                        metadata: { userId: user._id.toString(), role: 'user' }
                    },
                    success_url: `${config.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${config.CLIENT_URL}/checkout/cancel`
                })

                return res.status(200).json({
                    firstName, lastName, username, email,
                    subscription: user.subscription,
                    accountType: user.accountType,
                    token,
                    checkoutUrl: session.url
                })
            } catch (stripeError) {
                // Stripe failed after Mongo create; delete the user so email/username can retry.
                await user.deleteOne()
                console.error('[signup/premium] Stripe error:', stripeError.message)
                return res.status(500).json({ error: 'Could not set up payment. Please try again.' })
            }
        }

        // Manager: save role now, but keep subscription manager_pending until the separate checkout succeeds.
        if (plan === 'manager') {
            user.accountType = 'manager'
            user.subscription = 'manager_pending'
            user.institutionName = institutionName.trim()
            await user.save()

            return res.status(200).json({
                firstName, lastName, username, email,
                subscription: 'manager_pending',
                accountType: 'manager',
                token
            })
        }

        // Free: no Stripe; same response shape as login so AuthContext can store it directly.
        res.status(200).json({ firstName, lastName, username, email, subscription: user.subscription, accountType: user.accountType, token })

    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// Current-user endpoint: re-reads fresh account/billing fields for AuthContext UPDATE_USER.
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select(
            'firstName lastName username email accountType subscription stripeSubscriptionStatus subscriptionCurrentPeriodEnd subscriptionCancelAtPeriodEnd subscriptionCancelAt institutionName maxCommunities'
        )

        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        const responseData = user.toObject()

        // Managers need this live count of non-archived communities for the plan-limit UI.
        if (user.accountType === 'manager') {
            responseData.activeCommunityCount = await Community.countDocuments({
                createdBy: req.user._id,
                isArchived: { $ne: true }
            })
        }

        res.status(200).json(responseData)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// DELETE /api/user/pending-manager: hard-deletes only unpaid manager_pending accounts.
// Safe because no payment/content exists yet; frees email/username for a fresh signup.
const cancelPendingManagerSignup = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        if (user.accountType !== 'manager' || user.subscription !== 'manager_pending') {
            return res.status(403).json({ error: 'Only pending manager accounts can be cancelled.' })
        }

        // Best-effort Stripe cleanup; local deletion still succeeds if Stripe is down.
        if (user.stripeCustomerId) {
            try {
                await stripeClient.customers.del(user.stripeCustomerId)
            } catch (stripeError) {
                console.error('[cancelPendingManagerSignup] Stripe cleanup failed:', stripeError.message)
            }
        }

        await user.deleteOne()

        res.status(200).json({ message: 'Pending manager signup cancelled.' })
    } catch (error) {
        console.error('[cancelPendingManagerSignup]', error.message)
        res.status(500).json({ error: error.message })
    }
}

// Demo reset endpoint: returns a one-time token to the browser instead of emailing it.
// This skips inbox ownership proof, so DIRECT_PASSWORD_RESET must stay off in production.
const forgotPassword = async (req, res) => {
    const email = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : ''

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' })
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Email is not valid.' })
    }

    if (!config.DIRECT_PASSWORD_RESET) {
        return res.status(503).json({ error: 'Direct password reset is disabled.' })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) {
            // Anti-enumeration: unknown emails get the same success message, just no token.
            return res.status(200).json({
                message: 'If an account exists for this email, the password reset has been prepared.',
            })
        }

        const plainToken = crypto.randomBytes(32).toString('hex')
        const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex') // store hash only

        user.passwordResetToken = hashedToken
        user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS)
        await user.save()

        res.status(200).json({
            message: 'If an account exists for this email, the password reset has been prepared.',
            resetToken: plainToken,
            expiresInSeconds: PASSWORD_RESET_TTL_MS / 1000,
        })
    } catch (error) {
        console.error('[forgotPassword] failed:', error.message)
        res.status(500).json({ error: 'Could not start password reset. Please try again.' })
    }
}

// Reset endpoint: hash URL token, require an unexpired match, then store a bcrypt hash and burn the token.
const resetPassword = async (req, res) => {
    const { token } = req.params
    const { password } = req.body

    if (!token || !password) {
        return res.status(400).json({ error: 'All fields must be filled.' })
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        })

        if (!user) {
            return res.status(400).json({ error: 'Token is invalid or has expired.' })
        }

        // Same strength rule as signup.
        if (!validator.isStrongPassword(password, { minLength: 4, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 0 })) {
            return res.status(400).json({ error: 'Password is not strong enough.' })
        }

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(password, salt)
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save()

        res.status(200).json({ message: 'Password reset successful.' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = { loginUser, signupUser, getMe, cancelPendingManagerSignup, forgotPassword, resetPassword }
