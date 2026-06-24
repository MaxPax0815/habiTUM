import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

import { useAuthContext } from '../../auth/useAuthContext'

import { pillButtonSx } from '../../styles/buttonSx'

const Progress = () => {
  const { user } = useAuthContext()

  const isPremium = user?.subscription === 'premium'

  const handleUpgradeClick = () => {
    // This will be connected to Stripe Checkout in the next backend step.
    console.log('Upgrade to Premium clicked')
  }

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
              sx={{ ...pillButtonSx, }}
            >
              Upgrade to Premium
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
