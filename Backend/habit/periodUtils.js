// Period-key math behind habit streaks: turns dates into daily/weekly bucket
// keys and decides whether consecutive check-ins keep a streak alive.
// The key format is mirrored on the frontend (Progress/analytics.js).

const MS_PER_DAY = 1000 * 60 * 60 * 24

const pad = (value) => String(value).padStart(2, '0')

// Normalizes to local midnight so period comparisons ignore the time of day.
const startOfDay = (date) => {
    const copy = new Date(date)
    copy.setHours(0, 0, 0, 0)
    return copy
}

// Moves any date back to its Monday; (getDay()+6)%7 rotates JS Sunday-first days to Monday-first.
const startOfWeek = (date) => {
    const copy = startOfDay(date)
    const daysSinceMonday = (copy.getDay() + 6) % 7
    copy.setDate(copy.getDate() - daysSinceMonday)
    return copy
}

// Builds a stable YYYY-MM-DD key; getMonth()+1 fixes JS zero-based months.
const formatDateKey = (date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Chooses the bucket start: daily habits use today, weekly habits use Monday.
const getPeriodStart = (date, frequency) => {
    return frequency === 'weekly' ? startOfWeek(date) : startOfDay(date)
}

// Public period key mirrored by Frontend Progress/analytics.js.
const getPeriodKey = (date, frequency) => {
    const periodType = frequency === 'weekly' ? 'weekly' : 'daily'
    return `${periodType}:${formatDateKey(getPeriodStart(date, frequency))}`
}

// Converts daily:/weekly:YYYY-MM-DD back to local midnight; bad keys return null.
const parsePeriodKey = (periodKey) => {
    if (!periodKey) return null

    const [, datePart] = periodKey.split(':')
    if (!datePart) return null

    const [year, month, day] = datePart.split('-').map(Number)
    if (!year || !month || !day) return null

    return startOfDay(new Date(year, month - 1, day))
}

// Calendar-day difference after midnight normalization, avoiding hour/DST noise.
const daysBetween = (earlier, later) => {
    const a = startOfDay(earlier)
    const b = startOfDay(later)
    return Math.round((b - a) / MS_PER_DAY)
}

// Adds whole habit periods: 1 day for daily, 7 days for weekly.
const addPeriods = (date, frequency, count) => {
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + (frequency === 'weekly' ? count * 7 : count))
    return nextDate
}

// Streak stays alive only if previous period + 1 equals the current period key.
const isConsecutivePeriod = (previousPeriodKey, currentPeriodKey, frequency) => {
    const previousStart = parsePeriodKey(previousPeriodKey)
    if (!previousStart) return false

    return getPeriodKey(addPeriods(previousStart, frequency, 1), frequency) === currentPeriodKey
}

// Returns periods between last checkin and now; >1 means the streak is stale.
const periodsElapsedSinceKey = (periodKey, now, frequency) => {
    const periodStart = parsePeriodKey(periodKey)
    if (!periodStart) return 0

    const currentPeriodStart = getPeriodStart(now, frequency)
    const elapsedDays = daysBetween(periodStart, currentPeriodStart)

    return frequency === 'weekly' ? Math.floor(elapsedDays / 7) : elapsedDays
}

module.exports = {
    getPeriodKey,
    isConsecutivePeriod,
    periodsElapsedSinceKey
}
