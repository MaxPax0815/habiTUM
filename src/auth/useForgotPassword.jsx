import { useState } from 'react'

export const useForgotPassword = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const forgotPassword = async (email) => {
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        const response = await fetch('/api/user/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
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

    return { forgotPassword, isLoading, error, success }
}
