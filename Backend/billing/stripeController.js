// Stripe request handlers for the authenticated user: starting premium and
// manager checkouts, confirming completed sessions on redirect, opening the
// billing portal, scheduling cancellation, and changing manager community slots.
// The webhook controller is the async counterpart that reacts to Stripe events.
const stripe = require('stripe')
const config = require('../config')
const User = require('../auth/userModel')
const Community = require('../communities/communityModel')

const stripeClient = stripe(config.STRIPE_SECRET_KEY)

const getSubscriptionPeriodEnd = (subscription) =>
    subscription.current_period_end ||
    subscription.items?.data?.[0]?.current_period_end

// sessionMetadata is the Stripe Checkout Session's metadata object.
// It carries 'role' (and other fields) that are NOT present on the subscription object itself,
// so we pass it separately to decide which subscription tier to grant.
const applySubscriptionToUser = async (user, subscription, sessionMetadata = {}) => {
    const isActive = ['active', 'trialing'].includes(subscription.status)
    const currentPeriodEnd = getSubscriptionPeriodEnd(subscription)

    // role is stored in the checkout session metadata at session-creation time (see userController/stripeController)
    // and also duplicated into subscription_data.metadata so webhooks can read it without the session
    const role = sessionMetadata.role || subscription.metadata?.role

    if (role === 'manager') {
        if (isActive) {
            user.subscription = 'manager'
            user.accountType = 'manager'
            // Promote the community count chosen before checkout — it only becomes
            // an active limit once Stripe has confirmed payment.
            if (user.pendingManagerCommunities) {
                user.maxCommunities = user.pendingManagerCommunities
                user.pendingManagerCommunities = undefined
            }
        } else if (user.subscription === 'manager') {
            // Previously active subscription ended → lock manager features.
            user.subscription = 'free'
        }
        // else: keep 'manager_pending' — an inactive/incomplete subscription event
        // must not silently convert a pending manager into a free user.
    } else {
        user.subscription = isActive ? 'premium' : 'free'
    }

    user.stripeCustomerId = subscription.customer
    user.stripeSubscriptionId = subscription.id
    user.stripeSubscriptionStatus = subscription.status
    user.subscriptionCancelAtPeriodEnd = subscription.cancel_at_period_end

    if (currentPeriodEnd) {
        // Stripe returns Unix timestamps in seconds; JS Date uses milliseconds
        user.subscriptionCurrentPeriodEnd = new Date(currentPeriodEnd * 1000)
    }

    user.subscriptionCancelAt = subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : undefined

    await user.save()
}

// Start a premium upgrade for the logged-in user by creating a Stripe Checkout Session.
const createCheckoutSession = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }
        if (user.subscription === 'premium') {
            return res.status(400).json({ error: 'User is already premium.' })
        }

        // Reuse the Stripe customer if one exists, otherwise create it once and
        // persist the id so future checkouts and the billing portal reuse it.
        let stripeCustomerId = user.stripeCustomerId
        if (!stripeCustomerId) {
            const customer = await stripeClient.customers.create({
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                metadata: {
                    userId: user._id.toString()
                }
            })

            stripeCustomerId = customer.id
            user.stripeCustomerId = stripeCustomerId
            await user.save()
        }

        // Create Checkout Session for monthly subscription
        const session = await stripeClient.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [
                {
                    price: config.STRIPE_PREMIUM_PRICE_ID,
                    quantity: 1
                }
            ],
            client_reference_id: user._id.toString(),
            metadata: {
                userId: user._id.toString()
            },
            subscription_data: {
                metadata: {
                    userId: user._id.toString()
                }
            },
            success_url: `${config.CLIENT_URL}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.CLIENT_URL}/profile?checkout=cancelled`
        })
        // The frontend redirects the browser to this hosted Stripe payment page.
        res.status(200).json({ url: session.url })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
}

