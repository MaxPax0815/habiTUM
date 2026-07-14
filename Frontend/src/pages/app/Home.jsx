import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "../../auth/useAuthContext"
import { authFetch } from "../../auth/authFetch"
import { useHabitsContext } from "../../hooks/useHabitsContext"

// date-fns — some imports/helpers as in HabitDetails, plus format/getDay for the Header
import format from "date-fns/format"
import isThisWeek from "date-fns/isThisWeek"
import isToday from "date-fns/isToday"
import getDay from "date-fns/getDay"

// MUI
import { Box, Button, Menu, MenuItem, Paper, Typography } from "@mui/material"
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined"
import { colors } from '../../styles/tokens'
import { sectionTitleSx } from '../../styles/recipes'

// components
import AppDialog from "../../components/AppDialog"
import HabitDetails from "../../components/HabitDetails"
import HabitForm from "../../components/HabitForm"
import PageHeader from "../../components/layout/PageHeader"

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

const CATEGORIES = ['Nutrition', 'Fitness', 'Learning', 'Wellness', 'Productivity', 'Other']

const EmptyHabitsCard = ({ onCreateHabit }) => (
  <Paper
    variant="outlined"
    sx={{
      minHeight: 172,
      p: 3,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    }}
  >
    <Typography sx={{ fontSize: 34, lineHeight: 1, mb: 1.5 }}>
      🌱
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
      No habits yet
    </Typography>
    <Typography sx={{ color: "text.secondary", mb: 2.5, maxWidth: 380 }}>
      Start building or breaking your first habit.
    </Typography>
    <Button
      variant="contained"
      size="large"
      onClick={onCreateHabit}
      startIcon={<span className="material-symbols-outlined">add</span>}
    >
      Add Your First Habit
    </Button>
  </Paper>
)

