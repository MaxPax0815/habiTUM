import { useEffect } from "react"
import { useHabitsContext } from "../hooks/useHabitsContext"

// components
import HabitDetails from "../components/HabitDetails"
import HabitForm from "../components/HabitForm"

const Home = () => {
  const { habits, dispatch } = useHabitsContext()

  useEffect(() => {
    const fetchHabits = async () => {
      const response = await fetch('/api/habits')
      const json = await response.json()

      if (response.ok) {
        dispatch({type: 'SET_HABITS', payload: json})
      }
    }

    fetchHabits()
  }, [dispatch])

  return (
    <div className="home">
      <div className="habits">
        {habits && habits.map(habit => (
          <HabitDetails habit={habit} key={habit._id} />
        ))}
      </div>
      <HabitForm />
    </div>
  )
}

export default Home
