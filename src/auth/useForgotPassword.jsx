import { useState } from 'react'

export const useForgotPassword = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

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

            // Anti-enumeration contract with the backend: a 200 WITHOUT a
            // resetToken means "request accepted" (whether the account exists
            // is deliberately not revealed) — that is not an error. The page
            // decides: navigate on resetToken, neutral confirmation otherwise.
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
