import { useEffect, useState } from "react"
import { useAuthContext } from "../../auth/useAuthContext"
import { useHabitsContext } from "../../hooks/useHabitsContext"

// date-fns — some imports/helpers as in HabitDetails, plus format/getDay for the Header
import format from "date-fns/format"
import isThisWeek from "date-fns/isThisWeek"
import isToday from "date-fns/isToday"
import getDay from "date-fns/getDay"

// MUI
import { Box, Button, Paper, Stack, Typography } from "@mui/material"
import { colors } from "../../theme"

// components
import AppDialog from "../../components/AppDialog"
import HabitDetails from "../../components/HabitDetails"
import HabitForm from "../../components/HabitForm"

// Helpfunctions (outside of components since they don't need to access component state)

// Welcome message based on time of day
const greetingFor = (date) => {
  const h = date.getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

// a habit counts as "done" for its period — same logic as in HabitDetails
const isHabitDone = (habit) =>
  !!habit.lastCheckin &&
  (habit.frequency === "weekly"
    ? isThisWeek(new Date(habit.lastCheckin), { weekStartsOn: 1 })
    : isToday(new Date(habit.lastCheckin)))

// on how many different days this week (Mon–Sun) a habit has been checked in
const daysActiveThisWeek = (habits) => {
  const days = new Set()
  for (const habit of habits) {
    for (const checkin of habit.checkins || []) {
      const d = new Date(checkin.date)
      if (isThisWeek(d, { weekStartsOn: 1 })) days.add(getDay(d))
    }
  }
  return days.size
}

// reusable Stat-Karte
const StatCard = ({ icon, iconColor, label, value }) => (
  <Paper variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
    <Box
      sx={{
        width: 36, height: 36, borderRadius: 2,
        display: "grid", placeItems: "center",
        bgcolor: `${iconColor}1A`, color: iconColor, flexShrink: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
    </Box>
  </Paper>
)

// Main components
const Home = () => {
  const { habits, dispatch } = useHabitsContext()
  const { user } = useAuthContext() // get the current user from the auth context hook
  const [showForm, setShowForm] = useState(false)   // controls the create-habit popup


  useEffect(() => {
    const fetchHabits = async () => {
      const response = await fetch('/api/habits', {
        headers: {
          'Authorization': `Bearer ${user.token}` // include the JWT in the Authorization header
        }
      })
      const json = await response.json()

      if (response.ok) {
        dispatch({type: 'SET_HABITS', payload: json})
      }
    }
    if (user) fetchHabits() // only fetch habits if user is logged in (i.e. we have a valid token)

  }, [dispatch, user]) // re-run this effect whenever the user changes (e.g. log in or log out).
  // user addes as a dependency to ensure that if the user logs in or out, the habits will be fetched or cleared accordingly.
  //dispatch updates the global habits state, which causes the component to re-render and show the latest habits.


  // neu values for the header stats — these are derived from the habits, 
  // so we compute them here in the Home component and pass them down to the Header 
  // (or wherever they are needed). This way we avoid duplicating logic in multiple places.
  const now = new Date()
  const list = habits || []
  const total = list.length
  const done = list.filter(isHabitDone).length
  const remaining = total - done
  const bestStreak = list.reduce((m, h) => Math.max(m, h.streak || 0), 0)
  const weekDays = daysActiveThisWeek(list)

  // split habits into the two sections — build habits render on top, break habits below
  const buildHabits = list.filter(h => h.habitType === "build")
  const breakHabits = list.filter(h => h.habitType === "break")

  // Html structure: we show the stats in the header, then the list of habits, and the form to add new habits.
  
    return (
    <div className="home-page">
      {/* Date + Greeting */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {format(now, "EEEE, MMMM d")}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
          {greetingFor(now)}, {user?.firstName || "there"}.
        </Typography>
      </Box>

      {/* three Stat-Cards as template-stat-cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <StatCard
          icon="task_alt"
          iconColor={colors.primary}
          label="Today"
          value={total === 0 ? "No habits yet" : remaining === 0 ? "All done ✓" : `${remaining} remaining`}
        />
        <StatCard
          icon="local_fire_department"
          iconColor={colors.orange}
          label="Best streak"
          value={`${bestStreak} ${bestStreak === 1 ? "day" : "days"}`}
        />
        <StatCard
          icon="calendar_month"
          iconColor={colors.green}
          label="This week"
          value={`${weekDays}/7 days`}
        />
      </Stack>

      {/* main dashboard: habits on the left, Active Challenges reserved on the right */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 320px" }, // single column on mobile, sidebar on desktop
          gap: 4,
          alignItems: "start",
        }}
      >
        {/* LEFT: build habits, add button, then break habits */}
        <Box>
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", textAlign: "left" }}>
              Build habits
              </Typography>          {buildHabits.map(habit => (
            <HabitDetails habit={habit} key={habit._id} />
          ))}

          {/* grey "add" button under the habits -> opens the popup */}
          <Button
            fullWidth
            onClick={() => setShowForm(true)}
            sx={{
              mt: 1.5, mb: 4, py: 1.5,
              color: "text.secondary",
              bgcolor: "#f1f5f9",
              borderRadius: 2,
              textTransform: "none",
              "&:hover": { bgcolor: "#e2e8f0" },
            }}
          >
            + Add another habit
          </Button>

          {/* break habits -> heading + list only render when at least one exists */}
          {breakHabits.length > 0 && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", textAlign: "left" }}>
              Build habits
              </Typography>
              {breakHabits.map(habit => (
                <HabitDetails habit={habit} key={habit._id} />
              ))}
            </>
          )}
        </Box>

        {/* RIGHT: Active Challenges placeholder (real feature comes later) */}
        <Box>
          <Typography variant="overline" color="text.secondary">Active challenges</Typography>
          <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: colors.muted }}>
              emoji_events
            </span>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No active challenges yet.{" "}
              <Box component="a" href="#" sx={{ color: colors.primary, textDecoration: "none" }}>
                Join a community
              </Box>{" "}
              to get started.
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* create-habit popup — replaces the old right-side form column */}
      <AppDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="sm"
      >
        <HabitForm onClose={() => setShowForm(false)} />
      </AppDialog>
    </div>
  )
}

export default Home
