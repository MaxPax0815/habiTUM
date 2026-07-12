import format from "date-fns/format"

// Pure Progress helpers: raw checkins + Dates in, derived dashboard metrics out.

// --- Date helpers ---

// Inclusive calendar days; setHours(0,0,0,0) normalizes both dates to local midnight.
export const inclusiveDaysBetween = (a, b) => {
  const s = new Date(a); s.setHours(0, 0, 0, 0)
  const e = new Date(b); e.setHours(0, 0, 0, 0)
  return Math.max(1, Math.round((e - s) / 86400000) + 1)
}

// Counts weekday hits in [start,end]; full weeks + remainder avoids looping every day.
export const countWeekdayInRange = (jsDay, start, end) => {
  const s = new Date(start); s.setHours(0, 0, 0, 0)
  const e = new Date(end);   e.setHours(0, 0, 0, 0)
  if (e < s) return 0
  const total = Math.round((e - s) / 86400000) + 1
  const full  = Math.floor(total / 7)
  const rem   = total % 7
  const extra = rem > 0 && (jsDay - s.getDay() + 7) % 7 < rem ? 1 : 0
  return full + extra
}

// Deduplicates checkins to one local calendar day; Set removes same-day repeats.
export const uniqueCheckinDays = (checkins) => {
  return [...new Set(
    checkins.map(c => {
      const d = new Date(c.date); d.setHours(0, 0, 0, 0)
      return d.toDateString()
    })
  )]
}

// Expected completions since creation: weekly=ceil(days/7), daily=every calendar day.
export const getExpectedCount = (created, now, frequency) => {
  if (frequency === "weekly") {
    const createdDay = new Date(created); createdDay.setHours(0, 0, 0, 0)
    const today      = new Date(now);     today.setHours(0, 0, 0, 0)
    return Math.max(1, Math.ceil(inclusiveDaysBetween(createdDay, today) / 7))
  }
  return inclusiveDaysBetween(created, now)
}

// --- Per-habit analytics ---

// Mirrors backend getPeriodKey: daily:YYYY-MM-DD or weekly:YYYY-MM-DD using Monday.
// Exported for the drift-guard test in analytics.test.js (fixture shared with the backend).
export const buildPeriodKey = (date, frequency) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  if (frequency === "weekly") {
    // Rotate JS Sunday-first getDay() to Monday-first distance: Mon=0 ... Sun=6.
    const daysSinceMonday = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - daysSinceMonday)
  }
  const pad = (n) => String(n).padStart(2, "0")
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return `${frequency === "weekly" ? "weekly" : "daily"}:${dateStr}`
}

// Checks current period; prefer server lastPeriodKey, fallback to legacy lastCheckin math.
export const isCheckedInToday = (habit, now) => {
  const lastPeriodKey = habit.progress?.lastPeriodKey
  if (lastPeriodKey) {
    return lastPeriodKey === buildPeriodKey(now, habit.frequency)
  }
  // Legacy fallback for older habit payloads without progress.lastPeriodKey.
  if (!habit.lastCheckin) return false
  const d = new Date(habit.lastCheckin)
  if (habit.frequency === "weekly") {
    const today   = new Date(now)
    const dow     = today.getDay()
    const fromMon = dow === 0 ? 6 : dow - 1
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - fromMon)
    weekStart.setHours(0, 0, 0, 0)
    return d >= weekStart
  }
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const cd    = new Date(d);   cd.setHours(0, 0, 0, 0)
  return cd.toDateString() === today.toDateString()
}

// Weekly urgency helper: days left until Sunday; daily periods have no remaining days.
export const computeDaysLeftInPeriod = (now, frequency) => {
  if (frequency !== "weekly") return 0
  const daysSinceMonday = (new Date(now).getDay() + 6) % 7
  return 6 - daysSinceMonday
}

// Longest streak from raw dates; gap <= 1.5 periods counts as consecutive.
export const computeBestStreak = (checkins, frequency) => {
  if (!checkins.length) return 0
  const periodMs = frequency === "weekly" ? 7 * 86400000 : 86400000
  const days = [...new Set(
    checkins.map(c => { const d = new Date(c.date); d.setHours(0, 0, 0, 0); return d.getTime() })
  )].sort((a, b) => a - b)
  let best = 1, cur = 1
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] <= periodMs * 1.5) { cur++; best = Math.max(best, cur) }
    else cur = 1
  }
  return best
}

