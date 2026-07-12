import { createContext, useEffect, useReducer } from 'react'; // useReducer centralizes auth state updates

// Shared auth box; components read it through useAuthContext().
export const AuthContext = createContext()

// Reducer maps LOGIN/LOGOUT/UPDATE_USER actions to the next { user } state.
export const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN': // store full login/signup response as user snapshot
            return { user: action.payload }
        case 'LOGOUT': // clear session
            return { user: null }
        case 'UPDATE_USER': // shallow-merge fresh billing/profile fields into current user
            return {
                user: {
                    ...state.user,
                    ...action.payload
                }
            }
        default: //default case returns current state unchanged
            return state
    }
}

// Provider restores persisted auth once and exposes { user, dispatch } to children.
export const AuthContextProvider = ({ children }) => { // children are the components wrapped by this provider
    const [state, dispatch] = useReducer(
        authReducer,
        undefined,
        // Lazy init runs before first render, preventing a false logged-out redirect flash.
        () => {
            const storedUser = JSON.parse(localStorage.getItem('user'))
            return { user: storedUser || null }
        }
    )

    useEffect(() => {
        // Keep localStorage in sync with state; [state.user] reruns only when user changes.
        if (state.user) {
            localStorage.setItem('user', JSON.stringify(state.user))
        } else {
            localStorage.removeItem('user')
        }
    }, [state.user])

    console.log('AuthContext state:', state) //debugging log to see current auth state

    return (
        // Spread exposes user directly; dispatch lets hooks/pages trigger reducer actions.
        <AuthContext.Provider value={{ ...state, dispatch }}> 
            {children}
        </AuthContext.Provider>
    )
}
