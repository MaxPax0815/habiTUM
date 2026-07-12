import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// Safe auth accessor: returns { user, dispatch } and fails clearly outside the Provider.
export const useAuthContext = () => {
    const context = useContext(AuthContext)

    if (!context) {
        throw Error('useAuthContext must be used inside a AuthContextProvider')
    }

    return context
}
