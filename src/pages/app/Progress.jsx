import { useEffect, useState } from "react"
import { useAuthContext } from "../../auth/useAuthContext"
import { useHabitsContext } from "../../hooks/useHabitsContext"

import format from "date-fns/format"

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import {
  Box, Chip, Divider,
  Paper, Stack, Tooltip, Typography
} from "@mui/material"
import { colors } from "../../theme"

import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis
} from "recharts"


// ─── Analytics helpers ────────────────────────────────────────────────────────

const daysBetween = (a, b) => {
  const s = new Date(a); s.setHours(0,0,0,0)
  const e = new Date(b); e.setHours(0,0,0,0)
  return Math.round((e - s) / 86400000)
}

const countWeekdayInRange = (jsDay, start, end) => {
  const s = new Date(start); s.setHours(0,0,0,0)
  const e = new Date(end);   e.setHours(0,0,0,0)
  if (e < s) return 0
  const total = Math.round((e - s) / 86400000) + 1
  const full  = Math.floor(total / 7)
  const rem   = total % 7
  const extra = rem > 0 && (jsDay - s.getDay() + 7) % 7 < rem ? 1 : 0
  return full + extra
}

const computeBestStreak = (checkins, frequency) => {
  if (!checkins.length) return 0
  const periodMs = frequency === "weekly" ? 7 * 86400000 : 86400000
  const days = [...new Set(
    checkins.map(c => { const d = new Date(c.date); d.setHours(0,0,0,0); return d.getTime() })
  )].sort((a, b) => a - b)
  let best = 1, cur = 1
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] <= periodMs * 1.5) { cur++; best = Math.max(best, cur) }
    else cur = 1
  }
  return best
}

const computeWeekdayRates = (checkins, created, now) => {
  const NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  const createdDay = new Date(created); createdDay.setHours(0,0,0,0)
  const todayNorm  = new Date(now);     todayNorm.setHours(0,0,0,0)
  return [1,2,3,4,5,6,0].map(jsDay => {
    const total = countWeekdayInRange(jsDay, createdDay, todayNorm)
    const hits  = checkins.filter(c => new Date(c.date).getDay() === jsDay).length
    return { day: NAMES[jsDay], rate: total ? Math.round(hits / total * 100) : 0 }
  })
}

const computeMomentum = (checkins, now, frequency) => {
  const today = new Date(now); today.setHours(23,59,59,999)
  const l7s   = new Date(now); l7s.setDate(l7s.getDate() - 6);  l7s.setHours(0,0,0,0)
  const p7s   = new Date(now); p7s.setDate(p7s.getDate() - 13); p7s.setHours(0,0,0,0)
  const p7e   = new Date(l7s); p7e.setDate(p7e.getDate() - 1);  p7e.setHours(23,59,59,999)
  const last7 = checkins.filter(c => { const d = new Date(c.date); return d >= l7s && d <= today }).length
  const prev7 = checkins.filter(c => { const d = new Date(c.date); return d >= p7s && d <= p7e  }).length
  const exp       = frequency === "weekly" ? 1 : 7
  const last7Rate = Math.min(100, Math.round(last7 / exp * 100))
  const prev7Rate = Math.min(100, Math.round(prev7 / exp * 100))
  return { last7Rate, prev7Rate, diff: last7Rate - prev7Rate }
}

const computeHeatmap = (checkins, created, now) => {
  const createdDay = new Date(created); createdDay.setHours(0,0,0,0)
  const todayNorm  = new Date(now);     todayNorm.setHours(0,0,0,0)
  const ago90      = new Date(todayNorm); ago90.setDate(todayNorm.getDate() - 89)
  const startDay   = createdDay > ago90 ? new Date(createdDay) : new Date(ago90)
  const set = new Set(checkins.map(c => {
    const d = new Date(c.date); d.setHours(0,0,0,0); return d.toDateString()
  }))
  const count = Math.round((todayNorm - startDay) / 86400000) + 1
  return {
    cells: Array.from({ length: count }, (_, i) => {
      const d = new Date(startDay); d.setDate(startDay.getDate() + i)
      return { date: new Date(d), checked: set.has(d.toDateString()) }
    }),
    fromCreation: createdDay > ago90,
    startDate: startDay,
  }
}

