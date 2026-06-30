import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// custom hook that wraps useContext — components call useAuthContext() instead of useContext(AuthContext) directly
// this keeps context imports out of every component and gives a clear, reusable API
export const useAuthContext = () => {
    // useContext reads the current value from AuthContext (the value= prop set on the Provider in AuthContext.js)
    const context = useContext(AuthContext)

    // if context is undefined, the hook was called outside the AuthContextProvider — throw a clear error instead of a cryptic crash later
    if (!context) {
        throw Error('useAuthContext must be used inside a AuthContextProvider')
    }

    // returns {user, dispatch} — everything passed via value= on the Provider
    return context
}
