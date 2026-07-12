import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

// Signup hook: creates free/premium/manager accounts and stores the returned user/JWT.
export const useSignup = () => {
  const [error, setError] = useState(null) // state to track any error messages during signup
  const [isLoading, setIsLoading] = useState(null) // state to track loading status during signup
  const { dispatch } = useAuthContext()

  // plan defaults to free; success returns full JSON so callers can use checkoutUrl.
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
      setIsLoading(false)
      setError(json.error)
      return null
    }

    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(json))
      dispatch({ type: 'LOGIN', payload: json })
      setIsLoading(false)
      return json
    }
  }

  return { signup, isLoading, error }
}