const isCheckedInToday = (habit, now) => {
  if (!habit.lastCheckin) return false
  const d = new Date(habit.lastCheckin)
  if (habit.frequency === "weekly") {
    const today = new Date(now)
    const dow = today.getDay()
    const fromMon = dow === 0 ? 6 : dow - 1
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - fromMon)
    weekStart.setHours(0,0,0,0)
    return d >= weekStart
  }
  const today = new Date(now); today.setHours(0,0,0,0)
  const cd    = new Date(d);   cd.setHours(0,0,0,0)
  return cd.toDateString() === today.toDateString()
}

const computeRollingTrend = (checkins, created, now, frequency) => {
  const createdDay = new Date(created); createdDay.setHours(0,0,0,0)
  const todayNorm  = new Date(now);     todayNorm.setHours(0,0,0,0)
  const ago90      = new Date(todayNorm); ago90.setDate(todayNorm.getDate() - 89)
  const startDay   = createdDay > ago90 ? new Date(createdDay) : new Date(ago90)

  const set = new Set(checkins.map(c => {
    const d = new Date(c.date); d.setHours(0,0,0,0); return d.toDateString()
  }))
  const windowDays     = frequency === "weekly" ? 28 : 7
  const windowExpected = frequency === "weekly" ? 4  : 7
  const dayCount       = Math.round((todayNorm - startDay) / 86400000) + 1

  return Array.from({ length: dayCount }, (_, i) => {
    const day = new Date(startDay); day.setDate(startDay.getDate() + i)
    let hits = 0
    for (let j = 0; j < windowDays; j++) {
      const d = new Date(day); d.setDate(day.getDate() - j)
      if (set.has(d.toDateString())) hits++
    }
    return { label: format(day, "MMM d"), rate: Math.round(hits / windowExpected * 100) }
  })
}

const computeRecovery = (checkins, frequency) => {
  if (checkins.length < 2) return { breaks: 0, avgDays: 0, details: [] }
  const periodMs = frequency === "weekly" ? 7 * 86400000 : 86400000
  const days = [...new Set(
    checkins.map(c => { const d = new Date(c.date); d.setHours(0,0,0,0); return d.getTime() })
  )].sort((a, b) => a - b)
  const details = []
  for (let i = 1; i < days.length; i++) {
    const gap = (days[i] - days[i - 1]) / periodMs
    if (gap > 1.5) details.push(Math.round(gap - 1))
  }
  const avg = details.length
    ? Math.round(details.reduce((a, b) => a + b, 0) / details.length)
    : 0
  return { breaks: details.length, avgDays: avg, details }
}

