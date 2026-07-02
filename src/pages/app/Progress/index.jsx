import { useEffect, useMemo, useState } from "react"
import { useAuthContext } from "../../../auth/useAuthContext"
import { useHabitsContext } from "../../../hooks/useHabitsContext"

import format from "date-fns/format"

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import {
  Box, Chip, CircularProgress, Divider,
  IconButton, Paper, Stack, Tooltip, Typography,
} from "@mui/material"

import { colors } from '../../../styles/tokens'
import { sectionTitleSx } from '../../../styles/recipes'


import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts"

import UpgradeButton from "../../../billing/UpgradeButton"
import PageHeader from "../../../components/layout/PageHeader"

import {
  buildActionableInsight,
  computeBestStreak,
  computeHabitReadiness,
  computeHeatmap,
  computeMonthlyStats,
  computeOverallConsistency,
  computeOverallMomentum,
  computeOverallRecovery,
  computeRecovery,
  computeWeekdayRates,
  computeWeeklyLineData,
  getExpectedCount,
  getReadinessStatus,
  isCheckedInToday,
  uniqueCheckinDays,
} from "./analytics"


// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Section heading shown above each dashboard area — uses the app-wide sectionTitleSx. */
const SectionTitle = ({ children }) => (
  <Typography sx={{ ...sectionTitleSx, display: "block", mb: 1.5 }}>
    {children}
  </Typography>
)

/**
 * Small (i) icon that shows a plain-language explanation when hovered.
 * Used on metrics that aren't self-evident from their label alone.
 */
const InfoTooltip = ({ text }) => (
  <Tooltip title={text} placement="top" arrow>
    <IconButton size="small" disableRipple sx={{ p: 0, ml: 0.5, color: "text.disabled", cursor: "help" }}>
      <InfoOutlinedIcon sx={{ fontSize: 14 }} />
    </IconButton>
  </Tooltip>
)

/**
 * Metric card with a large colored value and an optional caption.
 * Pass infoText to show an (i) button explaining how the metric is calculated.
 */
const StatCard = ({ label, value, sublabel, color = colors.primary, infoText }) => (
  <Paper sx={{ p: 2.5, flex: 1, minWidth: 120 }}>
    {/* Label row - info icon appears only when infoText is supplied */}
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      {infoText && <InfoTooltip text={infoText} />}
    </Box>
    <Typography variant="h4" sx={{ fontWeight: 800, color, my: 0.5 }}>{value}</Typography>
    {sublabel && <Typography variant="caption" color="text.secondary">{sublabel}</Typography>}
  </Paper>
)


// ---------------------------------------------------------------------------
// Hero Habit Pulse
// ---------------------------------------------------------------------------

/**
 * Circular gauge at the top of the page.
 *
 * The Habit Pulse score (0-100) is a combined measure of today's completions,
 * active streaks, and long-term consistency across all your habits.
 *   >= 70 → green ("Strong")
 *   >= 50 → orange ("Building")
 *   < 50  → red ("Needs attention")
 *
 * The insight line warns about at-risk streaks first; otherwise it reports
 * how many habits you've completed today.
 */
