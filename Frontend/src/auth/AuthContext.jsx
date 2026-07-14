import { createContext, useEffect, useReducer } from 'react';
import { registerUnauthorizedHandler } from './authFetch'

// Global auth state: holds the current user snapshot, persists it to
// localStorage, and reacts to 401s by logging out. Read via useAuthContext().
export const AuthContext = createContext()

export const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { user: action.payload }
        case 'LOGOUT':
            return { user: null }
        // Merge fresh billing/profile fields (e.g. after a checkout) onto the user.
        case 'UPDATE_USER':
            return {
                user: {
                    ...state.user,
                    ...action.payload
                }
            }
        default:
            return state
    }
}

export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(
        authReducer,
        undefined,
        // Restore the persisted user before the first render so guarded routes
        // don't briefly redirect a logged-in user to the public pages.
        () => {
            const storedUser = JSON.parse(localStorage.getItem('user'))
            return { user: storedUser || null }
        }
    )

    // Mirror auth state into localStorage so a refresh keeps the user signed in.
    useEffect(() => {
        if (state.user) {
            localStorage.setItem('user', JSON.stringify(state.user))
        } else {
            localStorage.removeItem('user')
        }
    }, [state.user])

    useEffect(() => {
        // authFetch invokes this on any 401 (expired/invalid token): log out so
        // App.jsx's route guards send the user back to the public pages.
        registerUnauthorizedHandler(() => {
            dispatch({ type: 'LOGOUT' })
        })
    }, [dispatch])

    return (
        <AuthContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AuthContext.Provider>
    )
}
