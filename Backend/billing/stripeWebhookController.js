// Stripe webhook handling: the asynchronous source of truth for subscription
// state. Stripe delivers events here after checkout, renewals, and cancellations,
// and this file mirrors that state onto the MongoDB user.

const stripe = require('stripe')
const config = require('../config')
const User = require('../auth/userModel')
const Community = require('../communities/communityModel')

const stripeClient = stripe(config.STRIPE_SECRET_KEY)

// Mirror a Stripe subscription's state onto the matching user.
const syncSubscriptionToUser = async (subscription) => {
    const userId = subscription.metadata?.userId

    let user = null
    // Some events carry userId in metadata, others only the customer id,
    // so we need both lookup paths to reliably find the user.
    if (userId) {
        user = await User.findById(userId)
    }

    if (!user && subscription.customer) {
        user = await User.findOne({ stripeCustomerId: subscription.customer })
    }

    if (!user) {
        console.log('No user found for subscription:', subscription.id)
        return
    }

    const isActive = ['active', 'trialing'].includes(subscription.status)
    const currentPeriodEnd = subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end

    // role is stored in subscription_data.metadata at checkout-session creation time
    const role = subscription.metadata?.role
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
            // A previously active manager subscription has ended: lock manager
            // features and archive (soft-delete) the manager's communities so they
            // disappear from listings but remain in the database.
            user.subscription = 'free'
            await Community.updateMany(
                { createdBy: user._id, isArchived: { $ne: true } },
                { isArchived: true }
            )
            console.log(`Archived communities of manager ${user._id} after subscription end`)
        }
        // else: keep 'manager_pending' — incomplete/inactive subscription events
        // (e.g. during checkout) must not convert a pending manager to free.
    } else {
        user.subscription = isActive ? 'premium' : 'free'
    }

    user.stripeCustomerId = subscription.customer
    user.stripeSubscriptionId = subscription.id
    user.stripeSubscriptionStatus = subscription.status
    user.subscriptionCancelAtPeriodEnd = subscription.cancel_at_period_end

    if (currentPeriodEnd) {
        user.subscriptionCurrentPeriodEnd = new Date(currentPeriodEnd * 1000)
    }

    if (subscription.cancel_at) {
        user.subscriptionCancelAt = new Date(subscription.cancel_at * 1000)
    } else {
        user.subscriptionCancelAt = undefined
    }

    await user.save()

    console.log(`User ${user._id} updated to subscription: ${user.subscription}`)

}

const stripeWebhookHandler = async (req, res) => {
    const signature = req.headers['stripe-signature']

    let event

    // Verify the signature against the raw request body before trusting any
    // payload — this proves the event genuinely came from Stripe and was not forged.
    try {
        event = stripeClient.webhooks.constructEvent(
            req.body,
            signature,
            config.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        console.log('Webhook signature verification failed:', error.message)
        return res.status(400).send(`Webhook Error: ${error.message}`)
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object

                if (session.mode === 'subscription' && session.subscription) {
                    const subscription = await stripeClient.subscriptions.retrieve(
                        session.subscription
                    )

                    await syncSubscriptionToUser(subscription)
                }

                break
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object
                await syncSubscriptionToUser(subscription)
                break
            }

            default:
                console.log(`Unhandled Stripe event type: ${event.type}`)
        }

        res.status(200).json({ received: true })
    } catch (error) {
        console.log('Webhook handling failed:', error.message)
        res.status(500).json({ error: error.message })
    }
}

module.exports = { stripeWebhookHandler }
