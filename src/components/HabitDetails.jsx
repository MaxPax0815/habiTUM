import { useHabitsContext } from '../hooks/useHabitsContext'

// date-fns — used to decide whether this habit is already done for the current period
import isToday from 'date-fns/isToday'
import isThisWeek from 'date-fns/isThisWeek'

// MUI
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'

const HabitDetails = ({ habit }) => {
  const { dispatch } = useHabitsContext()

  // "done this period" = the last checkin falls in the current day (daily) or week (weekly)
  const done = !!habit.lastCheckin && (
    habit.frequency === 'weekly'
      ? isThisWeek(new Date(habit.lastCheckin), { weekStartsOn: 1 })
      : isToday(new Date(habit.lastCheckin))
  )

  // shared helper: POST to a habit sub-route, then swap the updated habit into context.
  // both /checkin and /undo respond with { message, habit }.
  const post = async (action) => {
    const response = await fetch(`/api/habits/${habit._id}/${action}`, { method: 'POST' })
    const json = await response.json()
    if (response.ok) {
      dispatch({ type: 'UPDATE_HABIT', payload: json.habit })
    }
  }

  const handleMarkDone = () => post('checkin')
  const handleUndo     = () => post('undo')

  const handleDelete = async () => {
    const response = await fetch(`/api/habits/${habit._id}`, { method: 'DELETE' })
    const json = await response.json()
    if (response.ok) {
      dispatch({ type: 'DELETE_HABIT', payload: json })
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>

        {/* circle that toggles done / not done */}
        <Checkbox
          checked={done}
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
            sx={{ mt: 1, height: 6, borderRadius: 5 }}
          />
        </Box>

        {/* streak chip — turns blue once done this period */}
        <Chip
          color={done ? 'primary' : 'default'}
          icon={
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              local_fire_department
            </span>
          }
          label={`${habit.streak}d`}
        />

        {/* mark done / undo */}
        {done
          ? <Button variant="outlined" onClick={handleUndo}>Undo</Button>
          : <Button variant="contained" onClick={handleMarkDone}>Mark done</Button>}

        {/* delete */}
        <IconButton onClick={handleDelete} aria-label="delete">
          <span className="material-symbols-outlined">delete</span>
        </IconButton>

      </Stack>
    </Paper>
  )
}

export default HabitDetails
