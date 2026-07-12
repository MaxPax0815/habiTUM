import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useLogin = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(null)
    const { dispatch } = useAuthContext()

    // POST credentials, persist returned user/JWT, then dispatch LOGIN; returns true/false for the form.
    const login = async (email, password) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            // Read text first: proxy/server errors may return empty or non-JSON bodies.
            const body = await response.text()
            let json = null

            if (body) {
                try {
                    json = JSON.parse(body)
                } catch {
                    // Keep json null so status-specific fallback errors are shown.
                }
            }

            if (!response.ok) {
                const serverUnavailable = response.status >= 500
                setError(
                    json?.error || (serverUnavailable
                        ? 'The server is currently unavailable. Please try again shortly.'
                        : 'Login failed. Please check your details and try again.')
                )
                return false
            }

            if (!json) {
                setError('The server returned an invalid response. Please try again.')
                return false
            }

            // AuthContext change triggers App.jsx route redirects; no navigate() needed here.
            localStorage.setItem('user', JSON.stringify(json))
            dispatch({ type: 'LOGIN', payload: json })
            return true
        } catch {
            setError('Could not connect to the server. Please try again shortly.')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return { login, isLoading, error }
}
