import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthContext } from '../auth/useAuthContext'

// Near-live community activity feed:
//   1. initial page via GET /api/communities/:id/feed
//   2. lightweight polling every 5s via /feed/updates?since=<feedCursor>
// Polling is intentionally simpler than SSE for the free MongoDB tier: no
// stream tickets, no persistent EventSource, and no MongoDB change stream.
const POLL_INTERVAL_MS = 5000

// Options: { challengeId } narrows the feed to one challenge (ChallengePage
// mini-feed). Both the initial fetch and polling update fetch filter server-side.
export const useCommunityFeed = (communityId, { challengeId = null, enabled = true } = {}) => {
  const { user } = useAuthContext()
  const token = user?.token

  const [activities, setActivities] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // 'connecting' | 'live' | 'reconnecting'
  const [status, setStatus] = useState('connecting')

  const lastEventIdRef = useRef(null)

  // NOTE: this hook holds per-community state and does not reset it when
  // communityId changes — the consumer remounts it instead (ActivityFeed is
  // rendered with key={communityId}), which resets state and refs for free.
  useEffect(() => {
    if (!communityId || !token || !enabled) return

    let stopped = false
    let pollTimer = null
    let activeController = null
    let inFlight = false

    const authHeader = { Authorization: `Bearer ${token}` }

    const rememberCursor = (cursor) => {
      if (cursor) lastEventIdRef.current = cursor
    }

    const feedParams = (extraParams = {}) => {
      const params = new URLSearchParams(extraParams)
      if (challengeId) params.set('challenge', challengeId)
      const query = params.toString()
      return query ? `?${query}` : ''
    }

    const requestJson = async (url, fallbackMessage) => {
      const controller = new AbortController()
      activeController = controller
      const res = await fetch(url, { headers: authHeader, signal: controller.signal })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || fallbackMessage)
      return json
    }

    const mergeUpdates = (updates) => {
      if (!updates?.length) return

      setActivities((prev) => {
        let next = prev

        for (const activity of updates) {
          if (activity.revoked) {
            next = next.filter((existing) => existing._id !== activity._id)
            continue
          }

          const liveActivity = { ...activity, isLive: true }
          const existingIndex = next.findIndex((existing) => existing._id === activity._id)
          if (existingIndex === -1) {
            next = [liveActivity, ...next]
          } else {
            next = next.map((existing) => (
              existing._id === activity._id ? liveActivity : existing
            ))
          }
        }

        return next
      })
    }

    const schedulePoll = () => {
      clearTimeout(pollTimer)
      if (!stopped) {
        pollTimer = setTimeout(pollUpdates, POLL_INTERVAL_MS)
      }
    }

    async function pollUpdates() {
      if (stopped) return
      if (document.hidden) {
        schedulePoll()
        return
      }
      if (inFlight || !lastEventIdRef.current) {
        schedulePoll()
        return
      }

      inFlight = true
      try {
        const json = await requestJson(
          `/api/communities/${communityId}/feed/updates${feedParams({ since: lastEventIdRef.current })}`,
          'Could not refresh the activity feed.'
        )
        if (stopped) return
        mergeUpdates(json.activities || [])
        rememberCursor(json.feedCursor)
        setStatus('live')
      } catch (err) {
        if (err.name !== 'AbortError') setStatus('reconnecting')
      } finally {
        inFlight = false
        schedulePoll()
      }
    }

    const loadInitial = async () => {
      inFlight = true
      try {
        setStatus('connecting')
        const json = await requestJson(
          `/api/communities/${communityId}/feed${feedParams()}`,
          'Could not load the activity feed.'
        )
        if (stopped) return
        setActivities(json.activities || [])
        setHasMore(json.hasMore)
        rememberCursor(json.feedCursor || json.activities?.[0]?.feedEventId || json.activities?.[0]?._id)
        setStatus('live')
        schedulePoll()
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
          setStatus('reconnecting')
        }
      } finally {
        inFlight = false
        if (!stopped) setLoading(false)
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearTimeout(pollTimer)
        pollUpdates()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    loadInitial()

    return () => {
      stopped = true
      clearTimeout(pollTimer)
      activeController?.abort()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [communityId, challengeId, token, enabled])

  const loadMore = useCallback(async () => {
    const oldest = activities[activities.length - 1]
    if (!oldest) return
    try {
      const params = new URLSearchParams({ before: oldest._id })
      if (challengeId) params.set('challenge', challengeId)
      const res = await fetch(
        `/api/communities/${communityId}/feed?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not load more activity.')
      setActivities((prev) => {
        const known = new Set(prev.map((activity) => activity._id))
        return [...prev, ...json.activities.filter((activity) => !known.has(activity._id))]
      })
      setHasMore(json.hasMore)
    } catch (err) {
      setError(err.message)
    }
  }, [activities, communityId, challengeId, token])

  return { activities, hasMore, loading, error, status, loadMore }
}