// Daily habit completion rate per weekday since creation, returned Mon-Sun.
export const computeWeekdayRates = (checkins, created, now) => {
  const NAMES      = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const createdDay = new Date(created); createdDay.setHours(0, 0, 0, 0)
  const todayNorm  = new Date(now);     todayNorm.setHours(0, 0, 0, 0)
  const uniqueDays = [...new Set(checkins.map(c => {
    const d = new Date(c.date); d.setHours(0, 0, 0, 0); return d.getTime()
  }))].map(t => new Date(t))
  return [1, 2, 3, 4, 5, 6, 0].map(jsDay => {
    const total = countWeekdayInRange(jsDay, createdDay, todayNorm)
    const hits  = uniqueDays.filter(d =>
      d >= createdDay && d <= todayNorm && d.getDay() === jsDay
    ).length
    return { day: NAMES[jsDay], rate: total ? Math.round((hits / total) * 100) : 0 }
  })
}

// Weekly habit weekday distribution; same {day,rate} shape, but not a pass/fail rate.
export const computeCheckinDayDistribution = (checkins) => {
  const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  checkins.forEach(c => { counts[new Date(c.date).getDay()]++ })
  const total = checkins.length
  return [1, 2, 3, 4, 5, 6, 0].map(jsDay => ({
    day: NAMES[jsDay],
    rate: total ? Math.round((counts[jsDay] / total) * 100) : 0,
  }))
}

// Single-habit momentum: last 7 day rate minus previous 7 day rate.
export const computeMomentum = (checkins, now, frequency) => {
  const today = new Date(now); today.setHours(23, 59, 59, 999)
  const l7s   = new Date(now); l7s.setDate(l7s.getDate() - 6);  l7s.setHours(0, 0, 0, 0)
  const p7s   = new Date(now); p7s.setDate(p7s.getDate() - 13); p7s.setHours(0, 0, 0, 0)
  const p7e   = new Date(l7s); p7e.setDate(p7e.getDate() - 1);  p7e.setHours(23, 59, 59, 999)
  const unique    = uniqueCheckinDays(checkins)
  const last7     = unique.filter(ds => { const d = new Date(ds); return d >= l7s && d <= today }).length
  const prev7     = unique.filter(ds => { const d = new Date(ds); return d >= p7s && d <= p7e  }).length
  const exp       = frequency === "weekly" ? 1 : 7
  const last7Rate = Math.min(100, Math.round(last7 / exp * 100))
  const prev7Rate = Math.min(100, Math.round(prev7 / exp * 100))
  return { last7Rate, prev7Rate, diff: last7Rate - prev7Rate }
}

// Builds daily heatmap cells over a capped window; Array.from creates one cell per day.
export const computeHeatmap = (checkins, created, now, maxDays = 90) => {
  const createdDay = new Date(created); createdDay.setHours(0, 0, 0, 0)
  const todayNorm  = new Date(now);     todayNorm.setHours(0, 0, 0, 0)
  const agoStart   = new Date(todayNorm); agoStart.setDate(todayNorm.getDate() - (maxDays - 1))
  const startDay   = createdDay > agoStart ? new Date(createdDay) : new Date(agoStart)
  const set        = new Set(uniqueCheckinDays(checkins))
  const count      = Math.round((todayNorm - startDay) / 86400000) + 1
  const completedCount = [...set].filter(ds => {
    const d = new Date(ds); return d >= startDay && d <= todayNorm
  }).length
  return {
    cells: Array.from({ length: count }, (_, i) => {
      const d = new Date(startDay); d.setDate(startDay.getDate() + i)
      return { date: new Date(d), checked: set.has(d.toDateString()) }
    }),
    fromCreation: createdDay > agoStart,
    startDate: startDay,
    completedCount,
    totalCount: count,
  }
}

// Weekly heatmap cells keyed by backend periodKey, avoiding raw-date re-bucketing drift.
export const computeWeeklyHeatmap = (checkins, created, now, maxWeeks = 24) => {
  const weekStartOf = (date) => {
    const d = new Date(date); d.setHours(0, 0, 0, 0)
    const daysSinceMonday = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - daysSinceMonday)
    return d
  }

  const createdWeek = weekStartOf(created)
  const nowWeek      = weekStartOf(now)
  const agoWeek       = new Date(nowWeek); agoWeek.setDate(agoWeek.getDate() - (maxWeeks - 1) * 7)
  const startWeek    = createdWeek > agoWeek ? createdWeek : agoWeek

  const checkedKeys = new Set(checkins.map(c => c.periodKey))
  const count       = Math.round((nowWeek - startWeek) / (7 * 86400000)) + 1

  const cells = Array.from({ length: count }, (_, i) => {
    const weekStart = new Date(startWeek); weekStart.setDate(startWeek.getDate() + i * 7)
    const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
    return { weekStart, weekEnd, checked: checkedKeys.has(buildPeriodKey(weekStart, "weekly")) }
  })

  return {
    cells,
    fromCreation: createdWeek > agoWeek,
    startDate: startWeek,
    completedCount: cells.filter(c => c.checked).length,
    totalCount: count,
  }
}