const computeMonthlyStats = (checkins, frequency, now) => {
  const today      = new Date(now)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const daysInto   = daysBetween(monthStart, today) + 1
  const thisMonthC = checkins.filter(c => {
    const d = new Date(c.date); return d >= monthStart && d <= today
  })
  const exp           = frequency === "weekly" ? Math.max(1, Math.floor(daysInto / 7)) : daysInto
  const thisMonthRate = Math.min(100, Math.round(thisMonthC.length / exp * 100))

  const byMonth = {}
  checkins.forEach(c => {
    const d   = new Date(c.date)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`
    if (!byMonth[key]) byMonth[key] = { list: [], month: d.getMonth(), year: d.getFullYear() }
    byMonth[key].list.push(c)
  })
  let bestRate = 0, bestLabel = null
  Object.values(byMonth).forEach(({ list, month, year }) => {
    const mStart = new Date(year, month, 1)
    const mEnd   = new Date(year, month + 1, 0)
    const effEnd = mEnd < today ? mEnd : today
    const mDays  = daysBetween(mStart, effEnd) + 1
    const mExp   = frequency === "weekly" ? Math.max(1, Math.floor(mDays / 7)) : mDays
    const rate   = Math.min(100, Math.round(list.length / mExp * 100))
    if (rate > bestRate) { bestRate = rate; bestLabel = format(mStart, "MMMM") }
  })
  return { thisMonthRate, bestRate, bestLabel }
}

const buildActionableInsight = (habit, checkins, completionRate, weekdayData, recovery, bestStreak, now) => {
  const isBreak      = habit.habitType === "break"
  const streakUnit   = habit.frequency === "weekly" ? "w" : "d"
  const unit         = habit.frequency === "weekly" ? "weeks" : "days"
  const checkedToday = isCheckedInToday(habit, now)

  if (habit.streak > 0 && !checkedToday && bestStreak > 0) {
    if (habit.streak + 1 > bestStreak)
      return `Check in today to beat your personal best streak of ${bestStreak}${streakUnit}!`
    if (habit.streak + 1 === bestStreak)
      return `Check in today to tie your best-ever streak of ${bestStreak}${streakUnit}!`
  }
  if (habit.streak === bestStreak && habit.streak >= 7)
    return `You're on your longest-ever streak at ${habit.streak}${streakUnit}, keep it alive!`

  if (habit.streak === 0 && recovery.breaks > 0 && checkins.length > 0) {
    const lastDate = checkins.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b).date
    const gapDays  = daysBetween(lastDate, now)
    if (recovery.avgDays > 0 && gapDays > recovery.avgDays)
      return `You usually bounce back in ${recovery.avgDays} day${recovery.avgDays !== 1 ? "s" : ""}, today is day ${gapDays}. Time to re-engage!`
    if (recovery.avgDays > 0)
      return `After ${recovery.breaks} streak break${recovery.breaks > 1 ? "s" : ""}, you bounce back in ${recovery.avgDays} day${recovery.avgDays !== 1 ? "s" : ""} on average. You're right on track.`
  }

  if (habit.frequency === "daily") {
    const DAY_MAP = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 }
    const hitSet  = new Set(checkins.map(c => {
      const d = new Date(c.date); d.setHours(0,0,0,0); return d.toDateString()
    }))
    for (const { day, rate } of [...weekdayData].sort((a, b) => a.rate - b.rate)) {
      if (rate > 35) break
      const target = DAY_MAP[day]
      let missed = 0
      const d = new Date(now); d.setHours(0,0,0,0)
      for (let tries = 0; tries < 28 && missed < 3; tries++) {
        d.setDate(d.getDate() - 1)
        if (d.getDay() === target) {
          if (!hitSet.has(d.toDateString())) missed++
          else break
        }
      }
      if (missed >= 3)
        return `You've missed the last ${missed} ${day}s in a row. That's your toughest day at ${rate}% completion.`
    }
  }

  if (habit.frequency === "daily" && checkins.length >= 7) {
    const days = [...new Set(
      checkins.map(c => { const d = new Date(c.date); d.setHours(0,0,0,0); return d.getTime() })
    )].sort((a, b) => a - b)
    const maxGap = days.reduce((mx, _, i) =>
      i ? Math.max(mx, (days[i] - days[i-1]) / 86400000) : mx, 0)
    if (maxGap < 2.5)
      return `You've never missed two ${unit} in a row on this habit, impressive consistency!`
  }

  if (recovery.breaks >= 2 && recovery.avgDays <= 2)
    return `After ${recovery.breaks} streak breaks, you've always bounced back in ${recovery.avgDays} day${recovery.avgDays !== 1 ? "s" : ""} on average. Your resilience is strong.`

  const verb = isBreak ? "kept clean" : "completed"
  if (completionRate >= 70) return `You've ${verb} this habit on ${completionRate}% of ${unit}, great consistency.`
  if (completionRate >= 40) return `You've ${verb} this habit on ${completionRate}% of ${unit}, steady progress adds up.`
  return `You've ${verb} this habit on ${completionRate}% of ${unit}, try to build more consistency.`
}

