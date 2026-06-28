import { useEffect, useMemo, useState } from "react"
import { useAuthContext } from "../../../auth/useAuthContext"
import { useHabitsContext } from "../../../hooks/useHabitsContext"

import format from "date-fns/format"

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import {
  Box, Chip, CircularProgress, Divider,
  Paper, Stack, Tooltip, Typography,
} from "@mui/material"
import { colors } from "../../../theme"

import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts"

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


// --- Shared primitives ---

/** Overline label used above each dashboard section. */
const SectionTitle = ({ children }) => (
  <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
    {children}
  </Typography>
)

/** Metric card with a large colored value, caption label, and optional sub-label. */
const StatCard = ({ label, value, sublabel, color = colors.primary }) => (
  <Paper variant="outlined" sx={{ p: 2.5, flex: 1, minWidth: 120 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h4" sx={{ fontWeight: 800, color, my: 0.5 }}>{value}</Typography>
    {sublabel && <Typography variant="caption" color="text.secondary">{sublabel}</Typography>}
  </Paper>
)


// --- Hero Habit Readiness ---

/**
 * Circular gauge shown at the top of the page displaying the Habit Pulse score.
 * Score color: green >= 70, orange >= 50, red below.
 * Insight line: prioritizes at-risk streak warning, then today's completion count.
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

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3, mb: 3,
        bgcolor: colors.softBlue,
        borderColor: `${colors.primary}33`,
        borderRadius: 4,
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
        <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={120}
            thickness={5}
            sx={{ color: "#e2e8f0", position: "absolute" }}
          />
          <CircularProgress
            variant="determinate"
            value={score}
            size={120}
            thickness={5}
            sx={{ color: scoreColor }}
          />
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

        <Box>
          <Typography variant="overline" color="text.secondary">
            Today's Habit Pulse
          </Typography>
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


// --- Signal cards (all-habits level) ---

/**
 * One of three summary cards shown above the habit selector.
 * tone prop controls value color: "good" green, "warning" orange, "bad" red.
 */
const SignalCard = ({ title, value, description, tone = "neutral" }) => {
  const toneColor =
    tone === "good"    ? colors.green :
    tone === "warning" ? colors.orange :
    tone === "bad"     ? "#e53e3e" :
    colors.primary
  return (
    <Paper variant="outlined" sx={{ p: 2.5, flex: 1, minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, color: toneColor, my: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  )
}


// --- Habit selector row ---

/**
 * Wrapping row of habit cards. Clicking a card sets selectedId in Progress,
 * which switches the per-habit analytics section below.
 * Each card shows: name, current streak, today's status icon, all-time completion bar.
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


// --- Coach Insight card ---

/**
 * Displays the highest-priority insight from buildActionableInsight().
 * Shows title + message + optional action chip.
 */
const CoachInsightCard = ({ insight }) => (
  <Paper
    variant="outlined"
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


// --- Weekly performance line chart (all habits) ---

/**
 * Three-line chart comparing this week vs last week vs all-time baseline
 * across all daily habits. Future days in the current week are null (hidden).
 * Data is built by computeWeeklyLineData in analytics.js.
 */
const WeeklyLineChart = ({ data }) => {
  const hasFutureDays = data.some(p => p.thisWeek === null)
  const allValues = data.flatMap(p =>
    [p.thisWeek, p.lastWeek, p.baseline].filter(v => v != null)
  )
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
              v == null ? "-" : `${v}%`,
              name === "thisWeek" ? "This week" : name === "lastWeek" ? "Last week" : "Baseline",
            ]}
          />
          <Legend
            formatter={n =>
              n === "thisWeek" ? "This week" : n === "lastWeek" ? "Last week" : "Baseline"
            }
          />
          <Line type="monotone" dataKey="thisWeek"
            stroke={colors.primary} strokeWidth={2.5}
            dot={{ r: 4, fill: colors.primary }} activeDot={{ r: 6 }} connectNulls={false} />
          <Line type="monotone" dataKey="lastWeek"
            stroke={colors.muted} strokeWidth={2} strokeDasharray="5 3"
            dot={{ r: 3, fill: colors.muted }} connectNulls={false} />
          <Line type="monotone" dataKey="baseline"
            stroke={colors.orange} strokeWidth={2} strokeDasharray="2 2"
            dot={{ r: 3, fill: colors.orange }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
      {hasFutureDays && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          This week shown through today - future days are hidden
        </Typography>
      )}
    </Box>
  )
}


// --- Calendar heatmap ---

/**
 * GitHub-style contribution grid showing check-in history.
 * Cells are laid out in a 7-column grid (columns = Mon-Sun, rows = weeks).
 * Month labels appear above the column where each new month starts.
 *
 * fromCreation true  -> caption shows "Since <creation date>"
 * fromCreation false -> caption shows "Last <n> days" (n = totalCount)
 *
 * For break habits: green = clean day, grey = slip day.
 */
const Heatmap = ({ cells, habitType, fromCreation, startDate, completedCount, totalCount }) => {
  if (!cells.length) return null
  const isBreak    = habitType === "break"
  const firstDay   = cells[0].date.getDay()
  const padding    = firstDay === 0 ? 6 : firstDay - 1
  const totalCols  = Math.ceil((padding + cells.length) / 7)

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
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        {fromCreation
          ? `Since ${format(startDate, "MMM d, yyyy")}`
          : `Last ${totalCount} days`
        } · {completedCount}/{totalCount} completed · {consistency}% consistency
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${totalCols}, 1fr)`, gap: 0.5, mb: 0.25 }}>
        {Array.from({ length: totalCols }, (_, col) => (
          <Typography key={col} variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
            {monthLabels[col] || ""}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
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
      {isBreak && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Green = clean day · grey = slip day
        </Typography>
      )}
    </Box>
  )
}


// --- Weekday bar chart ---

/** Horizontal bar per weekday showing historical completion rate. Color: green/orange/red. */
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


// --- Paywall ---

/** Shown instead of the dashboard when the user does not have a premium subscription. */
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
    <Chip
      icon={<AutoAwesomeIcon />}
      label="Upgrade to Premium"
      color="primary"
      sx={{ fontWeight: 700, px: 2, py: 2.5, fontSize: "0.9rem" }}
    />
  </Box>
)


// --- Main Progress page ---

/**
 * Page layout and data orchestration for the Progress dashboard.
 *
 * Sections rendered top to bottom:
 *   1. Hero Habit Pulse gauge   - overall readiness score for today
 *   2. Signal cards             - Consistency, Momentum, Recovery across all habits
 *   3. Weekly Performance chart - Mon-Sun line chart for all daily habits
 *   4. Habit selector row       - click to choose which habit's analytics to view
 *   5. Coach Insight card       - highest-priority personalized message
 *   6. Streak status banner     - at-risk warning or checked-in confirmation
 *   7. Summary stat cards       - streak, best, rate, month, week for selected habit
 *   8. Calendar + By Weekday    - heatmap (last 45 days) and per-weekday bar chart
 *
 * Memos:
 *   now             - frozen once on mount; shared by all calculations
 *   all-habits      - recompute when habits list changes
 *   selectedHabit   - resolves selectedId -> habit object
 *   habitAnalytics  - all per-habit metrics; recomputes only when selectedHabit changes
 */
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
  if (!habits)    return <Typography p={4}>Loading...</Typography>
  if (!habits.length) return (
    <Typography p={4} color="text.secondary">
      No habits yet - add some from Today to start tracking.
    </Typography>
  )

  // Frozen timestamp so all memos share the same "today" reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [])

  // All-habits analytics
  const readinessScore     = useMemo(() => computeHabitReadiness(habits, now),    [habits, now])
  const overallConsistency = useMemo(() => computeOverallConsistency(habits, now), [habits, now])
  const overallMomentum    = useMemo(() => computeOverallMomentum(habits, now),    [habits, now])
  const overallRecovery    = useMemo(() => computeOverallRecovery(habits),          [habits])
  const weeklyLineData     = useMemo(() => computeWeeklyLineData(habits, now),      [habits, now])

  // Defaults to first habit until the user clicks a selector card
  const selectedHabit = useMemo(
    () => habits.find(h => h._id === selectedId) || habits[0],
    [habits, selectedId]
  )

  // Per-habit analytics - recomputes only when the selected habit changes
  const habitAnalytics = useMemo(() => {
    const habit    = selectedHabit
    const checkins = habit.checkins || []
    const created  = new Date(habit.createdAt)
    const expected = getExpectedCount(created, now, habit.frequency)
    const completed = uniqueCheckinDays(checkins).length
    const completionRate = Math.min(100, Math.round(completed / expected * 100))
    const bestStreak     = computeBestStreak(checkins, habit.frequency)
    const weekdayData    = computeWeekdayRates(checkins, created, now)
    // maxDays=45 keeps the heatmap compact alongside the weekday bars on sm+ screens
    const heatmap        = computeHeatmap(checkins, created, now, 45)
    const recovery       = computeRecovery(checkins, habit.frequency)
    const monthlyStats   = computeMonthlyStats(checkins, habit.frequency, now)
    const insight        = buildActionableInsight(
      habit, checkins, completionRate, weekdayData, recovery, bestStreak, now
    )

    // This-week rate: completions / days elapsed since Monday (honest denominator)
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
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Progress</Typography>
        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
          label="Premium"
          size="small"
          sx={{ bgcolor: colors.softBlue, color: colors.primary, fontWeight: 700, ml: 1 }}
        />
      </Box>

      {/* Hero Habit Readiness Score */}
      <HeroHabitScore score={readinessScore} habits={habits} now={now} />

      {/* Signal cards - all-habits level */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <SignalCard
          title="Consistency"
          value={`${overallConsistency}%`}
          description="Average long-term completion rate across all your habits."
          tone={overallConsistency >= 70 ? "good" : overallConsistency >= 40 ? "warning" : "bad"}
        />
        <SignalCard
          title="Momentum"
          value={`${overallMomentum.diff > 0 ? "+" : ""}${overallMomentum.diff}%`}
          description="Week-over-week change across all daily habits."
          tone={overallMomentum.diff > 5 ? "good" : overallMomentum.diff < -5 ? "bad" : "warning"}
        />
        <SignalCard
          title="Recovery"
          value={overallRecovery.breaks ? `${overallRecovery.avgDays}d` : "Stable"}
          description={
            overallRecovery.breaks
              ? `Average days to resume after ${overallRecovery.breaks} streak break${overallRecovery.breaks > 1 ? "s" : ""}.`
              : "No streak breaks across all habits."
          }
          tone={overallRecovery.breaks === 0 ? "good" : overallRecovery.avgDays <= 2 ? "warning" : "bad"}
        />
      </Stack>

      <Divider sx={{ mb: 4 }} />

      {/* Weekly Performance - all daily habits (hidden when no daily habits exist) */}
      {weeklyLineData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <SectionTitle>Weekly Performance</SectionTitle>
          <WeeklyLineChart data={weeklyLineData} />
        </Paper>
      )}

      <Divider sx={{ mb: 4 }} />

      {/* Habit selector */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Habit Analytics</Typography>
        <HabitHealthRow
          habits={habits}
          selectedId={selectedId || habit._id}
          onSelect={setSelectedId}
          now={now}
        />
      </Box>

      {/* Coach Insight */}
      <CoachInsightCard insight={insight} />

      {/* Streak status banner */}
      <Box sx={{ mb: 3 }}>
        {!checkedToday && habit.streak > 0 && (
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1,
            bgcolor: "#fffbeb", border: "1px solid #fbbf24",
            borderRadius: 2, px: 2, py: 1,
          }}>
            <WarningAmberIcon sx={{ color: colors.orange, fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: "#92400e" }}>
              Not checked in yet. Your {habit.streak}{streakUnit} streak is at risk.
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

      {/* Summary stat cards - flex wrap: 2 per row on mobile, all in one row on desktop */}
      <Box sx={{ mb: 4 }}>
        <SectionTitle>Summary · {habit.title}</SectionTitle>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
            sublabel={`${completed} / ${expected} ${rateUnit}`}
          />
          <StatCard
            label="This month"
            value={`${monthlyStats.thisMonthRate}%`}
            sublabel={monthlyStats.bestLabel
              ? `Best: ${monthlyStats.bestLabel} (${monthlyStats.bestRate}%)`
              : "No prior data"}
            color={monthlyStats.thisMonthRate >= 70 ? colors.green : colors.orange}
          />
          <StatCard
            label="This week"
            value={`${thisWeekRate}%`}
            sublabel={thisWeekSub}
            color={thisWeekRate >= 70 ? colors.green : thisWeekRate >= 40 ? colors.orange : "#e53e3e"}
          />
        </Box>
      </Box>

      {/* Calendar + By Weekday - side-by-side from sm (600px) upwards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <SectionTitle>Calendar</SectionTitle>
          <Heatmap
            cells={heatmap.cells}
            habitType={habit.habitType}
            fromCreation={heatmap.fromCreation}
            startDate={heatmap.startDate}
            completedCount={heatmap.completedCount}
            totalCount={heatmap.totalCount}
          />
        </Paper>

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
      </Box>
    </Box>
  )
}

export default Progress
