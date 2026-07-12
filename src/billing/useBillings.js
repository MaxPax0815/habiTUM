// Central billing hook: every Stripe client action (premium checkout, manager
// checkout, cancellation, slot changes) plus refreshing AuthContext afterwards.

import { useState } from 'react'
import { useAuthContext } from '../auth/useAuthContext'
// authFetch attaches the JWT and auto-logs-out on 401 (expired session)
import { authFetch } from '../auth/authFetch'

export const useBilling = () => {
  const { user, dispatch } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Re-fetch /me after Stripe changes so AuthContext has current subscription/limits.
  const refreshCurrentUser = async () => {
    const response = await authFetch('/api/user/me', { token: user.token })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Could not refresh user.')
    }

    dispatch({
      type: 'UPDATE_USER',
      payload: data
    })

    return data
  }

  const startCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authFetch('/api/billing/create-checkout-session', {
        method: 'POST',
        token: user.token
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not start checkout.')
      }

      window.location.href = data.url
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  const confirmCheckoutSession = async (sessionId) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authFetch('/api/billing/confirm-checkout-session', {
        method: 'POST',
        token: user.token,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not confirm checkout.')
      }

      dispatch({
        type: 'UPDATE_USER',
        payload: data
      })

      return data
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleCancellation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authFetch('/api/billing/schedule-cancellation', {
        method: 'POST',
        token: user.token
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not schedule cancellation.')
      }

      await refreshCurrentUser()
      setIsLoading(false)
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  // Pending-manager checkout: additional communities beyond base; returns Stripe URL.
  const createManagerCheckoutSession = async (numAdditional) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authFetch('/api/billing/create-manager-checkout', {
        method: 'POST',
        token: user.token,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numCommunities: numAdditional })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Could not start checkout.')

      return data.url
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Manager slot update: delta +1/-1, then merge returned limits into AuthContext.
  const updateManagerCommunities = async (delta) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authFetch('/api/billing/update-manager-communities', {
        method: 'POST',
        token: user.token,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not update community slots.')
      }

      dispatch({ type: 'UPDATE_USER', payload: data })
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    startCheckout,
    confirmCheckoutSession,
    scheduleCancellation,
    refreshCurrentUser,
    createManagerCheckoutSession,
    updateManagerCommunities,
    isLoading,
    error
  }
}
