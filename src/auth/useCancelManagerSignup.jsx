import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from './useAuthContext'
import { useLogout } from './useLogout'

// Cancels an unfinished manager signup from anywhere in the app:
//   1. asks the backend to hard-delete the pending manager account
//   2. logs out locally (clears localStorage + AuthContext + habits, via useLogout)
//   3. returns to the public landing page
// Used by Header, LandingPage and ConfigureManagerPlan so the flow stays identical.
export const useCancelManagerSignup = () => {
    const { user } = useAuthContext()
    const { logout } = useLogout()
    const navigate = useNavigate()

    const [isCancelling, setIsCancelling] = useState(false)
    const [error, setError] = useState(null)

    const cancelManagerSignup = async () => {
        setIsCancelling(true)
        setError(null)

        try {
            const response = await fetch('/api/user/pending-manager', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Could not cancel the manager signup.')
            }

            // Backend account is gone — clear the local session and go home.
            logout()
            navigate('/', { replace: true })
            return true
        } catch (err) {
            setError(err.message)
            return false
        } finally {
            setIsCancelling(false)
        }
    }

    return { cancelManagerSignup, isCancelling, error }
}