const HeroHabitScore = ({ score, habits, now }) => {
  const status       = getReadinessStatus(score)
  const atRiskCount  = habits.filter(h => h.streak > 0 && !isCheckedInToday(h, now)).length
  const checkedCount = habits.filter(h => isCheckedInToday(h, now)).length

  const scoreColor =
    score >= 70 ? colors.green :
    score >= 50 ? colors.orange :
    "#e53e3e"

  const insight = atRiskCount > 0
    ? `${atRiskCount} habit${atRiskCount > 1 ? "s" : ""} at streak risk. Check in to protect your progress.`
    : checkedCount === habits.length
      ? "All habits done for today. Excellent execution."
      : `${checkedCount} of ${habits.length} habits completed today.`

  // Plain-language description shown in the (i) tooltip
  const pulseInfo =
    "Habit Pulse (0–100) combines today's completions, your active streaks, " +
    "and your long-term consistency across all habits. 100 = perfect on everything."

  return (
    <Paper
      sx={{
        p: 3, mb: 3,
        bgcolor: colors.softBlue,
        borderColor: `${colors.primary}33`,
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "center" }}>
        {/* Circular gauge */}
        <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
          {/* Grey track behind the coloured arc */}
          <CircularProgress
            variant="determinate" value={100} size={120} thickness={5}
            sx={{ color: "#e2e8f0", position: "absolute" }}
          />
          <CircularProgress
            variant="determinate" value={score} size={120} thickness={5}
            sx={{ color: scoreColor }}
          />
          {/* Score number centred inside the gauge */}
          <Box sx={{
            top: 0, left: 0, bottom: 0, right: 0, position: "absolute",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column",
          }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
              {score}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              pulse
            </Typography>
          </Box>
        </Box>

        {/* Status label + insight text */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="overline" color="text.secondary">
              Today's Habit Pulse
            </Typography>
            <InfoTooltip text={pulseInfo} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: scoreColor, lineHeight: 1.2, mb: 0.5 }}>
            {status}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {insight}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}


// ---------------------------------------------------------------------------
// Signal cards (all-habits overview)
// ---------------------------------------------------------------------------

/**
 * Summary card for a single portfolio-level metric.
 * tone controls the value colour: "good" green, "warning" orange, "bad" red.
 * Pass infoText to show an (i) button explaining the calculation.
 */
const SignalCard = ({ title, value, description, tone = "neutral", infoText }) => {
  const toneColor =
    tone === "good"    ? colors.green :
    tone === "warning" ? colors.orange :
    tone === "bad"     ? "#e53e3e" :
    colors.primary

  return (
    <Paper sx={{ p: 2.5, flex: 1, minWidth: 160 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
        {infoText && <InfoTooltip text={infoText} />}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 900, color: toneColor, my: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  )
}


// ---------------------------------------------------------------------------
// Habit selector row
// ---------------------------------------------------------------------------

/**
 * Row of clickable habit cards. Selecting one switches the per-habit analytics
 * section below. Each card shows:
 *   - Habit name
 *   - Today's status icon (✓ done, ⚠ at risk)
 *   - Current streak (d = days, w = weeks)
 *   - All-time completion bar (green ≥ 70%, orange ≥ 40%, red below)
 */
const HabitHealthRow = ({ habits, selectedId, onSelect, now }) => (
  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
    {habits.map(habit => {
      const checkins   = habit.checkins || []
      const exp        = getExpectedCount(habit.createdAt, now, habit.frequency)
      const comp       = uniqueCheckinDays(checkins).length
      const rate       = Math.min(100, Math.round(comp / exp * 100))
      const checked    = isCheckedInToday(habit, now)
      const atRisk     = habit.streak > 0 && !checked
      const isSelected = habit._id === selectedId
      const barColor   = rate >= 70 ? colors.green : rate >= 40 ? colors.orange : "#e53e3e"

      return (
        <Paper
          key={habit._id}
          onClick={() => onSelect(habit._id)}
          sx={{
            p: 2, width: 160, flexShrink: 0, cursor: "pointer",
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
            bgcolor: isSelected ? colors.softBlue : "background.paper",
            transition: "all 0.15s",
            "&:hover": { borderColor: colors.primary, bgcolor: colors.softBlue },
          }}
        >
          {/* Name + status icon */}
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
          {/* Streak value */}
          <Typography variant="h6" sx={{ fontWeight: 800, color: colors.orange, lineHeight: 1 }}>
            {habit.streak}{habit.frequency === "weekly" ? "w" : "d"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {habit.habitType === "break" ? "clean streak" : "streak"}
          </Typography>
          {/* All-time completion bar */}
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


// ---------------------------------------------------------------------------
// Coach Insight card
// ---------------------------------------------------------------------------

/** Shows the highest-priority personalized tip for the selected habit. */
const CoachInsightCard = ({ insight }) => (
  <Paper
    sx={{ p: 3, mb: 3, bgcolor: colors.softBlue, borderColor: `${colors.primary}33` }}
  >
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <AutoAwesomeIcon sx={{ color: colors.primary, mt: 0.25, flexShrink: 0 }} />
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: colors.primary, mb: 0.5 }}>
          {insight.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {insight.message}
        </Typography>
        {insight.action && (
          <Chip
            label={insight.action}
            size="small"
            sx={{ mt: 1, bgcolor: `${colors.primary}18`, color: colors.primary, fontWeight: 700 }}
          />
        )}
      </Box>
    </Box>
  </Paper>
)


// ---------------------------------------------------------------------------
// Weekly Performance line chart (all daily habits)
// ---------------------------------------------------------------------------

/**
 * Mon–Sun line chart comparing three series for all daily habits:
 *   • This week   – completion % for each day so far this week
 *   • Last week   – same days last week (reference line)
 *   • Baseline    – your all-time average for each weekday
 *
 * Days still in the future this week are shown as gaps (null values).
 *
 * Y-axis: completion rate in % (0–100, auto-scaled to the visible range).
 * X-axis: weekday abbreviations (Mon–Sun) — no axis label needed.
 */
const WeeklyLineChart = ({ data }) => {
  const hasFutureDays = data.some(p => p.thisWeek === null)
  const allValues = data.flatMap(p =>
    [p.thisWeek, p.lastWeek, p.baseline].filter(v => v != null)
  )
  // Auto-scale Y so the lines fill the chart without touching the edges
  const yMin = allValues.length ? Math.max(0,   Math.min(...allValues) - 10) : 0
  const yMax = allValues.length ? Math.min(100, Math.max(...allValues) + 10) : 100

  return (
    <Box>
      <ResponsiveContainer width="100%" height={220}>
        {/* Extra left margin to fit the rotated Y-axis label */}
        <LineChart data={data} margin={{ top: 8, right: 20, bottom: 4, left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />

          {/* X-axis: weekday abbreviations — self-explanatory, no label needed */}
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />

          {/* Y-axis: shows the completion percentage. Label rotated on the left side. */}
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 12 }}
            unit="%"
            label={{
              value: "Completion %",
              angle: -90,
              position: "insideLeft",
              offset: -8,
              fontSize: 11,
              fill: "#94a3b8",
            }}
          />

          <RTooltip
            formatter={(v, name) => [
              v == null ? "-" : `${v}%`,
              name === "thisWeek" ? "This week" : name === "lastWeek" ? "Last week" : "Baseline",
            ]}
          />
          <Legend
            formatter={n =>
              n === "thisWeek" ? "This week" : n === "lastWeek" ? "Last week" : "Baseline"
            }
          />

          {/* This week — solid primary colour */}
          <Line type="monotone" dataKey="thisWeek"
            stroke={colors.primary} strokeWidth={2.5}
            dot={{ r: 4, fill: colors.primary }} activeDot={{ r: 6 }} connectNulls={false} />

          {/* Last week — dashed grey reference line */}
          <Line type="monotone" dataKey="lastWeek"
            stroke={colors.muted} strokeWidth={2} strokeDasharray="5 3"
            dot={{ r: 3, fill: colors.muted }} connectNulls={false} />

          {/* Baseline — dotted orange (your all-time weekday average) */}
          <Line type="monotone" dataKey="baseline"
            stroke={colors.orange} strokeWidth={2} strokeDasharray="2 2"
            dot={{ r: 3, fill: colors.orange }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>

      {hasFutureDays && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          This week shown through today — future days are hidden
        </Typography>
      )}
    </Box>
  )
}


// ---------------------------------------------------------------------------
// Calendar heatmap
// ---------------------------------------------------------------------------

/**
 * GitHub-style grid showing check-in history for the selected habit.
 * Layout: 7 columns (Mon–Sun), one row per week, newest day bottom-right.
 * Month names appear above the column where each new month starts.
 *
 * For regular habits: coloured cell = checked in, grey = missed.
 * For break habits:   green = clean day (no slip), grey = slip day.
 *
 * Caption shows total period, completions, and consistency percentage.
 */
const Heatmap = ({ cells, habitType, fromCreation, startDate, completedCount, totalCount }) => {
  if (!cells.length) return null

  const isBreak  = habitType === "break"
  const firstDay = cells[0].date.getDay()
  // Pad the grid so the first cell lands on the correct weekday column (Mon = 0)
  const padding  = firstDay === 0 ? 6 : firstDay - 1
  const totalCols = Math.ceil((padding + cells.length) / 7)

  // Build a map of column index → month abbreviation for the header row
  const monthLabels = {}
  cells.forEach((cell, i) => {
    const col      = Math.floor((padding + i) / 7)
    const prevDate = i > 0 ? cells[i - 1].date : null
    if (i === 0 || (prevDate && cell.date.getMonth() !== prevDate.getMonth()))
      monthLabels[col] = format(cell.date, "MMM")
  })

  const checkedColor = isBreak ? colors.green : colors.primary
  const checkedLabel = isBreak ? "Clean day" : "Done"
  const missedLabel  = isBreak ? "Slip day"  : "Missed"
  const consistency  = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <Box>
      {/* Period summary above the grid */}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        {fromCreation
          ? `Since ${format(startDate, "MMM d, yyyy")}`
          : `Last ${totalCount} days`
        } · {completedCount}/{totalCount} completed · {consistency}% consistency
      </Typography>

      {/* Month labels spanning across the grid columns */}
      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${totalCols}, 1fr)`, gap: 0.5, mb: 0.25 }}>
        {Array.from({ length: totalCols }, (_, col) => (
          <Typography key={col} variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
            {monthLabels[col] || ""}
          </Typography>
        ))}
      </Box>

      {/* Weekday column headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <Typography key={i} variant="caption" color="text.secondary"
            sx={{ textAlign: "center", fontSize: 10 }}>{d}</Typography>
        ))}
      </Box>

      {/* The heatmap cells */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {/* Empty cells to align the first real day to its weekday column */}
        {Array.from({ length: padding }).map((_, i) => (
          <Box key={`pad-${i}`} sx={{ aspectRatio: "1" }} />
        ))}
        {/* One cell per day — tooltip shows the date and check-in status */}
        {cells.map((day, i) => (
          <Tooltip key={i}
            title={`${format(day.date, "MMM d")} · ${day.checked ? checkedLabel : missedLabel}`}
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

      {/* Extra legend for break habits where color meaning differs */}
      {isBreak && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Green = clean day · grey = slip day
        </Typography>
      )}
    </Box>
  )
}


// ---------------------------------------------------------------------------
// Weekday bar chart
// ---------------------------------------------------------------------------

/**
 * Horizontal bar per weekday showing historical completion rate for the
 * selected habit. Color: green ≥ 70%, orange ≥ 40%, red below 40%.
 * The percentage value is printed on the right side of each bar.
 */
const WeekdayBars = ({ data }) => (
  <Stack spacing={1}>
    {/* Y-axis label above the bars */}
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
      Completion rate (%) per weekday
    </Typography>
    {data.map(({ day, rate }) => (
      <Box key={day} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* Weekday abbreviation acts as the label for this bar */}
        <Typography variant="caption" sx={{ width: 28, color: "text.secondary", flexShrink: 0 }}>
          {day}
        </Typography>
        {/* Bar track */}
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


// ---------------------------------------------------------------------------
// Paywall
// ---------------------------------------------------------------------------

/** Shown instead of the dashboard when the user does not have Premium. */
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
      momentum analytics, and personalised insights.
    </Typography>
    <UpgradeButton
      label="Upgrade to Premium"
      showIcon
      size="large"
      sx={{ px: 3 }}
    />
  </Box>
)


// ---------------------------------------------------------------------------
// Main Progress page
// ---------------------------------------------------------------------------

/**
 * Progress dashboard — fetches habits on mount, then renders:
 *
 *   1. Habit Pulse gauge      — combined readiness score for today (0-100)
 *   2. Signal cards           — Consistency, Momentum, Recovery across all habits
 *   3. Weekly Performance     — Mon-Sun line chart for all daily habits
 *   4. Habit selector row     — click to see analytics for a specific habit
 *   5. Coach Insight          — highest-priority personalized tip
 *   6. Streak banner          — at-risk warning or daily completion confirmation
 *   7. Summary stat cards     — streak, best, rate, month, week for selected habit
 *   8. Calendar + By Weekday  — heatmap (last 45 days) and per-weekday bar chart
 */
const Progress = () => {
  const { user }             = useAuthContext()
  const { habits, dispatch } = useHabitsContext()
  const [selectedId, setSelectedId] = useState(null)

  const isPremium = user?.subscription === "premium" || user?.accountType === "manager"

  // Load habits from the server once if they haven't been fetched yet
  useEffect(() => {
    if (habits === null && user) {
      fetch("/api/habits", { headers: { Authorization: `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(json => dispatch({ type: "SET_HABITS", payload: json }))
    }
  }, [habits, user, dispatch])

  // Auto-select the first habit when the list first arrives
  useEffect(() => {
    if (habits?.length && !selectedId) setSelectedId(habits[0]._id)
  }, [habits, selectedId])

  if (!isPremium) return <PaywallBanner />
  if (!habits)    return <Typography p={4}>Loading...</Typography>
  if (!habits.length) return (
    <Typography p={4} color="text.secondary">
      No habits yet — add some from Today to start tracking.
    </Typography>
  )

  // Frozen once on mount so every calculation shares the same "now"
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [])

  // ---- Portfolio-level metrics (all habits) ----
  const readinessScore     = useMemo(() => computeHabitReadiness(habits, now),     [habits, now])
  const overallConsistency = useMemo(() => computeOverallConsistency(habits, now),  [habits, now])
  const overallMomentum    = useMemo(() => computeOverallMomentum(habits, now),     [habits, now])
  const overallRecovery    = useMemo(() => computeOverallRecovery(habits),           [habits])
  const weeklyLineData     = useMemo(() => computeWeeklyLineData(habits, now),       [habits, now])

  // ---- Selected habit (defaults to first until the user clicks a card) ----
  const selectedHabit = useMemo(
    () => habits.find(h => h._id === selectedId) || habits[0],
    [habits, selectedId]
  )

  // ---- Per-habit analytics — only recomputes when the selection changes ----
  const habitAnalytics = useMemo(() => {
    const habit    = selectedHabit
    const checkins = habit.checkins || []
    const created  = new Date(habit.createdAt)
    const expected = getExpectedCount(created, now, habit.frequency)
    const completed = uniqueCheckinDays(checkins).length
    const completionRate = Math.min(100, Math.round(completed / expected * 100))

    // Use the server-computed bestStreak when available (it uses exact period logic)
    const bestStreak   = habit.bestStreak ?? computeBestStreak(checkins, habit.frequency)
    const weekdayData  = computeWeekdayRates(checkins, created, now)
    // maxDays=45 keeps the heatmap compact enough to sit alongside the weekday bars
    const heatmap      = computeHeatmap(checkins, created, now, 45)
    const recovery     = computeRecovery(checkins, habit.frequency)
    const monthlyStats = computeMonthlyStats(checkins, habit.frequency, now)
    const insight      = buildActionableInsight(
      habit, checkins, completionRate, weekdayData, recovery, bestStreak, now
    )

    // This-week rate: count check-ins from Monday up to and including today
    const todayN  = new Date(now); todayN.setHours(0, 0, 0, 0)
    const dow     = todayN.getDay()
    const weekMon = new Date(todayN); weekMon.setDate(todayN.getDate() - (dow === 0 ? 6 : dow - 1))
    const daysElapsed = (dow === 0 ? 6 : dow - 1) + 1
    const daySet  = new Set(checkins.map(c => { const d = new Date(c.date); d.setHours(0,0,0,0); return d.getTime() }))
    let weekHits = 0
    for (let i = 0; i < daysElapsed; i++) {
      const d = new Date(weekMon); d.setDate(weekMon.getDate() + i)
      if (daySet.has(d.getTime())) weekHits++
    }
    const weekExp      = habit.frequency === "weekly" ? 1 : daysElapsed
    const thisWeekRate = Math.min(100, Math.round(weekHits / weekExp * 100))
    const thisWeekSub  = habit.frequency === "weekly"
      ? (weekHits >= 1 ? "Done ✓" : "Not yet this week")
      : `${weekHits} / ${daysElapsed} days`

    return {
      expected, completed, completionRate,
      bestStreak, weekdayData, heatmap, thisWeekRate, thisWeekSub,
      recovery, monthlyStats, insight,
    }
  }, [selectedHabit, now])

  const habit        = selectedHabit
  const isWeekly     = habit.frequency === "weekly"
  const isBreak      = habit.habitType === "break"
  const streakUnit   = isWeekly ? "w" : "d"
  const rateUnit     = isWeekly ? "weeks" : "days"
  const checkedToday = isCheckedInToday(habit, now)

  const {
    expected, completed, completionRate, bestStreak, weekdayData,
    heatmap, thisWeekRate, thisWeekSub, recovery, monthlyStats, insight,
  } = habitAnalytics

  const worstDay = isWeekly ? null : [...weekdayData].sort((a, b) => a.rate - b.rate)[0]
  const bestDay  = isWeekly ? null : [...weekdayData].sort((a, b) => b.rate - a.rate)[0]

  return (
    <Box>
      <PageHeader
        title="Progress"
        titleAdornment={(
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
            label="Premium"
            size="small"
            sx={{ bgcolor: colors.softBlue, color: colors.primary }}
          />
        )}
        sx={{ mb: 3 }}
      />

      {/* 1. Habit Pulse — overall score for today */}
      <HeroHabitScore score={readinessScore} habits={habits} now={now} />

      {/* 2. Signal cards — portfolio summary across all habits */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <SignalCard
          title="Consistency"
          value={`${overallConsistency}%`}
          description="Average long-term completion rate across all your habits."
          tone={overallConsistency >= 70 ? "good" : overallConsistency >= 40 ? "warning" : "bad"}
          infoText={
            "Consistency = your all-time check-in rate averaged across every habit. " +
            "100% means you have never missed a scheduled day."
          }
        />
        <SignalCard
          title="Momentum"
          value={`${overallMomentum.diff > 0 ? "+" : ""}${overallMomentum.diff}%`}
          description="Week-over-week change across all daily habits."
          tone={overallMomentum.diff > 5 ? "good" : overallMomentum.diff < -5 ? "bad" : "warning"}
          infoText={
            "Momentum = this week's average completion % minus last week's, " +
            "across all your daily habits. Positive means you're improving; negative means you slipped."
          }
        />
        <SignalCard
          title="Recovery"
          value={overallRecovery.breaks ? `${overallRecovery.avgDays.toFixed(1)}d` : "Stable"}
          description={
            overallRecovery.breaks
              ? `Average days to resume after ${overallRecovery.breaks} streak break${overallRecovery.breaks > 1 ? "s" : ""}.`
              : "No streak breaks across all habits."
          }
          tone={overallRecovery.breaks === 0 ? "good" : overallRecovery.avgDays <= 2 ? "warning" : "bad"}
          infoText={
            "Recovery = average number of days between breaking a streak and checking in again. " +
            "Fewer days is better — it means you bounce back quickly."
          }
        />
      </Stack>

      <Divider sx={{ mb: 4 }} />

      {/* 3. Weekly Performance line chart — only shown when daily habits exist */}
      {weeklyLineData.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <SectionTitle>Weekly Performance — all daily habits</SectionTitle>
          <WeeklyLineChart data={weeklyLineData} />
        </Paper>
      )}

      <Divider sx={{ mb: 4 }} />

      {/* 4. Habit selector — click a card to drill into that habit's analytics */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Habit Analytics</Typography>
        <HabitHealthRow
          habits={habits}
          selectedId={selectedId || habit._id}
          onSelect={setSelectedId}
          now={now}
        />
      </Box>

      {/* 5. Coach Insight */}
      <CoachInsightCard insight={insight} />

      {/* 6. Streak status banner — at-risk warning or daily completion confirmation */}
      <Box sx={{ mb: 3 }}>
        {!checkedToday && habit.streak > 0 && (
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1,
            bgcolor: "#fffbeb", border: "1px solid #fbbf24",
            borderRadius: 2, px: 2, py: 1,
          }}>
            <WarningAmberIcon sx={{ color: colors.orange, fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: "#92400e" }}>
              Not checked in yet — your {habit.streak}{streakUnit} streak is at risk.
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

      {/* 7. Summary stat cards for the selected habit */}
      <Box sx={{ mb: 4 }}>
        <SectionTitle>Summary · {habit.title}</SectionTitle>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {/* Current streak — consecutive days/weeks without missing */}
          <StatCard
            label={isBreak ? "Clean streak" : "Current streak"}
            value={`${habit.streak}${streakUnit}`}
            sublabel={isWeekly ? "Consecutive weeks" : "Consecutive days"}
            color={colors.orange}
          />
          {/* Best streak — all-time personal record */}
          <StatCard
            label="Best streak"
            value={`${bestStreak}${streakUnit}`}
            sublabel="Personal record"
          />
          {/* Completion rate — all-time check-ins ÷ expected check-ins */}
          <StatCard
            label={isBreak ? "Clean rate" : "Completion rate"}
            value={`${completionRate}%`}
            sublabel={`${completed} / ${expected} ${rateUnit}`}
            infoText={
              "Completion rate = number of days you checked in ÷ number of days " +
              "this habit was scheduled, counted from the day you created it."
            }
          />
          {/* This month — completion rate for the current calendar month */}
          <StatCard
            label="This month"
            value={`${monthlyStats.thisMonthRate}%`}
            sublabel={monthlyStats.bestLabel
              ? `Best: ${monthlyStats.bestLabel} (${monthlyStats.bestRate}%)`
              : "No prior data"}
            color={monthlyStats.thisMonthRate >= 70 ? colors.green : colors.orange}
            infoText={
              "Completion rate for the current calendar month. " +
              "The 'Best' label shows your highest monthly rate across all previous months."
            }
          />
          {/* This week — completion rate from Monday through today */}
          <StatCard
            label="This week"
            value={`${thisWeekRate}%`}
            sublabel={thisWeekSub}
            color={thisWeekRate >= 70 ? colors.green : thisWeekRate >= 40 ? colors.orange : "#e53e3e"}
          />
        </Box>
      </Box>

      {/* 8. Calendar heatmap + By Weekday bars — side by side on wider screens */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
        <Paper sx={{ p: 3 }}>
          <SectionTitle>Calendar — last 45 days</SectionTitle>
          <Heatmap
            cells={heatmap.cells}
            habitType={habit.habitType}
            fromCreation={heatmap.fromCreation}
            startDate={heatmap.startDate}
            completedCount={heatmap.completedCount}
            totalCount={heatmap.totalCount}
          />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <SectionTitle>By Weekday</SectionTitle>
          <WeekdayBars data={weekdayData} />

          {/* Best/worst day chips */}
          {!isWeekly && bestDay && worstDay && (
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
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

          {/* Recovery detail — only shown when streak breaks exist */}
          {recovery.breaks > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colors.border}` }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Recovery after streak breaks
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {recovery.breaks} break{recovery.breaks > 1 ? "s" : ""} · avg {recovery.avgDays.toFixed(1)}d to resume
              </Typography>
              {/* One chip per break showing how many days it took to check in again */}
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                {recovery.details.slice(0, 6).map((d, i) => (
                  <Chip key={i} label={`${d}d`} size="small"
                    sx={{ height: 20, fontSize: 11, bgcolor: "#f1f5f9" }} />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  )
}

export default Progress
