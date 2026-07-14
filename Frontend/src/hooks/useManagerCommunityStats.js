// FRONTEND/src/hooks/useManagerCommunityStats.js
// Fetch logic for the manager's community detail page, mirroring useManagerOverview.
// GET /api/manager/communities/:id/stats returns { community, summary, challenges }
// — see Backend/manager/managerController.js (getManagerCommunityStats).

import { useState, useCallback } from 'react'
import { useAuthContext } from '../auth/useAuthContext'

export const useManagerCommunityStats = (communityId) => {
    const { user } = useAuthContext()

    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // All setState calls happen after the awaits (never synchronously), so this
    // is safe to call from the page's useEffect on mount.
    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch(`/api/manager/communities/${communityId}/stats`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
            const json = await response.json()
            if (response.ok) {
                setStats(json)
                setError(null)
            } else {
                setError(json.error)
            }
        } catch {
            setError('Could not reach the server.')
        }
        setLoading(false)
    }, [user, communityId])

    return { stats, loading, error, fetchStats }
}
