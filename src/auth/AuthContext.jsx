import { createContext, useEffect, useReducer } from 'react'; //userReducer to manage context

// createContext() creates the context object; components access its value with useContext(AuthContext)
export const AuthContext = createContext()

//reducer function to manage state changes based on action types
//functionaility: takes current state and an action, returns new state based on action type
export const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN': //on login, set user to payload (user data)
            return { user: action.payload }
        case 'LOGOUT': //on logout, set user back to null
            return { user: null }
        default: //default case returns current state unchanged
            return state
    }
}

// AuthContextProvider is a wrapper component; any component inside it can read auth state and call dispatch
export const AuthContextProvider = ({ children }) => { //children is the nested components inside this provider
    const [state, dispatch] = useReducer(authReducer, { //useReducer to manage state; authReducer defines how state changes; initial state is {user: null}
        user: null
    })

    useEffect(() => {
        // check for user in localStorage when app loads, if not then user is null.
        const user = JSON.parse(localStorage.getItem('user'))
        if (user) {
            //if user data exists, dispatch LOGIN action to set user in state.
            dispatch({ type: 'LOGIN', payload: user })
        }
    }, [])
    console.log('AuthContext state:', state) //debugging log to see current auth state

    return (
        // value prop makes both `user` (via ...state) and `dispatch` available to all child components
        // spreading state gives access to state.user directly as just `user` in consuming components
        //{object}, ...state spreads the current state properties (like user) into the value object, dispatch is the function to update state 
        <AuthContext.Provider value={{ ...state, dispatch }}> 
            {children}
        </AuthContext.Provider>
    )
}