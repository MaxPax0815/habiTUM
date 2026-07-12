import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthContext } from '../auth/useAuthContext'
import { authFetch } from '../auth/authFetch'

// Active feed client: initial page, then 5s cursor polling instead of legacy SSE.
const POLL_INTERVAL_MS = 5000

// challengeId narrows both initial and update requests to one challenge feed.
export const useCommunityFeed = (communityId, { challengeId = null, enabled = true } = {}) => {
  const { user } = useAuthContext()
  const token = user?.token

  const [activities, setActivities] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // 'connecting' | 'live' | 'reconnecting'
  const [status, setStatus] = useState('connecting')

  // Cursor changes every poll but should not rerender; refs are mutable without state updates.
  const lastEventIdRef = useRef(null)

  // Per-community reset is handled by ActivityFeed key={communityId}, not internal state clearing.
  useEffect(() => {
    if (!communityId || !token || !enabled) return

    let stopped = false
    let pollTimer = null
    let activeController = null
    let inFlight = false

    // Store the newest server cursor for the next /updates request.
    const rememberCursor = (cursor) => {
      if (cursor) lastEventIdRef.current = cursor
    }

    // Conditional challenge query param keeps one hook working for full and mini feeds.
    const feedParams = (extraParams = {}) => {
      const params = new URLSearchParams(extraParams)
      if (challengeId) params.set('challenge', challengeId)
      const query = params.toString()
      return query ? `?${query}` : ''
    }

    // AbortController lets cleanup cancel in-flight fetches; authFetch handles
    // JWT + 401 logout (token then goes falsy and polling stops itself).
    const requestJson = async (url, fallbackMessage) => {
      const controller = new AbortController()
      activeController = controller
      const res = await authFetch(url, { token, signal: controller.signal })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || fallbackMessage)
      return json
    }

    // Apply server deltas: revoked removes, new prepends, same _id replaces.
    const mergeUpdates = (updates) => {
      if (!updates?.length) return

      setActivities((prev) => {
        let next = prev

        for (const activity of updates) {
          if (activity.revoked) {
            // Undo arrives as a revoked row; remove the existing card locally.
            next = next.filter((existing) => existing._id !== activity._id)
            continue
          }

          // isLive drives the one-time flash animation in ActivityItem.
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

    // setTimeout loop avoids overlapping intervals and can be skipped/cleared safely.
    const schedulePoll = () => {
      clearTimeout(pollTimer)
      if (!stopped) {
        pollTimer = setTimeout(pollUpdates, POLL_INTERVAL_MS)
      }
    }

    async function pollUpdates() {
      if (stopped) return
      if (document.hidden) {
        // Hidden tabs skip work; visibilitychange triggers immediate catch-up on return.
        schedulePoll()
        return
      }
      if (inFlight || !lastEventIdRef.current) {
        // No overlapping polls and no updates request before the first cursor exists.
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
        // Keep polling after success or transient failure.
        schedulePoll()
      }
    }

    // First page seeds the list, hasMore flag, and cursor before polling starts.
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

    // Returning to a visible tab should refresh immediately instead of waiting 5s.
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearTimeout(pollTimer)
        pollUpdates()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    loadInitial()

    return () => {
      // Stop timers/fetches and prevent async callbacks from updating an unmounted feed.
      stopped = true
      clearTimeout(pollTimer)
      activeController?.abort()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [communityId, challengeId, token, enabled])

  // Load older non-revoked rows using the oldest current _id as the "before" cursor.
  const loadMore = useCallback(async () => {
    const oldest = activities[activities.length - 1]
    if (!oldest) return
    try {
      const params = new URLSearchParams({ before: oldest._id })
      if (challengeId) params.set('challenge', challengeId)
      const res = await authFetch(
        `/api/communities/${communityId}/feed?${params}`,
        { token }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not load more activity.')
      setActivities((prev) => {
        // Dedupe by id in case a live update arrived while loading older rows.
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
