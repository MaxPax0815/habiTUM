import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthContext } from '../auth/useAuthContext'

// Live community activity feed:
//   1. initial page via GET /api/communities/:id/feed (normal Bearer fetch)
//   2. live updates via SSE — but EventSource cannot send an Authorization
//      header, so we first exchange the JWT for a 30s single-use ticket
//      (POST /api/feed/ticket) and open the stream with ?ticket=...
//
// Reconnection: the browser's built-in EventSource retry is useless to us
// because the ticket dies on first use — a reconnect with the same URL is
// always 401. So on error we close the source, fetch a FRESH ticket, and
// reopen with ?lastEventId=<newest seen id> (exponential backoff, capped),
// which the server uses to replay anything we missed while disconnected.
// Live items are deduped by _id because a replay can overlap the initial fetch.
const MAX_BACKOFF_MS = 15000
const INITIAL_BACKOFF_MS = 1000

// Options: { challengeId } narrows the feed to one challenge (ChallengePage
// mini-feed). The REST fetch filters server-side; live events arrive for the
// whole community (one shared stream) and are filtered client-side.
export const useCommunityFeed = (communityId, { challengeId = null, enabled = true } = {}) => {
  const { user } = useAuthContext()
  const token = user?.token

  const [activities, setActivities] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // 'connecting' | 'live' | 'reconnecting'
  const [status, setStatus] = useState('connecting')

  const sourceRef = useRef(null)
  const retryTimerRef = useRef(null)
  const backoffRef = useRef(INITIAL_BACKOFF_MS)
  const stoppedRef = useRef(false)
  const lastEventIdRef = useRef(null)

  // NOTE: this hook holds per-community state and does not reset it when
  // communityId changes — the consumer remounts it instead (ActivityFeed is
  // rendered with key={communityId}), which resets state and refs for free.
  useEffect(() => {
    if (!communityId || !token || !enabled) return

    stoppedRef.current = false
    backoffRef.current = INITIAL_BACKOFF_MS

    const authHeader = { Authorization: `Bearer ${token}` }

    const rememberCursor = (cursor) => {
      if (cursor) lastEventIdRef.current = cursor
    }

    const prependLive = (activity, eventCursor) => {
      // Remember every seen id (drives reconnect catch-up) but only display
      // activities matching this feed's scope.
      rememberCursor(eventCursor || activity.feedEventId || activity._id)
      if (challengeId && activity.challenge !== challengeId) return
      setActivities((prev) => (
        prev.some((existing) => existing._id === activity._id)
          ? prev
          : [{ ...activity, isLive: true }, ...prev]
      ))
    }

    const connectStream = async () => {
      if (stoppedRef.current) return
      try {
        const ticketRes = await fetch('/api/feed/ticket', { method: 'POST', headers: authHeader })
        if (!ticketRes.ok) throw new Error('ticket request failed')
        const { ticket } = await ticketRes.json()
        if (stoppedRef.current) return

        const params = new URLSearchParams({ ticket })
        if (lastEventIdRef.current) params.set('lastEventId', lastEventIdRef.current)
        const source = new EventSource(`/api/communities/${communityId}/feed/stream?${params}`)
        sourceRef.current = source

        source.onopen = () => {
          backoffRef.current = INITIAL_BACKOFF_MS
          setStatus('live')
        }
        source.addEventListener('activity', (event) => {
          prependLive(JSON.parse(event.data), event.lastEventId)
        })
        source.addEventListener('activity_removed', (event) => {
          const { activityId } = JSON.parse(event.data)
          rememberCursor(event.lastEventId)
          setActivities((prev) => prev.filter((activity) => activity._id !== activityId))
        })
        source.onerror = () => {
          source.close()
          scheduleReconnect()
        }
      } catch {
        scheduleReconnect()
      }
    }

    const scheduleReconnect = () => {
      if (stoppedRef.current) return
      setStatus('reconnecting')
      retryTimerRef.current = setTimeout(connectStream, backoffRef.current)
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS)
    }

    const loadInitial = async () => {
      try {
        const params = challengeId ? `?challenge=${challengeId}` : ''
        const res = await fetch(`/api/communities/${communityId}/feed${params}`, { headers: authHeader })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Could not load the activity feed.')
        setActivities(json.activities || [])
        setHasMore(json.hasMore)
        rememberCursor(json.feedCursor || json.activities?.[0]?.feedEventId || json.activities?.[0]?._id)
        connectStream()
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadInitial()

    return () => {
      stoppedRef.current = true
      clearTimeout(retryTimerRef.current)
      sourceRef.current?.close()
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
