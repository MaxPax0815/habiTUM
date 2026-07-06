import { useState } from 'react'

export const useResetPassword = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const resetPassword = async (token, password) => {
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const response = await fetch(`/api/user/reset-password/${encodeURIComponent(token)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })
            const json = await response.json().catch(() => ({}))

            if (!response.ok) {
                setError(json.error || 'Could not reset the password.')
                return false
            }

            setSuccess(true)
            return true
        } catch {
            setError('Could not reach the server. Please try again.')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return { resetPassword, isLoading, error, success }
}