// Finds streak breaks as gaps > 1.5 periods and records durations to resume.
export const computeRecovery = (checkins, frequency) => {
  if (checkins.length < 2) return { breaks: 0, avgDays: 0, details: [] }
  const periodMs = frequency === "weekly" ? 7 * 86400000 : 86400000
  const days = [...new Set(
    checkins.map(c => { const d = new Date(c.date); d.setHours(0, 0, 0, 0); return d.getTime() })
  )].sort((a, b) => a - b)
  const details = []
  for (let i = 1; i < days.length; i++) {
    const gap = (days[i] - days[i - 1]) / periodMs
    if (gap > 1.5) details.push(Math.round(gap - 1))
  }
  // One decimal preserves values like 1.5d for display.
  const avg = details.length
    ? Math.round(details.reduce((a, b) => a + b, 0) / details.length * 10) / 10
    : 0
  return { breaks: details.length, avgDays: avg, details }
}

// Displays recovery durations in cadence units: days for daily, weeks for weekly.
export const formatPeriodDuration = (days, frequency) => {
  if (frequency === "weekly") {
    return `${Math.round((days / 7) * 10) / 10}w`
  }
  return `${days}d`
}

// Current-month completion rate plus best historical month label.
export const computeMonthlyStats = (checkins, frequency, now) => {
  const today      = new Date(now)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const daysInto   = inclusiveDaysBetween(monthStart, today)
  const unique     = uniqueCheckinDays(checkins)
  const thisMonthC = unique.filter(ds => {
    const d = new Date(ds); return d >= monthStart && d <= today
  })
  const exp           = frequency === "weekly" ? Math.max(1, Math.ceil(daysInto / 7)) : daysInto
  const thisMonthRate = Math.min(100, Math.round(thisMonthC.length / exp * 100))

  const byMonth = {}
  unique.forEach(ds => {
    const d   = new Date(ds)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
    if (!byMonth[key]) byMonth[key] = { list: [], month: d.getMonth(), year: d.getFullYear() }
    byMonth[key].list.push(ds)
  })
  let bestRate = 0, bestLabel = null
  Object.values(byMonth).forEach(({ list, month, year }) => {
    const mStart = new Date(year, month, 1)
    const mEnd   = new Date(year, month + 1, 0)
    const effEnd = mEnd < today ? mEnd : today
    const mDays  = inclusiveDaysBetween(mStart, effEnd)
    const mExp   = frequency === "weekly" ? Math.max(1, Math.ceil(mDays / 7)) : mDays
    const rate   = Math.min(100, Math.round(list.length / mExp * 100))
    if (rate > bestRate) { bestRate = rate; bestLabel = format(mStart, "MMMM") }
  })
  return { thisMonthRate, bestRate, bestLabel }
}

