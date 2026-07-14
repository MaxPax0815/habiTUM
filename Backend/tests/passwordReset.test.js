const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const bcrypt = require('bcrypt')

const config = require('../config')
const User = require('../auth/userModel')
const { forgotPassword, resetPassword } = require('../auth/userController')

const originalFindOne = User.findOne
const originalDirectPasswordReset = config.DIRECT_PASSWORD_RESET

const createResponse = () => {
    const result = { statusCode: 200, body: undefined }

    return {
        result,
        status(statusCode) {
            result.statusCode = statusCode
            return this
        },
        json(body) {
            result.body = body
            return this
        },
    }
}

test.afterEach(() => {
    User.findOne = originalFindOne
    config.DIRECT_PASSWORD_RESET = originalDirectPasswordReset
})

test('forgot password validates the email address', async () => {
    const missingResponse = createResponse()
    await forgotPassword({ body: {} }, missingResponse)
    assert.equal(missingResponse.result.statusCode, 400)
    assert.equal(missingResponse.result.body.error, 'Email is required.')

    const invalidResponse = createResponse()
    await forgotPassword({ body: { email: 'not-an-email' } }, invalidResponse)
    assert.equal(invalidResponse.result.statusCode, 400)
    assert.equal(invalidResponse.result.body.error, 'Email is not valid.')
})

test('forgot password is unavailable when direct reset is disabled', async () => {
    config.DIRECT_PASSWORD_RESET = false
    const response = createResponse()

    await forgotPassword({ body: { email: 'user@example.com' } }, response)

    assert.equal(response.result.statusCode, 503)
    assert.equal(response.result.body.error, 'Direct password reset is disabled.')
})

test('forgot password does not reveal whether an email is registered', async () => {
    config.DIRECT_PASSWORD_RESET = true
    let query
    User.findOne = async (receivedQuery) => {
        query = receivedQuery
        return null
    }
    const response = createResponse()

    await forgotPassword({ body: { email: '  USER@EXAMPLE.COM ' } }, response)

    assert.deepEqual(query, { email: 'user@example.com' })
    // Anti-enumeration: unknown emails get the SAME 200 + message as known
    // ones — just without a resetToken, so the client cannot navigate on.
    assert.equal(response.result.statusCode, 200)
    assert.equal(response.result.body.resetToken, undefined)
    assert.ok(response.result.body.message)
})

test('forgot password returns a random token but stores only its hash', async () => {
    config.DIRECT_PASSWORD_RESET = true
    let saveCalls = 0
    const user = {
        async save() {
            saveCalls += 1
        },
    }
    User.findOne = async () => user
    const before = Date.now()
    const response = createResponse()

    await forgotPassword({ body: { email: 'user@example.com' } }, response)

    const { resetToken, expiresInSeconds } = response.result.body
    assert.equal(response.result.statusCode, 200)
    assert.match(resetToken, /^[a-f0-9]{64}$/)
    assert.equal(expiresInSeconds, 900)
    assert.equal(saveCalls, 1)
    assert.notEqual(user.passwordResetToken, resetToken)
    assert.equal(
        user.passwordResetToken,
        crypto.createHash('sha256').update(resetToken).digest('hex')
    )
    assert.ok(user.passwordResetExpires instanceof Date)
    assert.ok(user.passwordResetExpires.getTime() >= before + 899_000)
    assert.ok(user.passwordResetExpires.getTime() <= Date.now() + 901_000)
})

test('requesting another reset token invalidates the previous token', async () => {
    config.DIRECT_PASSWORD_RESET = true
    const user = { async save() {} }
    User.findOne = async () => user

    const firstResponse = createResponse()
    await forgotPassword({ body: { email: 'user@example.com' } }, firstResponse)
    const firstHash = user.passwordResetToken

    const secondResponse = createResponse()
    await forgotPassword({ body: { email: 'user@example.com' } }, secondResponse)

    assert.notEqual(secondResponse.result.body.resetToken, firstResponse.result.body.resetToken)
    assert.notEqual(user.passwordResetToken, firstHash)
})

test('reset password rejects an invalid or expired token', async () => {
    User.findOne = async () => null
    const response = createResponse()

    await resetPassword(
        { params: { token: 'expired-token' }, body: { password: 'newpassword1' } },
        response
    )

    assert.equal(response.result.statusCode, 400)
    assert.equal(response.result.body.error, 'Token is invalid or has expired.')
})

test('reset password rejects weak passwords without changing the user', async () => {
    let saveCalls = 0
    const user = {
        password: 'original-hash',
        async save() {
            saveCalls += 1
        },
    }
    User.findOne = async () => user
    const response = createResponse()

    await resetPassword(
        { params: { token: 'valid-token' }, body: { password: 'weak' } },
        response
    )

    assert.equal(response.result.statusCode, 400)
    assert.equal(response.result.body.error, 'Password is not strong enough.')
    assert.equal(user.password, 'original-hash')
    assert.equal(saveCalls, 0)
})

test('reset password hashes the new password, clears the token, and prevents reuse', async () => {
    const plainToken = 'single-use-token'
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex')
    const user = {
        password: await bcrypt.hash('oldpassword1', 4),
        passwordResetToken: tokenHash,
        passwordResetExpires: new Date(Date.now() + 60_000),
        async save() {},
    }
    let receivedQuery
    User.findOne = async (query) => {
        receivedQuery = query
        return user.passwordResetToken === query.passwordResetToken ? user : null
    }

    const response = createResponse()
    await resetPassword(
        { params: { token: plainToken }, body: { password: 'newpassword1' } },
        response
    )

    assert.equal(response.result.statusCode, 200)
    assert.equal(receivedQuery.passwordResetToken, tokenHash)
    assert.ok(receivedQuery.passwordResetExpires.$gt <= Date.now())
    assert.equal(await bcrypt.compare('oldpassword1', user.password), false)
    assert.equal(await bcrypt.compare('newpassword1', user.password), true)
    assert.equal(user.passwordResetToken, undefined)
    assert.equal(user.passwordResetExpires, undefined)

    const replayResponse = createResponse()
    await resetPassword(
        { params: { token: plainToken }, body: { password: 'anotherpassword1' } },
        replayResponse
    )
    assert.equal(replayResponse.result.statusCode, 400)
    assert.equal(replayResponse.result.body.error, 'Token is invalid or has expired.')
})
