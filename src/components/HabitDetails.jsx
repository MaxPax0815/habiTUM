import { useAuthContext } from '../auth/useAuthContext'
import { useHabitsContext } from '../hooks/useHabitsContext'

// date-fns — used to decide whether this habit is already done for the current period
import isThisWeek from 'date-fns/isThisWeek'
import isToday from 'date-fns/isToday'

// MUI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { colors } from '../styles/tokens'

const HabitDetails = ({
  habit,
  actionsDisabled = false,
  showDelete = true,
  onHabitDeleted,
  onHabitUpdated,
}) => {
  const { habits, dispatch } = useHabitsContext()
  const { user } = useAuthContext()

  // break habits ("eliminate a negative pattern") get the orange accent from the mockups
  const isBreak = habit.habitType === 'break'

  // "done this period" = the last checkin falls in the current day (daily) or week (weekly)
  const done = !!habit.lastCheckin && (
    habit.frequency === 'weekly'
      ? isThisWeek(new Date(habit.lastCheckin), { weekStartsOn: 1 })
      : isToday(new Date(habit.lastCheckin))
  )

  // shared helper: POST to a habit sub-route, then swap the updated habit into context.
  // both /checkin and /undo respond with { message, habit }.
  const post = async (action) => {
    if (actionsDisabled || !user) return

    const response = await fetch(`/api/habits/${habit._id}/${action}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user.token}` } // include the JWT in the Authorization header so the backend knows which user is marking this habit done or undoing it
    })
    const json = await response.json()
    if (response.ok) {
      if (Array.isArray(habits)) {
        dispatch({ type: 'UPDATE_HABIT', payload: json.habit })
      }
      onHabitUpdated?.(json.habit)
    }
  }

  const handleMarkDone = () => post('checkin')
  const handleUndo     = () => post('undo')

  const handleDelete = async () => {
    if (actionsDisabled || !user) return

    const response = await fetch(`/api/habits/${habit._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.token}` } // include the JWT in the Authorization header so the backend knows which user is deleting this habit
    })
    const json = await response.json()
    if (response.ok) {
      if (Array.isArray(habits)) {
        dispatch({ type: 'DELETE_HABIT', payload: json })
      }
      onHabitDeleted?.(json)
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
        {/* circle that toggles done / not done */}
        <Checkbox
          checked={done}
          disabled={actionsDisabled}
          onChange={done ? handleUndo : handleMarkDone}
          icon={<span className="material-symbols-outlined">radio_button_unchecked</span>}
          checkedIcon={
            <span className="material-symbols-outlined" style={{ color: '#22c55e' }}>
              check_circle
            </span>
          }
        />

        {/* title + optional motivation + progress bar */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ textDecoration: done ? 'line-through' : 'none', fontWeight: 500 }}>
            {habit.title}
          </Typography>
          {habit.content && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {habit.content}
            </Typography>
          )}
          <LinearProgress
            variant="determinate"
            value={done ? 100 : 0}
            color={isBreak ? 'warning' : 'primary'}
            sx={{
              mt: 1, height: 6, borderRadius: 5,
              ...(isBreak && { '& .MuiLinearProgress-bar': { backgroundColor: colors.orange } }),
            }}
          />
        </Box>

        {/* streak chip — orange for break habits, otherwise blue once done this period */}
        <Chip
          color={!isBreak && done ? 'primary' : 'default'}
          icon={
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, ...(isBreak && { color: colors.orange }) }}
            >
              local_fire_department
            </span>
          }
          label={`${habit.streak}${habit.frequency === 'weekly' ? 'w' : 'd'}`}
          sx={isBreak ? { color: colors.orange, bgcolor: colors.softOrange, fontWeight: 700 } : undefined}
        />

        {/* mark done / undo — break habits use the orange "Still clean" action */}
        {isBreak
          ? (
            <Button
              variant="outlined"
              disabled={actionsDisabled}
              onClick={done ? handleUndo : handleMarkDone}
              sx={{
                color: colors.orange,
                borderColor: colors.orange,
                '&:hover': { borderColor: colors.orange, backgroundColor: colors.softOrange },
              }}
            >
              {done ? 'Undo' : 'Mark Done'}
            </Button>
          )
          : (done
            ? <Button variant="outlined" disabled={actionsDisabled} onClick={handleUndo}>Undo</Button>
            : <Button variant="contained" disabled={actionsDisabled} onClick={handleMarkDone}>Mark done</Button>)}

        {/* delete */}
        {showDelete && (
          <IconButton disabled={actionsDisabled} onClick={handleDelete} aria-label="delete">
            <span className="material-symbols-outlined">delete</span>
          </IconButton>
        )}

      </Stack>
    </Paper>
  )
}

export default HabitDetails