// Confirm the session when Stripe redirects the authenticated user back to the
// app. This removes the race between the redirect and the asynchronous webhook.
const confirmCheckoutSession = async (req, res) => {
    try {
        const { sessionId } = req.body

        if (!sessionId) {
            return res.status(400).json({ error: 'Checkout session ID is required.' })
        }

        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription']
        })

        // Confirm the session was created for this user before granting access —
        // a client must not activate a subscription that belongs to someone else.
        const sessionUserId = session.client_reference_id || session.metadata?.userId
        if (sessionUserId !== user._id.toString()) {
            return res.status(403).json({ error: 'Checkout session does not belong to this user.' })
        }

        if (session.status !== 'complete' || session.mode !== 'subscription' || !session.subscription) {
            return res.status(400).json({ error: 'Checkout session is not complete.' })
        }

        const subscription = typeof session.subscription === 'string'
            ? await stripeClient.subscriptions.retrieve(session.subscription)
            : session.subscription

        // Pass the session metadata so applySubscriptionToUser knows the intended role (e.g. 'manager')
        await applySubscriptionToUser(user, subscription, session.metadata || {})

        res.status(200).json({
            subscription: user.subscription,
            accountType: user.accountType, // needed by CheckoutSuccess.jsx to decide where to redirect
            stripeSubscriptionStatus: user.stripeSubscriptionStatus,
            subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
            subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
            subscriptionCancelAt: user.subscriptionCancelAt
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
}

const createPortalSession = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        if (!user.stripeCustomerId) {
            return res.status(400).json({ error: 'No Stripe customer found for this user.' })
        }

        const portalSession = await stripeClient.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${config.CLIENT_URL}/profile`
        })

        res.status(200).json({ url: portalSession.url })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
}


const scheduleSubscriptionCancellation = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        if (!user.stripeSubscriptionId) {
            return res.status(400).json({ error: 'No active Stripe subscription found.' })
        }

        const updatedSubscription = await stripeClient.subscriptions.update(
            user.stripeSubscriptionId,
            {
                cancel_at_period_end: true
            }
        )

        const currentPeriodEnd = getSubscriptionPeriodEnd(updatedSubscription)

        // Stripe has accepted the cancellation, so persist the returned source
        // of truth before responding instead of waiting for a later webhook.
        await applySubscriptionToUser(user, updatedSubscription)

        res.status(200).json({
             message: 'Subscription will be canceled at the end of the billing period.',
            stripeSubscriptionStatus: updatedSubscription.status,
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
            currentPeriodEnd
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
}

const getBillingInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
            return res.status(200).json({
                plan: 'free',
                status: 'none',
                hasActiveSubscription: false
            })
        }

        const subscription = await stripeClient.subscriptions.retrieve(
            user.stripeSubscriptionId,
            {
                expand: ['default_payment_method', 'latest_invoice']
            }
        )

        const paymentMethod = subscription.default_payment_method

        const currentPeriodEnd =
            subscription.current_period_end ||
            subscription.items?.data?.[0]?.current_period_end

        res.status(200).json({
            plan: user.subscription,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: currentPeriodEnd
                ? new Date(currentPeriodEnd * 1000)
                : user.subscriptionCurrentPeriodEnd,
            cancelAt: subscription.cancel_at
                ? new Date(subscription.cancel_at * 1000)
                : user.subscriptionCancelAt,
            price: '3,99 € / month',
            paymentMethod: paymentMethod?.card
                ? {
                    brand: paymentMethod.card.brand,
                    last4: paymentMethod.card.last4,
                    expMonth: paymentMethod.card.exp_month,
                    expYear: paymentMethod.card.exp_year
                }
                : null
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
}

// Create the initial Stripe Checkout Session for a pending manager account.
// Called from ConfigureManagerPlan after the user has chosen their community count.
const createManagerCheckoutSession = async (req, res) => {
    const { numCommunities } = req.body

    try {
        const user = await User.findById(req.user._id)

        if (!user) return res.status(404).json({ error: 'User not found.' })
        if (user.accountType !== 'manager') return res.status(403).json({ error: 'Manager account required.' })
        if (user.subscription === 'manager') return res.status(400).json({ error: 'Subscription is already active.' })

        const parsedAdditional = parseInt(numCommunities) || 0
        if (parsedAdditional < 0 || parsedAdditional > config.STRIPE_MANAGER_MAX_ADDITIONAL_COMMUNITIES) {
            return res.status(400).json({ error: `Additional communities must be between 0 and ${config.STRIPE_MANAGER_MAX_ADDITIONAL_COMMUNITIES}.` })
        }

        const totalCommunities = config.STRIPE_MANAGER_BASE_COMMUNITIES + parsedAdditional
        // Not an active limit yet — promoted to maxCommunities only after verified payment
        user.pendingManagerCommunities = totalCommunities

        let stripeCustomerId = user.stripeCustomerId
        if (!stripeCustomerId) {
            const customer = await stripeClient.customers.create({
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                metadata: { userId: user._id.toString() }
            })
            stripeCustomerId = customer.id
            user.stripeCustomerId = stripeCustomerId
        }

        await user.save()

        const session = await stripeClient.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [
                { price: config.STRIPE_MANAGER_BASE_PRICE_ID, quantity: 1 },
                { price: config.STRIPE_MANAGER_COMMUNITY_SLOT_PRICE_ID, quantity: totalCommunities }
            ],
            client_reference_id: user._id.toString(),
            metadata: {
                userId: user._id.toString(),
                role: 'manager',
                totalCommunities: String(totalCommunities)
            },
            subscription_data: {
                metadata: { userId: user._id.toString(), role: 'manager' }
            },
            success_url: `${config.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.CLIENT_URL}/configure-manager-plan`
        })

        res.status(200).json({ url: session.url })
    } catch (error) {
        console.error('[createManagerCheckoutSession]', error.message)
        res.status(500).json({ error: error.message })
    }
}

// Update the number of community slots for an active manager subscription.
// delta > 0 adds slots, delta < 0 removes them.
// The Stripe subscription is updated with a prorated price_data line item.
const updateManagerCommunities = async (req, res) => {
    const { delta } = req.body

    if (!Number.isInteger(delta) || delta === 0) {
        return res.status(400).json({ error: 'delta must be a non-zero integer.' })
    }

    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        if (user.subscription !== 'manager') {
            return res.status(403).json({ error: 'An active manager subscription is required.' })
        }

        if (!user.stripeSubscriptionId) {
            return res.status(400).json({ error: 'No active Stripe subscription found.' })
        }

        const subscription = await stripeClient.subscriptions.retrieve(user.stripeSubscriptionId)

        // The subscription has two fixed-price items: the base plan (quantity 1)
        // and the community slot item (quantity = total communities, minimum 1).
        // Identify the slot item by its price ID — never rely on item order.
        const slotItem = subscription.items.data.find(
            (item) => item.price?.id === config.STRIPE_MANAGER_COMMUNITY_SLOT_PRICE_ID
        )

        const currentMax = user.maxCommunities || config.STRIPE_MANAGER_BASE_COMMUNITIES
        const newMax = currentMax + delta
        const newAdditional = newMax - config.STRIPE_MANAGER_BASE_COMMUNITIES

        if (newMax < config.STRIPE_MANAGER_BASE_COMMUNITIES) {
            return res.status(400).json({
                error: `The base plan already includes ${config.STRIPE_MANAGER_BASE_COMMUNITIES} communit${config.STRIPE_MANAGER_BASE_COMMUNITIES === 1 ? 'y' : 'ies'}. You cannot go below that.`
            })
        }

        if (newAdditional > config.STRIPE_MANAGER_MAX_ADDITIONAL_COMMUNITIES) {
            return res.status(400).json({
                error: `Maximum ${config.STRIPE_MANAGER_MAX_ADDITIONAL_COMMUNITIES} additional communities allowed (${config.STRIPE_MANAGER_BASE_COMMUNITIES + config.STRIPE_MANAGER_MAX_ADDITIONAL_COMMUNITIES} total).`
            })
        }

        // When reducing, verify the manager hasn't exceeded the new limit already.
        // Only active (non-archived) communities count toward the limit.
        if (delta < 0) {
            const activeCommunities = await Community.countDocuments({
                createdBy: user._id,
                isArchived: { $ne: true }
            })
            if (activeCommunities > newMax) {
                return res.status(400).json({
                    error: `You currently have ${activeCommunities} active communit${activeCommunities === 1 ? 'y' : 'ies'}. Please delete at least ${activeCommunities - newMax} before reducing your slots.`
                })
            }
        }

        // Fixed-price model: just change the quantity on the slot item — no new
        // products or prices are ever created. Stripe prorates the difference.
        if (slotItem) {
            await stripeClient.subscriptions.update(user.stripeSubscriptionId, {
                items: [{ id: slotItem.id, quantity: newMax }],
                proration_behavior: 'create_prorations'
            })
        } else {
            // Defensive fallback: subscription predates the two-item model —
            // attach the slot item so future updates take the branch above.
            await stripeClient.subscriptions.update(user.stripeSubscriptionId, {
                items: [{ price: config.STRIPE_MANAGER_COMMUNITY_SLOT_PRICE_ID, quantity: newMax }],
                proration_behavior: 'create_prorations'
            })
        }

        user.maxCommunities = newMax
        await user.save()

        const activeCommunityCount = await Community.countDocuments({
            createdBy: user._id,
            isArchived: { $ne: true }
        })

        res.status(200).json({ maxCommunities: user.maxCommunities, activeCommunityCount })
    } catch (error) {
        console.error('[updateManagerCommunities]', error.message)
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    createCheckoutSession,
    confirmCheckoutSession,
    createPortalSession,
    scheduleSubscriptionCancellation,
    getBillingInfo,
    createManagerCheckoutSession,
    updateManagerCommunities
}
