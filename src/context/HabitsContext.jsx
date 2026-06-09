import { createContext, useReducer } from 'react'

export const HabitsContext = createContext()

export const habitsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_HABITS':
      return {
        habits: action.payload
      }
    case 'CREATE_HABIT':
      return {
        habits: [action.payload, ...state.habits]
      }
    case 'DELETE_HABIT':
      return {
        habits: state.habits.filter(h => h._id !== action.payload._id)
      }
    default:
      return state
  }
}

export const HabitsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(habitsReducer, {
    habits: null
  })

  return (
    <HabitsContext.Provider value={{ ...state, dispatch }}>
      { children }
    </HabitsContext.Provider>
  )
}
