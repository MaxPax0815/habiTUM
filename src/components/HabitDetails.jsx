import { useHabitsContext } from '../hooks/useHabitsContext'

// date fns
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const HabitDetails = ({ habit }) => {
  const { dispatch } = useHabitsContext()

  const handleClick = async () => {
    const response = await fetch('/api/habits/' + habit._id, {
      method: 'DELETE'
    })
    const json = await response.json()

    if (response.ok) {
      dispatch({type: 'DELETE_HABIT', payload: json})
    }
  }

  return (
    <div className="habit-details">
      <h4>{habit.title}</h4>
      <p><strong>Category: </strong>{habit.category}</p>
      <p><strong>Frequency: </strong>{habit.frequency}</p>
      {habit.kpi && <p><strong>KPI: </strong>{habit.kpi}</p>}
      <p>{formatDistanceToNow(new Date(habit.createdAt), { addSuffix: true })}</p>
      <span className="material-symbols-outlined" onClick={handleClick}>delete</span>
    </div>
  )
}

export default HabitDetails
