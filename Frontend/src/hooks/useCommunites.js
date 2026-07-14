// FRONTEND/src/hooks/useCommunites.js fetch login in one file instead everywhere. 

import { useState, useCallback } from 'react';
import { useAuthContext } from '../auth/useAuthContext';

export const useCommunities = () => {
    const { user } = useAuthContext()
    const [communities, setCommunities] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const authHeader = {
        'Authorization': `Bearer ${user.token}`
    }

    const fetchCommunities = useCallback(async () => {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/communities', { headers: authHeader })
        const json = await response.json()
        setLoading(false)
        if (response.ok) setCommunities(json)
            else setError(json.error)
    }, [user])

   const joinCommunity = async (id) => {
        const res = await fetch(`/api/communities/${id}/join`, {
            method: 'POST', headers: authHeader
        })
        if (res.ok) await fetchCommunities()   // refresh so "Join" flips to "Joined"
        return res.ok
    }

    const createCommunity = async (data) => {
        const res = await fetch('/api/communities', {
            method: 'POST',
            headers: { ...authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        const json = await res.json()
        if (res.ok) await fetchCommunities()
        return { ok: res.ok, data: json }
    }

    return { communities, loading, error, fetchCommunities, joinCommunity, createCommunity }
}

