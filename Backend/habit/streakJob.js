const HabitProgress = require('./habitProgressModel')
const { periodsElapsedSinceKey } = require('./periodUtils')

// Passive reset over per-user HabitProgress rows; shared challenge habits need separate streaks.
async function resetStreaks() {
    const now = new Date()

    // populate('habit','frequency') joins only frequency so period math can run per habit.
    const candidates = await HabitProgress.find({
        currentStreak: { $gt: 0 },
        lastPeriodKey: { $ne: null }
    }).populate('habit', 'frequency')

    let brokenCount = 0
    for (const progress of candidates) {
        if (!progress.habit) continue

        // >1 elapsed periods means the user missed a full period, so currentStreak is stale.
        if (periodsElapsedSinceKey(progress.lastPeriodKey, now, progress.habit.frequency) > 1) {
            progress.currentStreak = 0
            await progress.save()
            brokenCount++
        }
    }

    console.log(`[streakJob] checked ${candidates.length} progress records, reset ${brokenCount}`)
}

// Optional scheduler target: run resetStreaks shortly after midnight if cron is re-enabled.

module.exports = { resetStreaks } // server.js can run this once at boot or from a scheduler.
