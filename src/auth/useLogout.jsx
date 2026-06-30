import { useHabitsContext } from "../hooks/useHabitsContext"
import { useAuthContext } from "./useAuthContext"

export const useLogout = () => {
    const { dispatch } = useAuthContext()
    const { dispatch: habitsDispatch } = useHabitsContext()

    const logout = () => {
        // remove user from local storage
        localStorage.removeItem('user')

        // update auth context to set user to null
        dispatch({ type: 'LOGOUT' })

        // update habits context to clear habits
        habitsDispatch({ type: 'SET_HABITS', payload: null })
    }

    return { logout }
}