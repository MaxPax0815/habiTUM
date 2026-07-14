const mongoose = require('mongoose')
const stripe = require('stripe')

const config = require('../config')

config.assertSecretsConfigured()

const User = require('../auth/userModel')

const stripeClient = stripe(config.STRIPE_SECRET_KEY)

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing']
const SEEDED_MANAGER_METADATA = {
    habitumDemo: 'true',
    habitumRole: 'manager'
}

const isUsableStripeId = (id, prefix) => {
    return typeof id === 'string' && id.startsWith(`${prefix}_`) && !id.includes('_mock_')
}

const getPeriodEnd = (subscription) => {
    return subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end
}

const getManagerCommunityCount = (manager) => {
    const maxCommunities = Number(manager.maxCommunities)
    return Number.isFinite(maxCommunities) && maxCommunities > 0
        ? maxCommunities
        : config.STRIPE_MANAGER_BASE_COMMUNITIES
}

const getManagerSubscriptionMetadata = (manager) => ({
    ...SEEDED_MANAGER_METADATA,
    userId: manager._id.toString(),
    username: manager.username,
    role: 'manager'
})

const retrieveCustomer = async (customerId) => {
    if (!isUsableStripeId(customerId, 'cus')) return null

    try {
        const customer = await stripeClient.customers.retrieve(customerId)
        return customer?.deleted ? null : customer
    } catch (error) {
        if (error.type === 'StripeInvalidRequestError') return null
        throw error
    }
}

const findCustomerByEmail = async (email) => {
    if (!email) return null

    const customers = await stripeClient.customers.list({ email, limit: 10 })
    return customers.data.find((customer) => !customer.deleted) || null
}

const ensureCustomer = async (manager) => {
    const existingCustomer = await retrieveCustomer(manager.stripeCustomerId)
    const emailCustomer = existingCustomer || await findCustomerByEmail(manager.email)

    if (emailCustomer) {
        return stripeClient.customers.update(emailCustomer.id, {
            email: manager.email,
            name: `${manager.firstName} ${manager.lastName}`,
            metadata: {
                ...emailCustomer.metadata,
                ...SEEDED_MANAGER_METADATA,
                userId: manager._id.toString(),
                username: manager.username
            }
        })
    }

    return stripeClient.customers.create({
        email: manager.email,
        name: `${manager.firstName} ${manager.lastName}`,
        metadata: {
            ...SEEDED_MANAGER_METADATA,
            userId: manager._id.toString(),
            username: manager.username
        }
    })
}

const ensureDefaultPaymentMethod = async (customer, manager) => {
    if (customer.invoice_settings?.default_payment_method) {
        return customer.invoice_settings.default_payment_method
    }

    const paymentMethod = await stripeClient.paymentMethods.create({
        type: 'card',
        card: { token: 'tok_visa' },
        billing_details: {
            email: manager.email,
            name: `${manager.firstName} ${manager.lastName}`
        }
    })

    await stripeClient.paymentMethods.attach(paymentMethod.id, { customer: customer.id })
    await stripeClient.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethod.id }
    })

    return paymentMethod.id
}

const hasManagerPlanItems = (subscription) => {
    const priceIds = new Set(subscription.items?.data?.map((item) => item.price?.id))
    return priceIds.has(config.STRIPE_MANAGER_BASE_PRICE_ID)
        && priceIds.has(config.STRIPE_MANAGER_COMMUNITY_SLOT_PRICE_ID)
}

const retrieveSubscription = async (subscriptionId, customerId) => {
    if (!isUsableStripeId(subscriptionId, 'sub')) return null

    try {
        const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)
        if (subscription.customer !== customerId) return null
        if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) return null
        if (!hasManagerPlanItems(subscription)) return null
        return subscription
    } catch (error) {
        if (error.type === 'StripeInvalidRequestError') return null
        throw error
    }
}

