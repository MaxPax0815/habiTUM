import { useState } from 'react'
import { useAuthContext } from '../auth/useAuthContext'

export const useBilling = () => {
  const { user, dispatch } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshCurrentUser = async () => {
    const response = await fetch('/api/user/me', {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    })

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
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
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
      const response = await fetch('/api/billing/confirm-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
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
      const response = await fetch('/api/billing/schedule-cancellation', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
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

  // Create the initial Stripe Checkout Session for a pending manager account.
  // numAdditional = additional communities beyond the 1 included in base (0–15).
  // Returns the Stripe checkout URL so the caller can redirect.
  const createManagerCheckoutSession = async (numAdditional) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/create-manager-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
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

  // Add or remove a community slot on the manager subscription.
  // delta = +1 to add, -1 to remove. Returns the updated { maxCommunities, activeCommunityCount }.
  const updateManagerCommunities = async (delta) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/update-manager-communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ delta })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not update community slots.')
      }

      // Merge updated fields (maxCommunities, activeCommunityCount) into context
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
