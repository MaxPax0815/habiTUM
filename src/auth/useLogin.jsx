import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useLogin = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(null)
    const { dispatch } = useAuthContext()

    const login = async (email, password) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            // Proxy errors (for example when the backend on port 4000 is down)
            // can have an empty, non-JSON response body. Parsing those responses
            // with response.json() hides the real problem behind a SyntaxError.
            const body = await response.text()
            let json = null

            if (body) {
                try {
                    json = JSON.parse(body)
                } catch {
                    // The status-specific message below is more useful than a
                    // JSON parsing error for HTML/plain-text proxy responses.
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

