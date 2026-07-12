// FRONTEND/src/hooks/useManagerOverview.js
// Fetch logic for the manager dashboard in one place, mirroring useCommunites.js.
// GET /api/manager/overview returns { pulse, kpis, communities } — see
// Backend/manager/managerController.js for how each number is computed.

import { useState, useCallback } from 'react'
import { useAuthContext } from '../auth/useAuthContext'

export const useManagerOverview = () => {
    const { user } = useAuthContext()

    // overview stays null until the first successful fetch, so the page can
    // distinguish "still loading" (null) from "loaded but empty" (communities: []).
    const [overview, setOverview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // All setState calls happen after the awaits (never synchronously), so this
    // is safe to call from the effect below without triggering cascading renders.
    const fetchOverview = useCallback(async () => {
        try {
            const response = await fetch('/api/manager/overview', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
            const json = await response.json()
            if (response.ok) {
                setOverview(json)
                setError(null)
            } else {
                setError(json.error)
            }
        } catch {
            setError('Could not reach the server.')
        }
        setLoading(false)
    }, [user])

    // The page calls fetchOverview() in a useEffect on mount, mirroring how
    // Communities.jsx uses fetchCommunities from useCommunites.js.
    return { overview, loading, error, fetchOverview }
}
