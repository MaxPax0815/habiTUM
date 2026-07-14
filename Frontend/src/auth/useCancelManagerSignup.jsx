import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from './useAuthContext'
import { useLogout } from './useLogout'

// Cancels manager_pending signup: backend deletes account, useLogout clears local state, then route home.
// Shared by Header, LandingPage and ConfigureManagerPlan so the abort flow stays identical.
export const useCancelManagerSignup = () => {
    const { user } = useAuthContext()
    const { logout } = useLogout()
    const navigate = useNavigate()

    const [isCancelling, setIsCancelling] = useState(false)
    const [error, setError] = useState(null)

    // Requires the pending user's JWT; backend rejects non-manager_pending accounts.
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
