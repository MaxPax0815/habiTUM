// Sign up Hook

import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useSignup = () => {
  const [error, setError] = useState(null) // state to track any error messages during signup
  const [isLoading, setIsLoading] = useState(null) // state to track loading status during signup
  const { dispatch } = useAuthContext()

  // plan defaults to 'free'; pass 'premium' or 'manager' to trigger the Stripe checkout flow.
  // Returns the full response JSON on success (including checkoutUrl if a Stripe session was created),
  // or null on failure. Previously returned true — now returns the object so callers can check checkoutUrl.
  const signup = async (firstName, lastName, username, email, password, plan = 'free') => {
    setIsLoading(true)
    setError(null)

    const response = await fetch('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, username, email, password, plan })
    })
    const json = await response.json()

    if (!response.ok) {
      setIsLoading(false) // stop loading state if response is not ok
      setError(json.error) // set error state to the error message from the response
      return null
    }

    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(json))
      dispatch({ type: 'LOGIN', payload: json })
      setIsLoading(false)
      return json // return full data so callers can read checkoutUrl
    }
  }

  return { signup, isLoading, error }
}
