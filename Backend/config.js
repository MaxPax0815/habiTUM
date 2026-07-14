// CONFIG.JS — Central configuration file.
//
// Secrets (database URI, JWT signing key, Stripe keys) are NEVER hardcoded here:
// they are read from the environment, loaded from Backend/.env locally and set as
// real environment variables in production. Copy .env.example to .env and fill it
// in. Non-secret values (Stripe price IDs, prices, URLs) keep committed defaults
// so the project still runs with minimal setup.

require('dotenv').config()

// The Stripe SDK throws at construction when handed an undefined key, and several
// controllers build their client at import time. This placeholder keeps those
// imports (and the test suite, which never calls Stripe) working when no key is
// configured; assertSecretsConfigured below stops the server from actually booting.
const STRIPE_KEY_PLACEHOLDER = 'sk_test_not_configured'

// Secrets that must come from the environment — the server refuses to start without them.
const REQUIRED_SECRETS = [
    'MONGODB_URI',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
]

module.exports = {
    // The TCP port the Express server listens on. 4000 for local DEV, 8080 for Docker.
    PORT: process.env.PORT || 4000,

    // ---- Secrets: environment only, no fallbacks ----

    // MongoDB Atlas connection (contains the database password).
    MONGODB_URI: process.env.MONGODB_URI,

    // Single secret key used to sign every token and to verify every token.
    JWT_SECRET: process.env.JWT_SECRET,

    // Stripe sandbox secret key.
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || STRIPE_KEY_PLACEHOLDER,

    // Verifies incoming Stripe webhook signatures.
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    // ---- Non-secrets: safe to commit, overridable via the environment ----

    // Stripe price identifiers. These are public identifiers, not credentials.
    STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID
        || 'price_1Tm8AFPfbbKryRmHQTjOvGiJ',

    // Manager Base Plan Price ID (for 1 community + unlimited challenges)
    STRIPE_MANAGER_BASE_PRICE_ID: process.env.STRIPE_MANAGER_BASE_PRICE_ID
        || 'price_1TrH75PfbbKryRmHRfE8ksF2',

    // Manager Additional Community Price ID (for each additional community beyond the 1 included in the base)
    STRIPE_MANAGER_COMMUNITY_SLOT_PRICE_ID: process.env.STRIPE_MANAGER_COMMUNITY_SLOT_PRICE_ID
        || 'price_1TrH8JPfbbKryRmHQtEgrHZw',

    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

    // Manager plan pricing (all values in euro cents, easy to change here)
    // Base monthly fee includes 1 community and unlimited challenges
    STRIPE_MANAGER_BASE_PRICE_CENTS: 4500,    // 45 €
    // Monthly cost per additional community (beyond the 1 included in the base)
    STRIPE_MANAGER_COMMUNITY_PRICE_CENTS: 500,  // 5 €
    // Number of communities included in the base fee
    STRIPE_MANAGER_BASE_COMMUNITIES: 1,
    // Maximum number of additional communities a manager can add (beyond the base)
    STRIPE_MANAGER_MAX_ADDITIONAL_COMMUNITIES: 15,

    // Demo-only: returning a reset token to the browser removes identity verification.
    // Default on for local development, off in production unless explicitly enabled.
    DIRECT_PASSWORD_RESET: process.env.DIRECT_PASSWORD_RESET === 'true'
        || (process.env.DIRECT_PASSWORD_RESET === undefined && process.env.NODE_ENV !== 'production'),

    // Called by the server and the CLI scripts before they do any real work, so a
    // missing secret produces a clear message instead of an obscure driver error.
    assertSecretsConfigured() {
        const missing = REQUIRED_SECRETS.filter((name) => !process.env[name])

        if (missing.length > 0) {
            throw new Error(
                `Missing required environment variable(s): ${missing.join(', ')}.\n`
                + 'Copy Backend/.env.example to Backend/.env and fill in the values.'
            )
        }
    },
}
