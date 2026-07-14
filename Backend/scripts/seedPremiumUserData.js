// seedPremiumUserData.js
// Adds ~one month of highly realistic personal habit + check-in data for premium@test.com.
// Safe to re-run: removes only the user's personal habits, their checkins, and their
// HabitProgress records before reinserting — challenge data is left untouched.
//
// Run from the Backend/ directory:
//   node scripts/seedPremiumUserData.js

'use strict'

const mongoose      = require('mongoose')
const config        = require('../config')

config.assertSecretsConfigured()

const User          = require('../auth/userModel')
const Habit         = require('../habit/habitModel')
const Checkin       = require('../checkins/checkinModel')
const HabitProgress = require('../habit/habitProgressModel')
const { getPeriodKey } = require('../habit/periodUtils')

// ─── Date helpers ─────────────────────────────────────────────────────────────

// Midnight-anchored date so comparisons are day-exact
const day = (y, m, d) => { const dt = new Date(y, m - 1, d, 0, 0, 0, 0); return dt }

// All calendar days in [start, end], excluding skipDates, each stamped at baseHour:baseMin
// with a small deterministic variation so timestamps look natural.
function dailyDates(start, end, skipDates = [], baseHour = 9, baseMin = 0) {
    const skipSet = new Set(
        skipDates.map(s => { const d = new Date(s); d.setHours(0, 0, 0, 0); return d.toDateString() })
    )
    const result = []
    const cur  = new Date(start); cur.setHours(0, 0, 0, 0)
    const last = new Date(end);   last.setHours(0, 0, 0, 0)
    let i = 0
    while (cur <= last) {
        if (!skipSet.has(new Date(cur).toDateString())) {
            const dt = new Date(cur)
            // Deterministic minute / second variation that stays within the same hour
            const minOff = (i * 7) % 57
            const secOff = Math.floor((i * 13) % 60)
            dt.setHours(baseHour, (baseMin + minOff) % 60, secOff, 0)
            result.push(dt)
            i++
        }
        cur.setDate(cur.getDate() + 1)
    }
    return result
}

// Current streak: consecutive days ending at the last date in the array
function currentDailyStreak(dates) {
    if (!dates.length) return 0
    const sorted = [...dates].sort((a, b) => a - b)
    let streak = 0
    const tail = new Date(sorted[sorted.length - 1]); tail.setHours(0, 0, 0, 0)
    for (let i = sorted.length - 1; i >= 0; i--) {
        const d = new Date(sorted[i]); d.setHours(0, 0, 0, 0)
        const expected = new Date(tail); expected.setDate(tail.getDate() - streak)
        if (d.toDateString() === expected.toDateString()) streak++
        else break
    }
    return streak
}

// Best streak: longest unbroken run anywhere in the sorted dates array
function bestDailyStreak(dates) {
    if (!dates.length) return 0
    const sorted = [...dates].sort((a, b) => a - b)
    let best = 1, run = 1
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]); prev.setHours(0, 0, 0, 0)
        const curr = new Date(sorted[i]);     curr.setHours(0, 0, 0, 0)
        const next = new Date(prev);          next.setDate(prev.getDate() + 1)
        if (curr.toDateString() === next.toDateString()) { run++; if (run > best) best = run }
        else run = 1
    }
    return best
}

// Consecutive weekly streak ending at the last week in dates
function currentWeeklyStreak(dates) {
    if (!dates.length) return 0
    const keys = [...new Set(dates.map(dt => getPeriodKey(dt, 'weekly')))].sort()
    if (!keys.length) return 0
    let streak = 1
    for (let i = keys.length - 2; i >= 0; i--) {
        const [, dp] = keys[i + 1].split(':')
        const [y, mo, d] = dp.split('-').map(Number)
        const prevMon = new Date(y, mo - 1, d)
        prevMon.setDate(prevMon.getDate() - 7)
        if (keys[i] === getPeriodKey(prevMon, 'weekly')) streak++
        else break
    }
    return streak
}

// ─── Core seeder ──────────────────────────────────────────────────────────────

