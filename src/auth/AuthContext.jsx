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
        case 'UPDATE_USER': //on changing the account type (e.g. by adding or canceling a subscription) update user
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

// AuthContextProvider is a wrapper component; any component inside it can read auth state and call dispatch
export const AuthContextProvider = ({ children }) => { //children is the nested components inside this provider
    const [state, dispatch] = useReducer( // useReducer hat drei input paramter: reduce; initialValue; InitializerFunction
        authReducer,  //useReducer to manage state; authReducer defines how state changes
        undefined, // initial value is undefined und wird durch die Lazy initalizer function definiert
        // Lazy initializer function: wird beim starten der App ausgeführt
        // Vorteil: wenn der User in der DB bereits existiert, wird state.user direkt beim ersten rendern gesetzt 
        //  -> das verhindert, dass der user bereits eingeloggt ist, ohne das user.state gesetzt, worduch der user ggf. wieder zu /login anstatt zu /today redirected wird
        //     da user.state sonst erst bei useEffect() gesetzt wird
        // check for user in localStorage when app loads, if not then user is null.
        () => {
            const storedUser = JSON.parse(localStorage.getItem('user'))
            return { user: storedUser || null }
        }
    )

    useEffect(() => {
        // hier state.user nutzen anstatt user nach änderung von state.user wieder aus der DB auszulesen, um zu verhindern, dass potentielle
        // Änderungen im aktuellen state dorch den alten state aus der DB überschrieben werden. 
        if (state.user) {
            localStorage.setItem('user', JSON.stringify(state.user))
        } else {
            localStorage.removeItem('user')
        }
    }, [state.user]) // [state.user] ist ein dependency array und stellt sicher, dass useEffect immer dann läuft, wenn state.user sich ändert (nicht nur beim ersten render [], oder bei jedem render)

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