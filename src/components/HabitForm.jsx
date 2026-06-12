import { useState } from 'react'
import { useAuthContext } from '../auth/useAuthContext'
import { useHabitsContext } from '../hooks/useHabitsContext'

// MUI specific imports
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

// allowed categories — must match the enum in the backend habitModel.js
const CATEGORIES = ['Nutrition', 'Fitness', 'Learning', 'Wellness', 'Productivity', 'Other']

const HabitForm = () => {
  const { dispatch } = useHabitsContext()
  // get the current user from the auth context, so we can include their token in the API request to create a new habit
  const { user } = useAuthContext()
  // Step 1: set up state for all the form fields, plus error handling
  const [habitType, setHabitType] = useState('build') // default to 'build' since most habits are positive routines
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState('daily') // default to 'daily' since it's the most common frequency
  const [motivation, setMotivation] = useState('')
  const [error, setError] = useState(null)
  const [emptyFields, setEmptyFields] = useState([])

  // Step 2: handle form submission — POST the new habit to the backend
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) { // if there's no user, we can't create a habit, so show an error message
      setError('You must be logged in to create a habit')
      return
    }

    const habit = {title, frequency, motivation, habitType}

    const response = await fetch('/api/habits', {
      method: 'POST',
      body: JSON.stringify(habit),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}` // include the JWT in the Authorization header so the backend knows which user is creating this habit
      } //MongoDB stores the user id from the token in the habit's "user" field, so we can later query habits by user and show each user only their own habits on the frontend
    })
    const json = await response.json()
    
    if (!response.ok) {
      setError(json.error)
      setEmptyFields(json.emptyFields || [])
    }
    if (response.ok) {
      setEmptyFields([])
      setError(null)
      setTitle('')
      setFrequency('')
      setMotivation('')
      dispatch({type: 'CREATE_HABIT', payload: json})
    }

  }

  // Step 3: render the form with MUI components, showing error messages and highlighting empty fields
return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, maxWidth: 420 }}>
      <Stack spacing={2}>

        {/* STEP 2a toggle: habit type toggle */}
        <Typography variant="overline" color="text.secondary">Habit type</Typography>
        <ToggleButtonGroup
          value={habitType}
          exclusive
          onChange={(e, val) => val && setHabitType(val)}
          fullWidth
        >
          <ToggleButton value="build">↑ Build habit</ToggleButton>
          <ToggleButton value="break">↓ Break habit</ToggleButton>
        </ToggleButtonGroup>

        {/* STEP 3a textfield: habit name */}
        <TextField
          label="Habit name"
          placeholder="e.g. Run every morning"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={emptyFields.includes('title')}
          fullWidth
        />

        {/* STEP 3b textfield: motivation */}
        <TextField
          label="Goal or motivation (optional)"
          placeholder="Why does this habit matter to you?"
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          multiline
          minRows={2}
          fullWidth
        />

        {/* STEP 2b toggle: frequency toggle */}
        <Typography variant="overline" color="text.secondary">Frequency</Typography>
        <ToggleButtonGroup
          value={frequency}
          exclusive
          onChange={(e, val) => val && setFrequency(val)}
          fullWidth
        >
          <ToggleButton value="daily">Daily</ToggleButton>
          <ToggleButton value="weekly">Weekly</ToggleButton>
        </ToggleButtonGroup>

        {/* create / cancel */}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" fullWidth>Create Habit →</Button>
          <Button variant="outlined">Cancel</Button>
        </Stack>

        {error && <Typography color="error">{error}</Typography>}

      </Stack>
    </Paper>
  )
}


export default HabitForm
