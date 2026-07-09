// FRONTEND/src/hooks/useManagerChallengeAdherence.js
// Fetch logic for one challenge's daily check-in adherence series.
// GET /api/manager/challenges/:id/adherence returns { challenge, adherence }
// — see Backend/manager/managerController.js (getManagerChallengeAdherence).
// The page re-runs fetchAdherence whenever the selected challenge changes.

import { useState, useCallback } from 'react'
import { useAuthContext } from '../auth/useAuthContext'

export const useManagerChallengeAdherence = (challengeId) => {
    const { user } = useAuthContext()

    const [adherence, setAdherence] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchAdherence = useCallback(async () => {
        if (!challengeId) return
        try {
            const response = await fetch(`/api/manager/challenges/${challengeId}/adherence`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
            const json = await response.json()
            if (response.ok) {
                setAdherence(json)
                setError(null)
            } else {
                setError(json.error)
            }
        } catch {
            setError('Could not reach the server.')
        }
        setLoading(false)
    }, [user, challengeId])

    return { adherence, loading, error, fetchAdherence }
}
