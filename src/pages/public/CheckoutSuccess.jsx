import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, CircularProgress, Container, Typography } from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'

import { useAuthContext } from '../../auth/useAuthContext'
import { colors } from '../../styles/tokens'

// Stripe redirects here after a successful checkout.
// We verify the session with the backend (not just trust the redirect URL),
// update the user context, then navigate to the appropriate dashboard.
export default function CheckoutSuccess() {
    const { user, dispatch } = useAuthContext()
    const navigate = useNavigate()

    const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('')
    const confirmed = useRef(false) // guard against double-fire in React Strict Mode

    useEffect(() => {
        if (confirmed.current) return
        confirmed.current = true

        const params = new URLSearchParams(window.location.search)
        const sessionId = params.get('session_id')

        if (!sessionId) {
            setStatus('error')
            setErrorMessage('No checkout session ID found in the URL.')
            return
        }

        if (!user?.token) {
            // User lost their session — send them to login
            navigate('/login', { replace: true })
            return
        }

        const verifyAndActivate = async () => {
            try {
                const response = await fetch('/api/billing/confirm-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                    body: JSON.stringify({ sessionId }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Could not confirm payment.')
                }

                // Merge updated subscription/accountType into the stored user
                dispatch({ type: 'UPDATE_USER', payload: data })
                setStatus('success')

                // Short pause so the user can read the success message before redirecting
                setTimeout(() => {
                    if (data.accountType === 'manager') {
                        navigate('/manager', { replace: true })
                    } else {
                        navigate('/today', { replace: true })
                    }
                }, 1800)
            } catch (err) {
                setStatus('error')
                setErrorMessage(err.message)
            }
        }

        verifyAndActivate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
            {status === 'loading' && (
                <Box>
                    <CircularProgress sx={{ mb: 3, color: colors.primary }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Activating your account…
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                        We're confirming your payment with Stripe. This takes just a moment.
                    </Typography>
                </Box>
            )}

            {status === 'success' && (
                <Box>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 72, color: colors.green, mb: 2 }} />
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                        You're all set!
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                        Your subscription is active. Redirecting you to your dashboard…
                    </Typography>
                </Box>
            )}

            {status === 'error' && (
                <Box>
                    <ErrorOutlinedIcon sx={{ fontSize: 72, color: 'error.main', mb: 2 }} />
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                        Something went wrong
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                        {errorMessage}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/profile')}>
                        Go to Profile
                    </Button>
                </Box>
            )}
        </Container>
    )
}
