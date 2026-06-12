// Sign up Hook

import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useSignup = () => {
  const [error, setError] = useState(null) // state to track any error messages during signup
  const [isLoading, setIsLoading] = useState(null) // state to track loading status during signup
  const { dispatch } = useAuthContext()

  // async function to handle user signup; takes email and password as parameters
  const signup = async (email, password) => {
    setIsLoading(true)
    setError(null)

    const response = await fetch('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const json = await response.json()

    if (!response.ok) {
      setIsLoading(false) // stop loading state if response is not ok
      setError(json.error) // set error state to the error message from the response
    }

    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(json))
      dispatch({ type: 'LOGIN', payload: json })
      setIsLoading(false)
      return true
    }
  }

  return { signup, isLoading, error }
}