const computeWeeklyLineData = (habits, now) => {
  const daily = habits.filter(h => h.frequency === "daily")
  if (!daily.length) return []

  const today      = new Date(now); today.setHours(0,0,0,0)
  const dow        = today.getDay()
  const fromMon    = dow === 0 ? 6 : dow - 1
  const thisMonday = new Date(today); thisMonday.setDate(today.getDate() - fromMon)
  const lastMonday = new Date(thisMonday); lastMonday.setDate(thisMonday.getDate() - 7)
  const JS_DAYS    = [1, 2, 3, 4, 5, 6, 0]
  const LABELS     = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

  const rateOnDate = (list, target) => {
    const active = list.filter(h => {
      const c = new Date(h.createdAt); c.setHours(0,0,0,0); return c <= target
    })
    if (!active.length) return 0
    const hits = active.filter(h =>
      (h.checkins || []).some(c => {
        const d = new Date(c.date); d.setHours(0,0,0,0)
        return d.toDateString() === target.toDateString()
      })
    ).length
    return Math.round(hits / active.length * 100)
  }

  return LABELS.map((label, idx) => {
    const jsDay    = JS_DAYS[idx]
    const thisDate = new Date(thisMonday); thisDate.setDate(thisMonday.getDate() + idx); thisDate.setHours(0,0,0,0)
    const lastDate = new Date(lastMonday); lastDate.setDate(lastMonday.getDate() + idx); lastDate.setHours(0,0,0,0)
    let totalOcc = 0, totalHits = 0
    daily.forEach(h => {
      const created = new Date(h.createdAt); created.setHours(0,0,0,0)
      totalOcc  += countWeekdayInRange(jsDay, created, today)
      totalHits += (h.checkins || []).filter(c => {
        const d = new Date(c.date); d.setHours(0,0,0,0)
        return d.getDay() === jsDay && d >= created && d <= today
      }).length
    })
    return {
      day:      label,
      thisWeek: thisDate > today ? null : rateOnDate(daily, thisDate),
      lastWeek: rateOnDate(daily, lastDate),
      allTime:  totalOcc ? Math.round(totalHits / totalOcc * 100) : 0,
    }
  })
}