const findReusableSubscription = async (manager, customerId) => {
    const existingSubscription = await retrieveSubscription(manager.stripeSubscriptionId, customerId)
    if (existingSubscription) return existingSubscription

    const subscriptions = await stripeClient.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 100
    })

    return subscriptions.data.find((subscription) =>
        ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status) && hasManagerPlanItems(subscription)
    ) || null
}

const ensureManagerSubscriptionItems = async (subscription, manager) => {
    const targetCommunityCount = getManagerCommunityCount(manager)
    const communitySlotItem = subscription.items.data.find((item) =>
        item.price?.id === config.STRIPE_MANAGER_COMMUNITY_SLOT_PRICE_ID
    )
    const updates = {
        metadata: getManagerSubscriptionMetadata(manager)
    }

    if (!communitySlotItem || communitySlotItem.quantity !== targetCommunityCount) {
        updates.proration_behavior = 'none'
        updates.items = communitySlotItem
            ? [{ id: communitySlotItem.id, quantity: targetCommunityCount }]
            : [{ price: config.STRIPE_MANAGER_COMMUNITY_SLOT_PRICE_ID, quantity: targetCommunityCount }]
    }

    return stripeClient.subscriptions.update(subscription.id, updates)
}

const createManagerSubscription = async (manager, customer, defaultPaymentMethod) => {
    return stripeClient.subscriptions.create({
        customer: customer.id,
        default_payment_method: defaultPaymentMethod,
        items: [
            { price: config.STRIPE_MANAGER_BASE_PRICE_ID, quantity: 1 },
            { price: config.STRIPE_MANAGER_COMMUNITY_SLOT_PRICE_ID, quantity: getManagerCommunityCount(manager) }
        ],
        metadata: getManagerSubscriptionMetadata(manager)
    })
}

const syncManagerRecord = async (manager, subscription) => {
    const periodEnd = getPeriodEnd(subscription)

    manager.accountType = 'manager'
    manager.subscription = ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status) ? 'manager' : manager.subscription
    manager.stripeCustomerId = subscription.customer
    manager.stripeSubscriptionId = subscription.id
    manager.stripeSubscriptionStatus = subscription.status
    manager.subscriptionCancelAtPeriodEnd = subscription.cancel_at_period_end
    manager.subscriptionCancelAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : undefined

    if (periodEnd) {
        manager.subscriptionCurrentPeriodEnd = new Date(periodEnd * 1000)
    }

    await manager.save()
}

const syncOneManager = async (manager) => {
    const customer = await ensureCustomer(manager)
    const defaultPaymentMethod = await ensureDefaultPaymentMethod(customer, manager)
    const reusableSubscription = await findReusableSubscription(manager, customer.id)
    const subscription = reusableSubscription
        ? await ensureManagerSubscriptionItems(reusableSubscription, manager)
        : await createManagerSubscription(manager, customer, defaultPaymentMethod)

    await syncManagerRecord(manager, subscription)

    return {
        email: manager.email,
        username: manager.username,
        stripeCustomerId: manager.stripeCustomerId,
        stripeSubscriptionId: manager.stripeSubscriptionId,
        stripeSubscriptionStatus: manager.stripeSubscriptionStatus
    }
}

const syncManagerStripeSubscriptions = async ({ managerIds } = {}) => {
    const query = { accountType: 'manager' }
    if (managerIds?.length) {
        query._id = { $in: managerIds }
    }

    const managers = await User.find(query).sort({ email: 1 })
    const results = []

    for (const manager of managers) {
        const result = await syncOneManager(manager)
        results.push(result)
        console.log(`Synced manager ${result.email}: ${result.stripeSubscriptionId}`)
    }

    return results
}

const run = async () => {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 120000
    })

    const results = await syncManagerStripeSubscriptions()
    console.log(`Synced ${results.length} manager Stripe subscriptions.`)
}

if (require.main === module) {
    run()
        .catch((error) => {
            console.error(error)
            process.exitCode = 1
        })
        .finally(async () => {
            await mongoose.disconnect()
        })
}

module.exports = {
    syncManagerStripeSubscriptions
}
