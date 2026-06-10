import { useState } from 'react'
import { useHabitsContext } from '../hooks/useHabitsContext'

// allowed categories — must match the enum in the backend habitModel.js
const CATEGORIES = ['Nutrition', 'Fitness', 'Learning', 'Wellness', 'Productivity', 'Custom']

const HabitForm = () => {
  const { dispatch } = useHabitsContext()

  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState('')
  const [kpi, setKpi] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState(null)
  const [emptyFields, setEmptyFields] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const habit = {title, frequency, kpi, category}

    const response = await fetch('/api/habits', {
      method: 'POST',
      body: JSON.stringify(habit),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const json = await response.json()

    if (!response.ok) {
      setError(json.error)
      setEmptyFields(json.emptyFields)
    }
    if (response.ok) {
      setEmptyFields([])
      setError(null)
      setTitle('')
      setFrequency('')
      setKpi('')
      setCategory('')
      dispatch({type: 'CREATE_HABIT', payload: json})
    }

  }

  return (
    <form className="create" onSubmit={handleSubmit}>
      <h3>Add a New Habit</h3>

      <label>Habit Title:</label>
      <input
        type="text"
        onChange={(e) => setTitle(e.target.value)}
        value={title}
        className={emptyFields.includes('title') ? 'error' : ''}
      />

      <label>Frequency:</label>
      <input
        type="text"
        placeholder="e.g. daily, 3x per week"
        onChange={(e) => setFrequency(e.target.value)}
        value={frequency}
        className={emptyFields.includes('frequency') ? 'error' : ''}
      />

      <label>KPI (optional):</label>
      <input
        type="text"
        placeholder="e.g. minutes, km, pages"
        onChange={(e) => setKpi(e.target.value)}
        value={kpi}
        className={emptyFields.includes('kpi') ? 'error' : ''}
      />

      <label>Category:</label>
      <select
        onChange={(e) => setCategory(e.target.value)}
        value={category}
        className={emptyFields.includes('category') ? 'error' : ''}
      >
        <option value="" disabled>Select a category</option>
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <button>Add Habit</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}

export default HabitForm
