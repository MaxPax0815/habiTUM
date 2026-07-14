// Backend entry point: configures Express middleware, mounts every API router,
// connects to MongoDB, and starts the daily streak-reset job before listening.

// Config reads secrets (MONGODB_URI, JWT_SECRET, Stripe keys) from the environment,
// loaded from Backend/.env — copy .env.example to .env to set them up.
const config = require('./config')

// Fail fast and clearly if a secret is missing, rather than deep inside a driver.
config.assertSecretsConfigured()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const habitRoutes = require('./habit/habits')
const challengeRoutes = require('./challenges/challenge')
const userRoutes = require('./auth/user')
const billingRoutes = require('./billing/stripeRoutes')
const { stripeWebhookHandler } = require('./billing/stripeWebhookController')
// Daily job that resets streaks for users who missed a check-in.
const { resetStreaks } = require('./habit/streakJob')
const communityRoutes = require('./communities/communities')
const feedRoutes = require('./activities/feed')
const { streamFeed } = require('./activities/feedController')
const managerRoutes = require('./manager/manager')

const app = express()

// Allow all origins in development; restrict to the frontend domain in production.
app.use(cors())

// The Stripe webhook must receive the raw request body to verify its signature,
// so it is registered before express.json() parses bodies into objects.
app.post(
    '/api/billing/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhookHandler
)

app.use(express.json())

// Request logger for development.
app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

app.use('/api/habits', habitRoutes)
app.use('/api/challenges', challengeRoutes)
app.use('/api/user', userRoutes)
app.use('/api/billing', billingRoutes)

// LEGACY SSE stream; active frontend uses authenticated cursor polling instead.
app.get('/api/communities/:id/feed/stream', streamFeed)

app.use('/api/communities', communityRoutes)
app.use('/api/feed', feedRoutes) // legacy ticket exchange for the SSE stream
app.use('/api/manager', managerRoutes)

mongoose.connect(config.MONGODB_URI)
    .then(async () => {
        // run the streak check once at boot — catches up after the server was off overnight
        await resetStreaks()

        // daily re-run for a process that stays up past midnight; setInterval
        // instead of cron since resetStreaks() is idempotent and timing-tolerant
        setInterval(() => {
            resetStreaks().catch((error) => console.error('[streakJob] scheduled run failed:', error))
        }, 24 * 60 * 60 * 1000)

        // only start the HTTP server after DB connection is confirmed
        app.listen(config.PORT, () => {
            console.log('Connected to DB and listening on port', config.PORT)
        })
    })
    .catch((error) => {
        console.log(error)
    })
