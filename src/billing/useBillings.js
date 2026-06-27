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

  return {
    startCheckout,
    scheduleCancellation,
    refreshCurrentUser,
    isLoading,
    error
  }
}