async function seed() {
    await mongoose.connect(config.MONGODB_URI)
    console.log('Connected to configured MongoDB')

    // ── Find user ─────────────────────────────────────────────────────────────
    const user = await User.findOne({ email: 'premium@test.com' })
    if (!user) {
        console.error('premium@test.com not found — run the main seed first.')
        process.exit(1)
    }
    console.log(`User: ${user.username}  (${user._id})`)

    // ── Wipe this user's personal habits, checkins, and progress ──────────────
    const existing = await Habit.find({ user: user._id, kind: 'personal' }, '_id')
    const ids = existing.map(h => h._id)
    const [dc, dh, dp] = await Promise.all([
        Checkin.deleteMany({ user: user._id, habit: { $in: ids } }),
        Habit.deleteMany({ user: user._id, kind: 'personal' }),
        HabitProgress.deleteMany({ user: user._id, habit: { $in: ids } }),
    ])
    console.log(`Cleared  ${dh.deletedCount} habits  |  ${dc.deletedCount} checkins  |  ${dp.deletedCount} progress docs`)
    console.log()

    // Seed reference date — today for all relative calculations
    const TODAY = day(2026, 6, 29)

    // ── Helper: create one habit + its checkins + its progress doc ────────────
    async function plant({ title, frequency, category, habitType, icon, content, kpi,
                           createdAt, dates, currentStreak, bestStreak }) {
        // 1. Habit
        const habit = await Habit.create({
            title, frequency, category, habitType, icon, content, kpi,
            kind: 'personal', user: user._id,
        })
        // Use native driver to bypass Mongoose timestamps immutability
        await Habit.collection.updateOne({ _id: habit._id }, { $set: { createdAt } })

        // 2. Checkins — every date gets a valid periodKey
        const checkins = dates.map(date => ({
            user:      user._id,
            habit:     habit._id,
            date,
            periodKey: getPeriodKey(date, frequency),
            isPrivate: false,
        }))
        if (checkins.length) await Checkin.insertMany(checkins)

        // 3. Progress
        const last = dates[dates.length - 1]
        await HabitProgress.create({
            user:          user._id,
            habit:         habit._id,
            currentStreak,
            bestStreak,
            lastCheckinAt: last,
            lastPeriodKey: getPeriodKey(last, frequency),
            totalCheckins: dates.length,
        })

        console.log(
            `  [${frequency.padEnd(6)}]  ${title.padEnd(35)}` +
            `  ${String(dates.length).padStart(3)} check-ins` +
            `  |  streak ${String(currentStreak).padStart(2)} (best ${bestStreak})`
        )
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PERSONAL HABITS — one month, very active user, realistically imperfect
    // ═════════════════════════════════════════════════════════════════════════

    console.log('Creating personal habits for premium@test.com …')
    console.log()

    // ── 1. MORNING RUN ───────────────────────────────────────────────────────
    // Daily Fitness build.  Started May 29.
    // Skipped Jun 9 (muscle soreness) and Jun 18 (travel day).
    // Runs: May 29–Jun 8 (11 d), Jun 10–17 (8 d), Jun 19–29 (11 d)
    // Current streak: 11  |  Best streak: 11
    {
        const skip  = [day(2026,6,9), day(2026,6,18)]
        const dates = dailyDates(day(2026,5,29), TODAY, skip, 6, 45)
        await plant({
            title: 'Morning Run', frequency: 'daily', category: 'Fitness',
            habitType: 'build', icon: 'fitness',
            content: 'Start the day with a 30-minute outdoor run — boosts focus and mood.',
            kpi: 'minutes run',
            createdAt: day(2026,5,29), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 2. DRINK 2 L OF WATER ────────────────────────────────────────────────
    // Daily Nutrition build.  Started May 29.
    // Skipped Jun 7 (conference, forgot) and Jun 23 (hectic day).
    // Runs: May 29–Jun 6 (9 d), Jun 8–22 (15 d), Jun 24–29 (6 d)
    // Current streak: 6  |  Best streak: 15
    {
        const skip  = [day(2026,6,7), day(2026,6,23)]
        const dates = dailyDates(day(2026,5,29), TODAY, skip, 9, 30)
        await plant({
            title: 'Drink 2 L of Water', frequency: 'daily', category: 'Nutrition',
            habitType: 'build', icon: 'nutrition',
            content: 'Fill the bottle twice — consistent hydration improves energy and skin.',
            kpi: 'litres',
            createdAt: day(2026,5,29), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 3. MEDITATE 10 MIN ───────────────────────────────────────────────────
    // Daily Wellness build.  Started May 29.
    // Skipped Jun 5 (slept in) and Jun 14 (exam prep crunch).
    // Runs: May 29–Jun 4 (7 d), Jun 6–13 (8 d), Jun 15–29 (15 d)
    // Current streak: 15  |  Best streak: 15
    {
        const skip  = [day(2026,6,5), day(2026,6,14)]
        const dates = dailyDates(day(2026,5,29), TODAY, skip, 7, 10)
        await plant({
            title: 'Meditate 10 Min', frequency: 'daily', category: 'Wellness',
            habitType: 'build', icon: 'wellness',
            content: 'Clear the mind before the day starts — 10 minutes of focused breathing.',
            createdAt: day(2026,5,29), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 4. READ 20 PAGES ─────────────────────────────────────────────────────
    // Daily Learning build.  Started Jun 1.
    // Skipped Jun 11 (late night) and Jun 20 (friends visiting).
    // Runs: Jun 1–10 (10 d), Jun 12–19 (8 d), Jun 21–29 (9 d)
    // Current streak: 9  |  Best streak: 10
    {
        const skip  = [day(2026,6,11), day(2026,6,20)]
        const dates = dailyDates(day(2026,6,1), TODAY, skip, 21, 30)
        await plant({
            title: 'Read 20 Pages', frequency: 'daily', category: 'Learning',
            habitType: 'build', icon: 'learning',
            content: '20 pages a day adds up to 24 books a year — pick something challenging.',
            kpi: 'pages',
            createdAt: day(2026,6,1), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 5. COLD SHOWER ───────────────────────────────────────────────────────
    // Daily Wellness build.  Started Jun 4.
    // Skipped Jun 15 (sick, fever).
    // Runs: Jun 4–14 (11 d), Jun 16–29 (14 d)
    // Current streak: 14  |  Best streak: 14
    {
        const skip  = [day(2026,6,15)]
        const dates = dailyDates(day(2026,6,4), TODAY, skip, 7, 45)
        await plant({
            title: 'Cold Shower', frequency: 'daily', category: 'Wellness',
            habitType: 'build', icon: 'wellness',
            content: 'Finish every shower with 30 s cold — builds resilience and sharpens focus.',
            createdAt: day(2026,6,4), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 6. EVENING JOURNALING ────────────────────────────────────────────────
    // Daily Wellness build.  Started Jun 2.
    // Skipped Jun 8 (too tired), Jun 17 (out late), Jun 25 (bachelor party).
    // Runs: Jun 2–7 (6 d), Jun 9–16 (8 d), Jun 18–24 (7 d), Jun 26–29 (4 d)
    // Current streak: 4  |  Best streak: 8
    {
        const skip  = [day(2026,6,8), day(2026,6,17), day(2026,6,25)]
        const dates = dailyDates(day(2026,6,2), TODAY, skip, 22, 10)
        await plant({
            title: 'Evening Journaling', frequency: 'daily', category: 'Wellness',
            habitType: 'build', icon: 'wellness',
            content: 'Reflect on three wins and one thing to improve — 5 minutes before sleep.',
            createdAt: day(2026,6,2), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 7. STUDY ALGORITHMS ──────────────────────────────────────────────────
    // Daily Learning build.  Started Jun 5.
    // Skipped Jun 16 (needed full rest day after exam block).
    // Runs: Jun 5–15 (11 d), Jun 17–29 (13 d)
    // Current streak: 13  |  Best streak: 13
    {
        const skip  = [day(2026,6,16)]
        const dates = dailyDates(day(2026,6,5), TODAY, skip, 20, 0)
        await plant({
            title: 'Study Algorithms', frequency: 'daily', category: 'Learning',
            habitType: 'build', icon: 'learning',
            content: 'One LeetCode problem or one chapter of CLRS — steady exam prep pays off.',
            createdAt: day(2026,6,5), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 8. HIT PROTEIN GOAL ──────────────────────────────────────────────────
    // Daily Nutrition build.  Started Jun 8.  Perfect — zero misses.
    // Current streak: 22  |  Best streak: 22
    {
        const dates = dailyDates(day(2026,6,8), TODAY, [], 13, 30)
        await plant({
            title: 'Hit Protein Goal', frequency: 'daily', category: 'Nutrition',
            habitType: 'build', icon: 'nutrition',
            content: 'Log at least 140 g of protein — supports muscle recovery and satiety.',
            kpi: 'grams of protein',
            createdAt: day(2026,6,8), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 9. STRETCH 15 MIN ────────────────────────────────────────────────────
    // Daily Fitness build.  Started May 31.
    // Skipped Jun 3, Jun 8, Jun 15, Jun 20, Jun 26 — inconsistent but improving.
    // Runs: May 31–Jun 2 (3 d), Jun 4–7 (4 d), Jun 9–14 (6 d),
    //        Jun 16–19 (4 d), Jun 21–25 (5 d), Jun 27–29 (3 d)
    // Current streak: 3  |  Best streak: 6
    {
        const skip  = [day(2026,6,3), day(2026,6,8), day(2026,6,15), day(2026,6,20), day(2026,6,26)]
        const dates = dailyDates(day(2026,5,31), TODAY, skip, 18, 30)
        await plant({
            title: 'Stretch 15 Min', frequency: 'daily', category: 'Fitness',
            habitType: 'build', icon: 'fitness',
            content: 'Post-workout or pre-sleep mobility work — reduces injury risk over time.',
            kpi: 'minutes',
            createdAt: day(2026,5,31), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 10. NO JUNK FOOD ─────────────────────────────────────────────────────
    // Daily Nutrition break.  Started May 29.  Struggling — skips mostly on weekends.
    // Skipped: May 31 (Sat), Jun 6 (Sat), Jun 7 (Sun), Jun 13 (Sat), Jun 14 (Sun),
    //          Jun 15 (Mon, weak after weekend), Jun 21 (Sun), Jun 22 (Mon), Jun 27 (Sat)
    // Runs: May 29–30 (2), Jun 1–5 (5), Jun 8–12 (5), Jun 16–20 (5), Jun 23–26 (4), Jun 28–29 (2)
    // Current streak: 2  |  Best streak: 5
    {
        const skip  = [
            day(2026,5,31),
            day(2026,6,6),  day(2026,6,7),
            day(2026,6,13), day(2026,6,14), day(2026,6,15),
            day(2026,6,21), day(2026,6,22),
            day(2026,6,27),
        ]
        const dates = dailyDates(day(2026,5,29), TODAY, skip, 19, 45)
        await plant({
            title: 'No Junk Food', frequency: 'daily', category: 'Nutrition',
            habitType: 'break', icon: 'nutrition',
            content: 'Skip processed snacks and fast food — cook or prep instead.',
            createdAt: day(2026,5,29), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 11. NO SOCIAL MEDIA AFTER 10 PM ──────────────────────────────────────
    // Daily Wellness break.  Started May 29.  Very sporadic — the hardest habit.
    // Strong start (May 29–31) then scattered hits, skipped most of late June.
    // Current streak: 1  |  Best streak: 3
    {
        const skip  = [
            day(2026,6,1),
            day(2026,6,4),  day(2026,6,5),
            day(2026,6,7),
            day(2026,6,9),
            day(2026,6,11),
            day(2026,6,13),
            day(2026,6,15),
            day(2026,6,17),
            day(2026,6,19),
            day(2026,6,21),
            day(2026,6,23),
            day(2026,6,25), day(2026,6,26), day(2026,6,27), day(2026,6,28),
        ]
        const dates = dailyDates(day(2026,5,29), TODAY, skip, 22, 30)
        await plant({
            title: 'No Social Media After 10 pm', frequency: 'daily', category: 'Wellness',
            habitType: 'break', icon: 'wellness',
            content: 'Better sleep starts with putting the phone down — no Instagram or TikTok after 22:00.',
            createdAt: day(2026,5,29), dates,
            currentStreak: currentDailyStreak(dates),
            bestStreak:    bestDailyStreak(dates),
        })
    }

    // ── 12. WEEKLY REVIEW ────────────────────────────────────────────────────
    // Weekly Productivity build.  Started May 31 (first Sunday in range).
    // Checked in every Sunday: May 31, Jun 7, Jun 14, Jun 21, Jun 28.
    // Today (Jun 29, Mon) — current week not yet checked in.
    // Current streak: 5  |  Best streak: 5
    //
    // Period key mapping (week starts on Monday):
    //   May 31 → weekly:2026-05-25  |  Jun 7  → weekly:2026-06-01
    //   Jun 14 → weekly:2026-06-08  |  Jun 21 → weekly:2026-06-15
    //   Jun 28 → weekly:2026-06-22
    {
        const sundayDates = [
            new Date(2026, 4, 31, 19,  0, 0),  // May 31
            new Date(2026, 5,  7, 19, 15, 0),  // Jun  7
            new Date(2026, 5, 14, 19, 30, 0),  // Jun 14
            new Date(2026, 5, 21, 18, 45, 0),  // Jun 21
            new Date(2026, 5, 28, 20,  0, 0),  // Jun 28
        ]
        const cs = currentWeeklyStreak(sundayDates)
        await plant({
            title: 'Weekly Review', frequency: 'weekly', category: 'Productivity',
            habitType: 'build', icon: 'productivity',
            content: 'Every Sunday: review goals, plan the week ahead, and reflect on what worked.',
            createdAt: day(2026,5,31), dates: sundayDates,
            currentStreak: cs,
            bestStreak:    cs,
        })
    }

    console.log()
    console.log('Done — 12 personal habits seeded for premium@test.com')
    await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exitCode = 1 })
