const profanity = require('leo-profanity')

const normalizeForProfanityCheck = (value) =>
    String(value).replace(/[\p{P}\p{S}]+/gu, ' ')

const hasOffensiveProfileLanguage = ({ firstName, lastName, username }) =>
    [firstName, lastName, username].some((value) =>
        profanity.check(normalizeForProfanityCheck(value))
    )

module.exports = { hasOffensiveProfileLanguage }