// ─── UI components ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sublabel, color = colors.primary }) => (
  <Paper variant="outlined" sx={{ p: 2.5, flex: 1, minWidth: 120 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h4" sx={{ fontWeight: 800, color, my: 0.5 }}>{value}</Typography>
    {sublabel && <Typography variant="caption" color="text.secondary">{sublabel}</Typography>}
  </Paper>
)

const SectionTitle = ({ children }) => (
  <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
    {children}
  </Typography>
)

const HabitHealthRow = ({ habits, selectedId, onSelect, now }) => {
  const getRate = (habit) => {
    const checkins  = habit.checkins || []
    const dayCount  = Math.max(1, daysBetween(new Date(habit.createdAt), now))
    const expected  = habit.frequency === "weekly" ? Math.max(1, Math.floor(dayCount / 7)) : dayCount
    return Math.min(100, Math.round(checkins.length / expected * 100))
  }

  return (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      {habits.map(habit => {
        const rate       = getRate(habit)
        const checked    = isCheckedInToday(habit, now)
        const atRisk     = habit.streak > 0 && !checked
        const isSelected = habit._id === selectedId
        const barColor   = rate >= 70 ? colors.green : rate >= 40 ? colors.orange : "#e53e3e"

        return (
          <Paper
            key={habit._id}
            variant="outlined"
            onClick={() => onSelect(habit._id)}
            sx={{
              p: 2, minWidth: 140, maxWidth: 200, cursor: "pointer", flex: "1 1 140px",
              borderColor: isSelected ? colors.primary : colors.border,
              borderWidth: isSelected ? 2 : 1,
              bgcolor: isSelected ? colors.softBlue : "background.paper",
              transition: "all 0.15s",
              "&:hover": { borderColor: colors.primary, bgcolor: colors.softBlue },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography variant="caption" sx={{
                fontWeight: 700, lineHeight: 1.3,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {habit.title}
              </Typography>
              {checked
                ? <CheckCircleOutlineIcon sx={{ fontSize: 15, color: colors.green, flexShrink: 0, ml: 0.5 }} />
                : atRisk
                  ? <WarningAmberIcon sx={{ fontSize: 15, color: colors.orange, flexShrink: 0, ml: 0.5 }} />
                  : null}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: colors.orange, lineHeight: 1 }}>
              {habit.streak}{habit.frequency === "weekly" ? "w" : "d"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {habit.habitType === "break" ? "clean streak" : "streak"}
            </Typography>
            <Box sx={{ mt: 1.5, bgcolor: "#e2e8f0", borderRadius: 2, overflow: "hidden", height: 5 }}>
              <Box sx={{
                height: "100%", width: `${rate}%`,
                bgcolor: barColor, borderRadius: 2, transition: "width 0.6s ease",
              }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              {rate}% completion
            </Typography>
          </Paper>
        )
      })}
    </Box>
  )
}

const WeeklyLineChart = ({ data }) => {
  const hasFutureDays = data.some(p => p.thisWeek === null)
  const todayLabel = data.find((_, i) => {
    const d = new Date(); d.setHours(0,0,0,0)
    const dow = d.getDay(); return i === (dow === 0 ? 6 : dow - 1)
  })?.day
  const allValues = data.flatMap(p => [p.thisWeek, p.lastWeek, p.allTime].filter(v => v != null))
  const yMin = allValues.length ? Math.max(0,   Math.min(...allValues) - 10) : 0
  const yMax = allValues.length ? Math.min(100, Math.max(...allValues) + 10) : 100

  return (
    <Box>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 20, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 12 }} unit="%" />
          <RTooltip
            formatter={(v, name) => [
              v == null ? ":" : `${v}%`,
              name === "thisWeek" ? "This week" : name === "lastWeek" ? "Last week" : "All-time avg",
            ]}
          />
          <Legend
            formatter={n => n === "thisWeek" ? "This week" : n === "lastWeek" ? "Last week" : "All-time avg"}
          />
          <Line type="monotone" dataKey="thisWeek"
            stroke={colors.primary} strokeWidth={2.5}
            dot={{ r: 4, fill: colors.primary }} activeDot={{ r: 6 }} connectNulls={false} />
          <Line type="monotone" dataKey="lastWeek"
            stroke={colors.muted} strokeWidth={2} strokeDasharray="5 3"
            dot={{ r: 3, fill: colors.muted }} connectNulls={false} />
          <Line type="monotone" dataKey="allTime"
            stroke={colors.orange} strokeWidth={2} strokeDasharray="2 2"
            dot={{ r: 3, fill: colors.orange }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
      {hasFutureDays && todayLabel && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          This week shown through today ({todayLabel}), future days are hidden
        </Typography>
      )}
    </Box>
  )
}

const Heatmap = ({ cells, habitType, fromCreation, startDate }) => {
  if (!cells.length) return null
  const isBreak   = habitType === "break"
  const firstDay  = cells[0].date.getDay()
  const padding   = firstDay === 0 ? 6 : firstDay - 1
  const totalCols = Math.ceil((padding + cells.length) / 7)

  const monthLabels = {}
  cells.forEach((cell, i) => {
    const col      = Math.floor((padding + i) / 7)
    const prevDate = i > 0 ? cells[i - 1].date : null
    if (i === 0 || (prevDate && cell.date.getMonth() !== prevDate.getMonth()))
      monthLabels[col] = format(cell.date, "MMM")
  })

  const checkedColor = isBreak ? colors.green  : colors.primary
  const checkedLabel = isBreak ? "Clean day ✓" : "Done ✓"
  const missedLabel  = isBreak ? "Slip day"    : "Missed"

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${totalCols}, 1fr)`, gap: 0.5, mb: 0.25 }}>
        {Array.from({ length: totalCols }, (_, col) => (
          <Typography key={col} variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
            {monthLabels[col] || ""}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <Typography key={i} variant="caption" color="text.secondary"
            sx={{ textAlign: "center", fontSize: 10 }}>{d}</Typography>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {Array.from({ length: padding }).map((_, i) => (
          <Box key={`pad-${i}`} sx={{ aspectRatio: "1" }} />
        ))}
        {cells.map((day, i) => (
          <Tooltip key={i}
            title={`${format(day.date, "MMM d")} , ${day.checked ? checkedLabel : missedLabel}`}
            placement="top">
            <Box sx={{
              aspectRatio: "1", borderRadius: 1,
              bgcolor: day.checked ? checkedColor : "#e2e8f0",
              opacity: day.checked ? 1 : 0.45,
              cursor: "default", transition: "opacity 0.15s",
              "&:hover": { opacity: 0.85 },
            }} />
          </Tooltip>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {fromCreation ? `Since creation · ${format(startDate, "MMM d, yyyy")}` : "Last 90 days"}
        {isBreak ? " · Green = clean day, gray = slip day" : ""}
      </Typography>
    </Box>
  )
}

const WeekdayBars = ({ data }) => (
  <Stack spacing={1}>
    {data.map(({ day, rate }) => (
      <Box key={day} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="caption" sx={{ width: 28, color: "text.secondary", flexShrink: 0 }}>
          {day}
        </Typography>
        <Box sx={{ flex: 1, bgcolor: "#e2e8f0", borderRadius: 2, overflow: "hidden", height: 8 }}>
          <Box sx={{
            height: "100%", width: `${rate}%`,
            bgcolor: rate >= 70 ? colors.green : rate >= 40 ? colors.orange : "#fca5a5",
            borderRadius: 2, transition: "width 0.6s ease",
          }} />
        </Box>
        <Typography variant="caption" sx={{ width: 32, textAlign: "right", color: "text.secondary" }}>
          {rate}%
        </Typography>
      </Box>
    ))}
  </Stack>
)

const RollingTrendChart = ({ data, frequency }) => {
  if (data.length < 3) return (
    <Typography variant="caption" color="text.secondary">
      Not enough data yet, check back after a few more days.
    </Typography>
  )
  const interval  = Math.max(0, Math.floor(data.length / 12) - 1)
  const allValues = data.map(d => d.rate)
  const yMin = Math.max(0,   Math.min(...allValues) - 10)
  const yMax = Math.min(100, Math.max(...allValues) + 10)

  return (
    <Box>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 20, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={interval} />
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11 }} unit="%" />
          <RTooltip
            formatter={v => [`${v}%`, frequency === "weekly" ? "28-day rate" : "7-day rate"]}
          />
          <Line type="monotone" dataKey="rate"
            stroke={colors.primary} strokeWidth={2.5}
            dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
      <Typography variant="caption" color="text.secondary">
        {frequency === "weekly"
          ? "Rolling 28-day completion rate · each point = last 4 weeks"
          : "Rolling 7-day completion rate · each point = last 7 days"}
      </Typography>
    </Box>
  )
}

const PaywallBanner = () => (
  <Box sx={{ textAlign: "center", py: 10, px: 4 }}>
    <Box sx={{ mb: 2, color: colors.primary }}>
      <LockOutlinedIcon sx={{ fontSize: 48 }} />
    </Box>
    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
      Analytics is a Premium feature
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto", mb: 3 }}>
      Upgrade to Premium to unlock your full progress dashboard: streaks, heatmaps,
      momentum analytics, and personalized insights.
    </Typography>
    <Chip
      icon={<AutoAwesomeIcon />}
      label="Upgrade to Premium"
      color="primary"
      sx={{ fontWeight: 700, px: 2, py: 2.5, fontSize: "0.9rem" }}
    />
  </Box>
)


// ─── Main Progress page ───────────────────────────────────────────────────────

const Progress = () => {
  const { user }             = useAuthContext()
  const { habits, dispatch } = useHabitsContext()
  const [selectedId, setSelectedId] = useState(null)

  const isPremium = user?.subscription === "premium" || user?.accountType === "manager"

  useEffect(() => {
    if (habits === null && user) {
      fetch("/api/habits", { headers: { Authorization: `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(json => dispatch({ type: "SET_HABITS", payload: json }))
    }
  }, [habits, user, dispatch])

  useEffect(() => {
    if (habits?.length && !selectedId) setSelectedId(habits[0]._id)
  }, [habits, selectedId])

  if (!isPremium) return <PaywallBanner />
  if (!habits)    return <Typography p={4}>Loading…</Typography>
  if (!habits.length) return (
    <Typography p={4} color="text.secondary">
      No habits yet, add some from Today to start tracking.
    </Typography>
  )

  const now = new Date()

  const weeklyLineData = computeWeeklyLineData(habits, now)

  const habit    = habits.find(h => h._id === selectedId) || habits[0]
  const checkins = habit.checkins || []
  const created  = new Date(habit.createdAt)
  const isWeekly = habit.frequency === "weekly"
  const isBreak  = habit.habitType === "break"

  const dayCount       = Math.max(1, daysBetween(created, now))
  const totalExpected  = isWeekly ? Math.max(1, Math.floor(dayCount / 7)) : dayCount
  const completionRate = Math.min(100, Math.round(checkins.length / totalExpected * 100))
  const bestStreak     = computeBestStreak(checkins, habit.frequency)
  const weekdayData    = computeWeekdayRates(checkins, created, now)
  const momentum       = computeMomentum(checkins, now, habit.frequency)
  const heatmap        = computeHeatmap(checkins, created, now)
  const rollingTrend   = computeRollingTrend(checkins, created, now, habit.frequency)
  const recovery       = computeRecovery(checkins, habit.frequency)
  const monthlyStats   = computeMonthlyStats(checkins, habit.frequency, now)
  const checkedToday   = isCheckedInToday(habit, now)
  const insight        = buildActionableInsight(
    habit, checkins, completionRate, weekdayData, recovery, bestStreak, now
  )

  const worstDay   = isWeekly ? null : [...weekdayData].sort((a, b) => a.rate - b.rate)[0]
  const bestDay    = isWeekly ? null : [...weekdayData].sort((a, b) => b.rate - a.rate)[0]
  const streakUnit = isWeekly ? "w" : "d"
  const rateUnit   = isWeekly ? "weeks" : "days"

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Progress</Typography>
        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
          label="Premium"
          size="small"
          sx={{ bgcolor: colors.softBlue, color: colors.primary, fontWeight: 700, ml: 1 }}
        />
      </Box>

      {/* ── Weekly activity — all daily habits ── */}
      {weeklyLineData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <SectionTitle>Weekly Activity Of All Daily Habits</SectionTitle>
          <WeeklyLineChart data={weeklyLineData} />
        </Paper>
      )}

      <Divider sx={{ mb: 4 }} />

      {/* ── Habit Analytics: individual habit selection ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Habit Analytics</Typography>
        <HabitHealthRow
          habits={habits}
          selectedId={selectedId || habit._id}
          onSelect={setSelectedId}
          now={now}
        />
      </Box>

      {/* ── Insight ── */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: colors.softBlue, borderColor: `${colors.primary}33` }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <AutoAwesomeIcon sx={{ color: colors.primary, mt: 0.25, flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: colors.primary, mb: 0.5 }}>
              Your insight
            </Typography>
            <Typography variant="body2">{insight}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* ── Streak status ── */}
      <Box sx={{ mb: 3 }}>
        {!checkedToday && habit.streak > 0 && (
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1,
            bgcolor: "#fffbeb", border: "1px solid #fbbf24",
            borderRadius: 2, px: 2, py: 1,
          }}>
            <WarningAmberIcon sx={{ color: colors.orange, fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: "#92400e" }}>
              Not yet {isBreak ? "clean" : "checked in"} today! your {habit.streak}{streakUnit} streak is at risk
            </Typography>
          </Box>
        )}
        {checkedToday && (
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1,
            bgcolor: colors.softGreen, border: `1px solid ${colors.green}44`,
            borderRadius: 2, px: 2, py: 1,
          }}>
            <CheckCircleOutlineIcon sx={{ color: colors.green, fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: colors.green }}>
              {isBreak ? "Kept clean today ✓" : "Checked in today ✓"}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Summary stat cards ── */}
      <Box sx={{ mb: 4 }}>
        <SectionTitle>Summary  {habit.title}</SectionTitle>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
          <StatCard
            label={isBreak ? "Clean streak" : "Current streak"}
            value={`${habit.streak}${streakUnit}`}
            sublabel={isWeekly ? "Consecutive weeks" : "Consecutive days"}
            color={colors.orange}
          />
          <StatCard
            label="Best streak"
            value={`${bestStreak}${streakUnit}`}
            sublabel="Personal record"
          />
          <StatCard
            label={isBreak ? "Clean rate" : "Completion rate"}
            value={`${completionRate}%`}
            sublabel={`${checkins.length} / ${totalExpected} ${rateUnit}`}
          />
          <StatCard
            label="This month"
            value={`${monthlyStats.thisMonthRate}%`}
            sublabel={monthlyStats.bestLabel
              ? `Best: ${monthlyStats.bestLabel} (${monthlyStats.bestRate}%)`
              : "No prior data"}
            color={monthlyStats.thisMonthRate >= 70 ? colors.green : colors.orange}
          />
        </Stack>
      </Box>

      {/* ── Trend ── */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <SectionTitle>Trend</SectionTitle>
          <Typography variant="body2" sx={{
            fontWeight: 700,
            color: momentum.diff > 0 ? colors.green : momentum.diff < 0 ? "#e53e3e" : "text.secondary",
          }}>
            Last 7d: {momentum.last7Rate}%{" "}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
              ({momentum.diff > 0 ? "+" : ""}{momentum.diff}% vs prior week)
            </Typography>
          </Typography>
        </Box>
        <RollingTrendChart data={rollingTrend} frequency={habit.frequency} />
      </Paper>

      {/* ── Calendar + Weekday bars ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <SectionTitle>Calendar</SectionTitle>
          <Heatmap
            cells={heatmap.cells}
            habitType={habit.habitType}
            fromCreation={heatmap.fromCreation}
            startDate={heatmap.startDate}
          />
        </Paper>

        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <SectionTitle>By Weekday</SectionTitle>
            <WeekdayBars data={weekdayData} />
            {!isWeekly && bestDay && worstDay && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                <Chip
                  label={`Best: ${bestDay.day} (${bestDay.rate}%)`}
                  size="small"
                  sx={{ bgcolor: colors.softGreen, color: colors.green }}
                />
                <Chip
                  label={`Hardest: ${worstDay.day} (${worstDay.rate}%)`}
                  size="small"
                  sx={{ bgcolor: "#fff3f3", color: "#e53e3e" }}
                />
              </Stack>
            )}
            {recovery.breaks > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colors.border}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Recovery after streak breaks
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {recovery.breaks} break{recovery.breaks > 1 ? "s" : ""} · avg {recovery.avgDays}d to resume
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                  {recovery.details.slice(0, 6).map((d, i) => (
                    <Chip key={i} label={`${d}d`} size="small"
                      sx={{ height: 20, fontSize: 11, bgcolor: "#f1f5f9" }} />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Stack>
      </Box>

    </Box>
  )
}

export default Progress
