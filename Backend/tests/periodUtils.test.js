// Drift guard for the period-key contract: this fixture is duplicated in
// Frontend/src/pages/app/Progress/analytics.test.js — if you change getPeriodKey, both must pass.
const test = require('node:test')
const assert = require('node:assert')
const { getPeriodKey, isConsecutivePeriod } = require('../habit/periodUtils')

// [year, month(1-12), day, hour] → expected key; local-time Date args keep this TZ-independent
const PERIOD_KEY_FIXTURE = [
    { date: [2026, 7, 8, 14], frequency: 'daily', expected: 'daily:2026-07-08' },   // plain weekday
    { date: [2026, 7, 8, 14], frequency: 'weekly', expected: 'weekly:2026-07-06' }, // Wed → its Monday
    { date: [2026, 7, 12, 9], frequency: 'weekly', expected: 'weekly:2026-07-06' }, // Sun → SAME Monday
    { date: [2026, 7, 6, 0], frequency: 'weekly', expected: 'weekly:2026-07-06' },  // Monday maps to itself
    { date: [2026, 1, 1, 23], frequency: 'daily', expected: 'daily:2026-01-01' },   // zero-padding
    { date: [2026, 3, 1, 12], frequency: 'weekly', expected: 'weekly:2026-02-23' }, // week crosses month boundary
]

test('getPeriodKey matches the shared frontend/backend fixture', () => {
    for (const { date: [y, m, d, h], frequency, expected } of PERIOD_KEY_FIXTURE) {
        assert.equal(getPeriodKey(new Date(y, m - 1, d, h), frequency), expected)
    }
})

test('isConsecutivePeriod detects adjacent and gapped periods', () => {
    assert.equal(isConsecutivePeriod('daily:2026-07-07', 'daily:2026-07-08', 'daily'), true)
    assert.equal(isConsecutivePeriod('daily:2026-07-06', 'daily:2026-07-08', 'daily'), false)
    assert.equal(isConsecutivePeriod('weekly:2026-06-29', 'weekly:2026-07-06', 'weekly'), true)
    assert.equal(isConsecutivePeriod('weekly:2026-06-22', 'weekly:2026-07-06', 'weekly'), false)
})