// Main components
const Home = () => {
  const { habits, dispatch } = useHabitsContext()
  const { user } = useAuthContext() // get the current user from the auth context hook
  const [showForm, setShowForm] = useState(false)   // controls the create-habit popup
  const [activeChallenges, setActiveChallenges] = useState([]) // joined + running challenges for the sidebar panel
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const navigate = useNavigate()


  useEffect(() => {
    const fetchHabits = async () => {
      // authFetch attaches the JWT and auto-logs-out on 401 (expired session)
      const response = await authFetch('/api/habits', { token: user.token })
      const json = await response.json()

      if (response.ok) {
        dispatch({type: 'SET_HABITS', payload: json})
      }
    }

    // fills the "Active challenges" sidebar: challenges this user joined that
    // are currently running (the backend filters to status 'active')
    const fetchActiveChallenges = async () => {
      const response = await authFetch('/api/challenges/joined', { token: user.token })
      const json = await response.json()

      if (response.ok) {
        setActiveChallenges(json)
      }
    }

    if (user) {
      fetchHabits() // only fetch if user is logged in (i.e. we have a valid token)
      fetchActiveChallenges()
    }

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
  const visibleHabits = categoryFilter === 'all'
    ? list
    : list.filter(h => h.category === categoryFilter)

  // split habits into the two sections — build habits render on top, break habits below
  const buildHabits = visibleHabits.filter(h => h.habitType === "build")
  const breakHabits = visibleHabits.filter(h => h.habitType === "break")
  const hasVisibleHabits = visibleHabits.length > 0
  const isFilterOpen = Boolean(filterAnchorEl)

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
  }

  const handleSelectCategory = (category) => {
    setCategoryFilter(category)
    handleFilterClose()
  }

  // Html structure: we show the stats in the header, then the list of habits, and the form to add new habits.
  
    return (
    <Box>
      <PageHeader
        eyebrow={format(now, "EEEE, MMMM d")}
        title={`${greetingFor(now)}, ${user?.firstName || "there"}.`}
      />

      {/* three Stat-Cards — laid out on the same 3-column grid as the dashboard below
          so the habit list lines up under the first two cards and the sidebar under the third */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
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
      </Box>

      {/* main dashboard: shares the same 3-column grid + gap as the stat cards above,
          so the habit list spans the first two columns and the sidebar the third */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* LEFT: build habits, then break habits, then add button — spans the two left columns */}
        <Box sx={{ gridColumn: { md: "span 2" } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mb: 2,
            }}
          >
            <Typography component="h2" sx={{ ...sectionTitleSx, mb: 0 }}>
              Build habits
            </Typography>

            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListOutlinedIcon />}
              onClick={handleFilterClick}
              disabled={total === 0}
              sx={{ flexShrink: 0, fontWeight: 800 }}
            >
              {categoryFilter === 'all' ? 'Filter' : categoryFilter}
            </Button>
            <Menu
              anchorEl={filterAnchorEl}
              open={isFilterOpen}
              onClose={handleFilterClose}
            >
              <MenuItem selected={categoryFilter === 'all'} onClick={() => handleSelectCategory('all')}>
                All categories
              </MenuItem>
              {CATEGORIES.map((category) => (
                <MenuItem
                  key={category}
                  selected={categoryFilter === category}
                  onClick={() => handleSelectCategory(category)}
                >
                  {category}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {total === 0 ? (
            <EmptyHabitsCard onCreateHabit={() => setShowForm(true)} />
          ) : (
            <>
              {!hasVisibleHabits && (
                <Paper variant="outlined" sx={{ p: 3, textAlign: "center", mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                    No habits in this category
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Choose another category or add a new habit.
                  </Typography>
                </Paper>
              )}

              {buildHabits.map(habit => (
                <HabitDetails habit={habit} key={habit._id} />
              ))}

              {/* break habits -> heading + list only render when at least one exists */}
              {breakHabits.length > 0 && (
                <>
                  <Box sx={{ mt: 3 }}>
                    <Typography component="h2" sx={sectionTitleSx}>Break habits</Typography>
                  </Box>
                  {breakHabits.map(habit => (
                    <HabitDetails habit={habit} key={habit._id} />
                  ))}
                </>
              )}

              {/* grey "add" button under both lists -> opens the popup */}
              <Button
                fullWidth
                onClick={() => setShowForm(true)}
                startIcon={<span className="material-symbols-outlined">add</span>}
                sx={{
                  mt: 1.5, mb: 4, py: 1.5,
                  color: "text.secondary",
                  bgcolor: colors.softNeutral,
                  "&:hover": { bgcolor: colors.progressTrack },
                }}
              >
                Add Another Habit
              </Button>
            </>
          )}
        </Box>

        {/* RIGHT: the user's active challenges — one card per joined challenge
            that is currently running; clicking opens the challenge page */}
        <Box>
          <Box
            sx={{
              minHeight: 40,
              display: "flex",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography component="h2" sx={{ ...sectionTitleSx, mb: 0 }}>
              Active challenges
            </Typography>
          </Box>

          {activeChallenges.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                minHeight: 172,
                p: 3,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: colors.muted }}>
                emoji_events
              </span>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No active challenges yet.{" "}
                <Box
                  component="a"
                  onClick={() => navigate("/communities")}
                  sx={{ color: colors.primary, textDecoration: "none", cursor: "pointer" }}
                >
                  Join a community
                </Box>{" "}
                to get started.
              </Typography>
            </Paper>
          ) : (
            activeChallenges.map(challenge => {
              // whole days until the challenge ends (never negative — the
              // backend only returns challenges that are still active)
              const daysLeft = Math.max(0, Math.ceil((new Date(challenge.ends) - now) / 86400000))

              return (
                <Paper
                  key={challenge._id}
                  onClick={() => navigate(`/challenges/${challenge._id}`)}
                  sx={{
                    p: 2, mb: 1.5, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 1.5,
                    transition: "all 0.15s",
                    "&:hover": { borderColor: colors.primary, bgcolor: colors.softBlue },
                  }}
                >
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                      display: "grid", placeItems: "center",
                      bgcolor: colors.softOrange, color: colors.orange,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>emoji_events</span>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                      {challenge.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                      {challenge.community?.name || "Community"} · {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                    </Typography>
                  </Box>
                </Paper>
              )
            })
          )}
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
    </Box>
  )
}

export default Home
