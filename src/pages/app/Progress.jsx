import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

import { useAuthContext } from '../../auth/useAuthContext'

import { pillButtonSx } from '../../styles/buttonSx'

const Progress = () => {
  const { user, dispatch } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const isPremium = user?.subscription === 'premium'

  const handleUpgradeClick = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not start checkout.')
      }

      window.location.href = data.url
    } catch (error) {
        setError(error.message)
        setIsLoading(false)
    }
  }

  useEffect(() => {
    const refreshUserAfterCheckout = async () => {
      const params = new URLSearchParams(window.location.search) // URL see stripeController
      const checkoutStatus = params.get('checkout') 

      // If stripe chekcout wasn't successful simply 
      // or user token is null oder undefined return to the progress page
      if (checkoutStatus !== 'success' || !user?.token) {
        return 
      }

      // fetch the current user form the DB
      // Backend: 
        // Request comes in
        // -> requireAuth checks the JWT Token
        // -> requireAuth requests req.user based on the user._id 
        // -> based on the req.user._id getMe fetches the user
        // -> getMe returns user data 
      try {
        const response = await fetch('/api/user/me', {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        })

        const data = await response.json() // data = user which getMe returns

        if (!response.ok) {
          throw new Error(data.error || 'Could not refresh user.')
        }

        // dispatch calls the reducer function inside AuthContext.jsx
        // overrides user.state with the newly fetched data from the DB
        // local storage is then automatically updated through useEffect() inside AuthContext
        dispatch({
          type: 'UPDATE_USER',
          payload: data
        }) 

        window.history.replaceState({}, '', '/progress')
      } catch (error) {
        console.log(error.message)
      }
    }

    refreshUserAfterCheckout()
  }, [user?.token, dispatch])

  if (!isPremium) {
    return(
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Progress
        </Typography>

        <Card sx={{ maxWidth: 560, borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LockOutlinedIcon color="primary" />

              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Advanced analytics are Premium
              </Typography>
            </Box>

            <Typography sx={{ mb: 3, color: 'text.secondary' }}>
              Upgrade to habiTUM Premium to unlock detailed progress analytics for your habits.
            </Typography>

            <Typography sx={{ mb: 3, fontWeight: 600 }}>
              3,99 € / month
            </Typography>

            <Button
              variant="contained"
              onClick={handleUpgradeClick}
              disabled={isLoading}
              sx={{ ...pillButtonSx, }}
            >
              {isLoading ? 'Redirecting...' : 'Upgrade to Premium'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Progress
      </Typography>

      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        Your advanced habit analytics will appear here.
      </Typography>

      {/* Later: real analytics components go here */}
    </Box>
  )
}

export default Progress
