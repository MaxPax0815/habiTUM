import { useState } from 'react'

export const useResetPassword = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const resetPassword = async (token, password) => {
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        const response = await fetch(`/api/user/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        })
        const json = await response.json()

        setIsLoading(false)

        if (!response.ok) {
            setError(json.error)
            return false
        }

        setSuccess(true)
        return true
    }

    return { resetPassword, isLoading, error, success }
}
