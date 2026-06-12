import { useEffect } from "react"
import { useAuthContext } from "../auth/useAuthContext"
import { useHabitsContext } from "../hooks/useHabitsContext"

// components
import HabitDetails from "../components/HabitDetails"
import HabitForm from "../components/HabitForm"

const Home = () => {
  const { habits, dispatch } = useHabitsContext()
  const { user } = useAuthContext() // get the current user from the auth context

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
  //dispatch updates the global habits state, which causes the component to re-render and show the latest habits.

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
