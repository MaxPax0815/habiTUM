import { createContext, useReducer } from 'react'; //userReducer to manage context

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
    
    //useReducer hook manages state and dispatch function; initial state is user from localStorage or null
    const [state, dispatch] = useReducer(authReducer, {
    user: JSON.parse(localStorage.getItem('user')) || null
    })
    return (
        // value prop makes both `user` (via ...state) and `dispatch` available to all child components
        // spreading state gives access to state.user directly as just `user` in consuming components
        //{object}, ...state spreads the current state properties (like user) into the value object, dispatch is the function to update state 
        <AuthContext.Provider value={{ ...state, dispatch }}> 
            {children}
        </AuthContext.Provider>
    )
}