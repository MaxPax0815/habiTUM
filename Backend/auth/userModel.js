const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt') //hashes pw and introduces salt.
const validator = require('validator')//lib for validating strings.
const { hasOffensiveProfileLanguage } = require('./profileLanguage')

// Billing category: 'manager' only after verified Stripe payment, 'manager_pending' awaiting first payment.
const sub_types = ['free', 'premium', 'manager', 'manager_pending']
// Account role drives routing and the sidebar after login, kept separate from the billing subscription on purpose.
const account_types = ['user', 'manager']

const userSchema = new Schema ({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true,
        unique: false
    },
    lastName: {
        type: String,
        required: true,
        unique: false
    },
    birthday: {
        type: Date
    },
    billingInfo: {
        type: String,
        trim: true
    },
    // Effective billing tier (see sub_types).
    subscription: {
        type: String,
        enum: sub_types,
        default: 'free'
    },
    // Stripe mirror fields, kept in sync by the Stripe controllers/webhook.
    stripeCustomerId: {
        type: String
    },
    stripeSubscriptionId: {
        type: String
    },
    // Raw Stripe status, e.g. active, canceled, past_due.
    stripeSubscriptionStatus: {
        type: String
    },
    // End of the currently paid billing period.
    subscriptionCurrentPeriodEnd: {
        type: Date
    },
    subscriptionCancelAtPeriodEnd: {
        type: Boolean,
        default: false
    },
    subscriptionCancelAt: {
        type:Date
    },
    // Manager profile fields — stored at signup, used to build the Stripe line item
    institutionName: {
        type: String
    },
    maxCommunities: {
        type: Number,
        default: 0
    },
    // Community count chosen on the configure page, held here until Stripe payment
    // is verified. Promoted to maxCommunities on activation — a pending manager
    // must not have an active community limit before paying.
    pendingManagerCommunities: {
        type: Number
    },
    maxChallenges: {
        type: Number,
        default: 0
    },
    accountType: {
        type: String,
        enum: account_types,
        default: 'user' // all new accounts are regular users; manager accounts are created directly in the DB
    },
    passwordResetToken: { type: String },    // SHA-256 hash of the one-time reset token (the plain token is never stored)
    passwordResetExpires: { type: Date },     // 15-minute expiry window
}, { timestamps: true })

// Validates uniqueness and password strength, then stores the user with a bcrypt hash.
// Kept on the model so signup rules live in one place, out of the controller.
userSchema.statics.signup = async function (firstName, lastName, username, email, password) {
    if (!email || !password || !firstName || !lastName || !username) {
        throw Error('All fields must be filled.')
    }

    if (hasOffensiveProfileLanguage({ firstName, lastName, username })) {
        throw Error('First name, last name, and username must not contain offensive language.')
    }

    if (!validator.isEmail(email)) {
        throw Error('Email is not valid.')
    }

    const exists = await this.findOne({ email })
    if (exists) {
        throw Error('The email is already in use.')
    }

    const userExists = await this.findOne({ username })
    if (userExists) {
        throw Error('The username is already in use.')
    }

    if (!validator.isStrongPassword(password, { minLength: 4, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 0 })) {
        throw Error('Password is not strong enough.')
    }

    // Never store the plain password — only its salted bcrypt hash.
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = await this.create({ firstName, lastName, username, email, password: hash })

    return user
}

// Verifies credentials against the stored bcrypt hash; throws on any mismatch.
userSchema.statics.login = async function (email, password) {
    if (!email || !password) {throw Error('All fields must be filled.')}

    const user = await this.findOne({ email })
    if (!user) {throw Error('The email is not registered.')}

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {throw Error('The password is incorrect.')}

    return user
}

module.exports = mongoose.model('User', userSchema)