// Chooses one coach message by priority: streak record, recovery risk, weekday risk, fallback.
export const buildActionableInsight = (habit, checkins, completionRate, weekdayData, recovery, bestStreak, now) => {
  const isBreak      = habit.habitType === "break"
  const streakUnit   = habit.frequency === "weekly" ? "w" : "d"
  const unit         = habit.frequency === "weekly" ? "weeks" : "days"
  const checkedToday = isCheckedInToday(habit, now)
  const verb         = isBreak ? "kept clean" : "completed"

  if (habit.streak > 0 && !checkedToday && bestStreak > 0) {
    if (habit.streak + 1 > bestStreak)
      return {
        title: "Beat your personal best",
        message: `Check in today to surpass your best-ever streak of ${bestStreak}${streakUnit}!`,
        action: "Check in now",
      }
    if (habit.streak + 1 === bestStreak)
      return {
        title: "Tie your best streak",
        message: `One more day ties your personal record of ${bestStreak}${streakUnit}.`,
        action: "Check in now",
      }
  }

  if (habit.streak === bestStreak && habit.streak >= 7)
    return {
      title: "Personal record active",
      message: `You're on your longest-ever streak at ${habit.streak}${streakUnit}, keep it alive!`,
      action: null,
    }

  if (habit.streak === 0 && recovery.breaks > 0 && checkins.length > 0) {
    const lastDate = checkins.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b).date
    const gapDays  = Math.round((new Date(now) - new Date(lastDate)) / 86400000)
    if (recovery.avgDays > 0 && gapDays > recovery.avgDays)
      return {
        title: "Time to re-engage",
        message: `You usually bounce back in ${recovery.avgDays} day${recovery.avgDays !== 1 ? "s" : ""}, but it's been ${gapDays} days. Today is the day.`,
        action: "Start a new streak",
      }
    if (recovery.avgDays > 0)
      return {
        title: "You're on track",
        message: `After ${recovery.breaks} break${recovery.breaks > 1 ? "s" : ""}, you typically bounce back in ${recovery.avgDays} day${recovery.avgDays !== 1 ? "s" : ""} on average. Stay consistent.`,
        action: null,
      }
  }

  if (habit.frequency === "daily") {
    const DAY_MAP = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }
    const hitSet  = new Set(uniqueCheckinDays(checkins))
    for (const { day, rate } of [...weekdayData].sort((a, b) => a.rate - b.rate)) {
      if (rate > 35) break
      const target = DAY_MAP[day]
      let missed = 0
      const d = new Date(now); d.setHours(0, 0, 0, 0)
      for (let tries = 0; tries < 28 && missed < 3; tries++) {
        d.setDate(d.getDate() - 1)
        if (d.getDay() === target) {
          if (!hitSet.has(d.toDateString())) missed++
          else break
        }
      }
      if (missed >= 3)
        return {
          title: `${day} risk detected`,
          message: `${day} is your toughest day at ${rate}% completion. Try moving this habit earlier or setting a reminder the night before.`,
          action: `Set a ${day} reminder`,
        }
    }
  }

  if (habit.frequency === "daily" && checkins.length >= 7) {
    const days = [...new Set(
      checkins.map(c => { const d = new Date(c.date); d.setHours(0, 0, 0, 0); return d.getTime() })
    )].sort((a, b) => a - b)
    const maxGap = days.reduce((mx, _, i) =>
      i ? Math.max(mx, (days[i] - days[i - 1]) / 86400000) : mx, 0)
    if (maxGap < 2.5)
      return {
        title: "Impressive consistency",
        message: `You've never missed two ${unit} in a row on this habit. That's elite-level discipline.`,
        action: null,
      }
  }

  if (recovery.breaks >= 2 && recovery.avgDays <= 2)
    return {
      title: "Strong resilience",
      message: `After ${recovery.breaks} streak breaks, you've always bounced back in ${recovery.avgDays} day${recovery.avgDays !== 1 ? "s" : ""} on average.`,
      action: null,
    }

  if (completionRate >= 70)
    return {
      title: "Great consistency",
      message: `You've ${verb} this habit on ${completionRate}% of ${unit}. Keep the momentum going.`,
      action: null,
    }
  if (completionRate >= 40)
    return {
      title: "Steady progress",
      message: `You've ${verb} this habit on ${completionRate}% of ${unit}. Small improvements compound over time.`,
      action: "Set a daily reminder",
    }
  return {
    title: "Build more consistency",
    message: `You've ${verb} this habit on ${completionRate}% of ${unit}. Try committing to just 3 days in a row to build momentum.`,
    action: "Commit to 3 days",
  }
}

// --- All-habits analytics ---

