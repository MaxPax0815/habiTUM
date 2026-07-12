import { useState } from 'react'

export const useForgotPassword = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    // Start demo reset; 200 without resetToken is a valid anti-enumeration response.
    const forgotPassword = async (email) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/user/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            })
            const json = await response.json().catch(() => ({}))

            if (!response.ok) {
                setError(json.error || 'Could not start password reset.')
                return null
            }

            return json
        } catch {
            setError('Could not reach the server. Please try again.')
            return null
        } finally {
            setIsLoading(false)
        }
    }

    return { forgotPassword, isLoading, error }
}
