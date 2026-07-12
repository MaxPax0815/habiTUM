// Drift guard for the period-key contract: this fixture is duplicated in
// Backend/tests/periodUtils.test.js — if you change buildPeriodKey, both must pass.
import { describe, expect, test } from 'vitest'
import { buildPeriodKey } from './analytics'

// [year, month(1-12), day, hour] → expected key; local-time Date args keep this TZ-independent
const PERIOD_KEY_FIXTURE = [
  { date: [2026, 7, 8, 14], frequency: 'daily', expected: 'daily:2026-07-08' },   // plain weekday
  { date: [2026, 7, 8, 14], frequency: 'weekly', expected: 'weekly:2026-07-06' }, // Wed → its Monday
  { date: [2026, 7, 12, 9], frequency: 'weekly', expected: 'weekly:2026-07-06' }, // Sun → SAME Monday
  { date: [2026, 7, 6, 0], frequency: 'weekly', expected: 'weekly:2026-07-06' },  // Monday maps to itself
  { date: [2026, 1, 1, 23], frequency: 'daily', expected: 'daily:2026-01-01' },   // zero-padding
  { date: [2026, 3, 1, 12], frequency: 'weekly', expected: 'weekly:2026-02-23' }, // week crosses month boundary
]

describe('buildPeriodKey mirrors the backend getPeriodKey', () => {
  test('matches the shared frontend/backend fixture', () => {
    for (const { date: [y, m, d, h], frequency, expected } of PERIOD_KEY_FIXTURE) {
      expect(buildPeriodKey(new Date(y, m - 1, d, h), frequency)).toBe(expected)
    }
  })
})