// Mon-Sun portfolio chart for daily habits: this week, last week, all-time baseline.
export const computeWeeklyLineData = (habits, now) => {
  const daily = habits.filter(h => h.frequency === "daily")
  if (!daily.length) return []

  const today      = new Date(now); today.setHours(0, 0, 0, 0)
  const dow        = today.getDay()
  const fromMon    = dow === 0 ? 6 : dow - 1
  const thisMonday = new Date(today); thisMonday.setDate(today.getDate() - fromMon)
  const lastMonday = new Date(thisMonday); lastMonday.setDate(thisMonday.getDate() - 7)
  const JS_DAYS    = [1, 2, 3, 4, 5, 6, 0]
  const LABELS     = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const rateOnDate = (list, target) => {
    const active = list.filter(h => {
      const c = new Date(h.createdAt); c.setHours(0, 0, 0, 0); return c <= target
    })
    if (!active.length) return 0
    const hits = active.filter(h =>
      uniqueCheckinDays(h.checkins || []).some(ds => {
        const d = new Date(ds); d.setHours(0, 0, 0, 0)
        return d.toDateString() === target.toDateString()
      })
    ).length
    return Math.round(hits / active.length * 100)
  }

  return LABELS.map((label, idx) => {
    const jsDay    = JS_DAYS[idx]
    const thisDate = new Date(thisMonday); thisDate.setDate(thisMonday.getDate() + idx); thisDate.setHours(0, 0, 0, 0)
    const lastDate = new Date(lastMonday); lastDate.setDate(lastMonday.getDate() + idx); lastDate.setHours(0, 0, 0, 0)
    let totalOcc = 0, totalHits = 0
    daily.forEach(h => {
      const created = new Date(h.createdAt); created.setHours(0, 0, 0, 0)
      totalOcc  += countWeekdayInRange(jsDay, created, today)
      totalHits += uniqueCheckinDays(h.checkins || []).filter(ds => {
        const d = new Date(ds); d.setHours(0, 0, 0, 0)
        return d.getDay() === jsDay && d >= created && d <= today
      }).length
    })
    return {
      day:      label,
      thisWeek: thisDate > today ? null : rateOnDate(daily, thisDate),
      lastWeek: rateOnDate(daily, lastDate),
      baseline: totalOcc ? Math.round(totalHits / totalOcc * 100) : 0,
    }
  })
}

// Habit Pulse score: today rate + avg completion + base bonus - streak risk penalty.
export const computeHabitReadiness = (habits, now) => {
  if (!habits.length) return 0

  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const activeHabits = habits.filter(h => {
    const created = new Date(h.createdAt); created.setHours(0, 0, 0, 0)
    return created <= today
  })
  if (!activeHabits.length) return 0

  const checkedTodayCount = activeHabits.filter(h => isCheckedInToday(h, now)).length
  const todayRate         = Math.round((checkedTodayCount / activeHabits.length) * 100)

  const avgCompletion = Math.round(
    activeHabits.reduce((sum, h) => {
      const expected  = getExpectedCount(h.createdAt, now, h.frequency)
      const completed = uniqueCheckinDays(h.checkins || []).length
      return sum + Math.min(100, Math.round((completed / expected) * 100))
    }, 0) / activeHabits.length
  )

  const atRiskCount = activeHabits.filter(h => h.streak > 0 && !isCheckedInToday(h, now)).length
  const riskPenalty = Math.min(25, atRiskCount * 8)

  return Math.max(0, Math.min(100,
    Math.round(todayRate * 0.45 + avgCompletion * 0.45 + 10 - riskPenalty)
  ))
}

// Maps a Habit Pulse score to a display label.
export const getReadinessStatus = (score) => {
  if (score >= 85) return "Excellent"
  if (score >= 70) return "Strong"
  if (score >= 50) return "Moderate"
  return "Needs attention"
}

// Average all-time completion rate across all habits since their creation dates.
export const computeOverallConsistency = (habits, now) => {
  if (!habits.length) return 0
  const rates = habits.map(h => {
    const exp  = getExpectedCount(h.createdAt, now, h.frequency)
    const comp = uniqueCheckinDays(h.checkins || []).length
    return Math.min(100, Math.round(comp / exp * 100))
  })
  return Math.round(rates.reduce((s, r) => s + r, 0) / rates.length)
}

// Averages single-habit momentum across daily habits for the portfolio card.
export const computeOverallMomentum = (habits, now) => {
  const daily = habits.filter(h => h.frequency === "daily")
  if (!daily.length) return { diff: 0, last7Rate: 0 }
  const momentums = daily.map(h => computeMomentum(h.checkins || [], now, "daily"))
  const avgLast7  = Math.round(momentums.reduce((s, m) => s + m.last7Rate, 0) / momentums.length)
  const avgPrev7  = Math.round(momentums.reduce((s, m) => s + m.prev7Rate, 0) / momentums.length)
  return { last7Rate: avgLast7, prev7Rate: avgPrev7, diff: avgLast7 - avgPrev7 }
}

// Averages recovery only across habits that have at least one streak break.
export const computeOverallRecovery = (habits) => {
  const withRecovery = habits
    .map(h => computeRecovery(h.checkins || [], h.frequency))
    .filter(r => r.breaks > 0)
  if (!withRecovery.length) return { breaks: 0, avgDays: 0 }
  const totalBreaks = withRecovery.reduce((s, r) => s + r.breaks, 0)
  const avgDays = Math.round(
    withRecovery.reduce((s, r) => s + r.avgDays, 0) / withRecovery.length * 10
  ) / 10
  return { breaks: totalBreaks, avgDays }
}
