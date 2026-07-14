import { useHabitsContext } from "../hooks/useHabitsContext"
import { useAuthContext } from "./useAuthContext"

export const useLogout = () => {
    const { dispatch } = useAuthContext()
    const { dispatch: habitsDispatch } = useHabitsContext() // rename to avoid two dispatch variables

    // Clear persisted auth, AuthContext, and cached habits so the next user sees no old data.
    const logout = () => {
        localStorage.removeItem('user')
        dispatch({ type: 'LOGOUT' })
        habitsDispatch({ type: 'SET_HABITS', payload: null })
    }

    return { logout }
}
