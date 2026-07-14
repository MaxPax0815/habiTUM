const test = require('node:test')
const assert = require('node:assert/strict')

const User = require('../auth/userModel')
const { hasOffensiveProfileLanguage } = require('../auth/profileLanguage')

test('profile language check accepts ordinary names and usernames', () => {
    assert.equal(hasOffensiveProfileLanguage({
        firstName: 'Alice',
        lastName: 'Smith',
        username: 'alice_92',
    }), false)
})

test('profile language check rejects offensive language in every profile field', () => {
    assert.equal(hasOffensiveProfileLanguage({
        firstName: 'shit',
        lastName: 'Smith',
        username: 'alice_92',
    }), true)
    assert.equal(hasOffensiveProfileLanguage({
        firstName: 'Alice',
        lastName: 'SHIT',
        username: 'alice_92',
    }), true)
    assert.equal(hasOffensiveProfileLanguage({
        firstName: 'Alice',
        lastName: 'Smith',
        username: 'shit_user',
    }), true)
})

test('signup rejects offensive profile language before accessing the database', async () => {
    await assert.rejects(
        User.signup('Alice', 'Smith', 'shit_user', 'alice@example.com', 'password1'),
        { message: 'First name, last name, and username must not contain offensive language.' }
    )
})
