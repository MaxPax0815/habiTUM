import { useState } from 'react'
import { useAuthContext } from '../auth/useAuthContext'
import { useHabitsContext } from '../hooks/useHabitsContext'

// MUI specific imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import { colors } from '../styles/tokens'
import { sectionTitleSx } from '../styles/recipes'

// allowed categories — must match the enum in the backend habitModel.js
const CATEGORIES = ['Nutrition', 'Fitness', 'Learning', 'Wellness', 'Productivity', 'Other']

// Without props the form creates a personal habit (POST /api/habits) and pushes
// it into the HabitsContext. With a challengeId it creates a challenge habit
// (POST /api/challenges/:id/habits) instead and reports it via onHabitCreated —
// challenge habits belong to the challenge, not to the user's personal list.
const HabitForm = ({ onClose, challengeId, onHabitCreated }) => {
  const { dispatch } = useHabitsContext()
  // get the current user from the auth context, so we can include their token in the API request to create a new habit
  const { user } = useAuthContext()
  // Step 1: set up state for all the form fields, plus error handling
  const [habitType, setHabitType] = useState('build') // default to 'build' since most habits are positive routines
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState('daily') // default to 'daily' since it's the most common frequency
  const [motivation, setMotivation] = useState('')
  const [category, setCategory] = useState('') // mandatory — the user must pick one before submitting
  const [error, setError] = useState(null)
  const [emptyFields, setEmptyFields] = useState([])

  // Step 2: handle form submission — POST the new habit to the backend
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) { // if there's no user, we can't create a habit, so show an error message
      setError('You must be logged in to create a habit')
      return
    }

    if (!category) { // category is mandatory — stop early and highlight the field
      setError('Please choose a category')
      setEmptyFields(['category'])
      return
    }

    const habit = {title, frequency, motivation, habitType, category}

    const endpoint = challengeId ? `/api/challenges/${challengeId}/habits` : '/api/habits'
    const response = await fetch(endpoint, {
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
      setCategory('')
      if (challengeId) {
        onHabitCreated?.(json) // challenge habit — let the challenge page update its own list
      } else {
        dispatch({type: 'CREATE_HABIT', payload: json}) // personal habit — goes into the global habits context
      }
      onClose?.() // call the onClose callback to close the form after successful habit creation
    }

  }

  // Step 3: render the form with MUI components, showing error messages and highlighting empty fields
return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 1 }}>
      <Stack spacing={2}>

        {/* STEP 2a toggle: habit type toggle */}
        <Box>
          <Typography component="h2" sx={sectionTitleSx}>Habit type</Typography>
          <ToggleButtonGroup
            value={habitType}
            exclusive
            onChange={(e, val) => val && setHabitType(val)}
            fullWidth
          >
            <ToggleButton
              value="build"
              sx={{
                '&.Mui-selected': {
                  color: colors.primary,
                  backgroundColor: colors.softBlue,
                  borderColor: colors.primary,
                  '&:hover': { backgroundColor: colors.softBlue },
                },
              }}
            >
              ↑ Build habit
            </ToggleButton>
            <ToggleButton
              value="break"
              sx={{
                '&.Mui-selected': {
                  color: colors.orange,
                  backgroundColor: colors.softOrange,
                  borderColor: colors.orange,
                  '&:hover': { backgroundColor: colors.softOrange },
                },
              }}
            >
              ↓ Break habit
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

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

        {/* STEP 3c select: category (mandatory) */}
        <TextField
          select
          required
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          error={emptyFields.includes('category')}
          helperText={emptyFields.includes('category') ? 'Please choose a category' : ' '}
          fullWidth
        >
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>

        {/* STEP 2b toggle: frequency toggle */}
        <Box>
          <Typography component="h2" sx={sectionTitleSx}>Frequency</Typography>
          <ToggleButtonGroup
            value={frequency}
            exclusive
            onChange={(e, val) => val && setFrequency(val)}
            fullWidth
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* create / cancel */}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" fullWidth>Create Habit →</Button>
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
        </Stack>

        {error && <Typography color="error">{error}</Typography>}

      </Stack>
    </Box>
  )
}


export default HabitForm
