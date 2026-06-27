import { Box, Card, CardContent, Typography } from '@mui/material'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'

import { useAuthContext } from '../../auth/useAuthContext'
import UpgradeButton from '../../billing/UpgradeButton'
import { colors } from '../../theme'

const Progress = () => {
  // Get the currently logged-in user from the global AuthContext.
  // Progress only needs to know whether the user is premium or not.
  const { user } = useAuthContext()

  // The backend/webhook decides whether the user is premium.
  // The frontend only reads this value from AuthContext.
  const isPremium = user?.subscription === 'premium'

  // Free users see the Premium Analytics lock screen.
  // The UpgradeButton starts the central Stripe Checkout flow.
  if (!isPremium) {
    return (
      <Box
        sx={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 720,
            borderRadius: 5,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)'
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 4,
                md: 7
              },
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                width: 112,
                height: 112,
                mx: 'auto',
                mb: 4,
                borderRadius: 4,
                backgroundColor: colors.softOrange,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <WorkspacePremiumOutlinedIcon
                sx={{
                  fontSize: 56,
                  color: colors.orange
                }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                mb: 2,
                color: colors.textPrimary
              }}
            >
              Premium Analytics
            </Typography>

            <Typography
              sx={{
                maxWidth: 540,
                mx: 'auto',
                mb: 4,
                color: 'text.secondary',
                fontSize: {
                  xs: '1.1rem',
                  md: '1.35rem'
                },
                lineHeight: 1.5
              }}
            >
              Unlock full progress analytics, streak insights, and weekly activity charts with a Premium account.
            </Typography>

            <UpgradeButton
              label="Upgrade to Premium"
              showIcon
              size="large"
              sx={{
                px: 5,
                py: 1.6,
                fontSize: '1.1rem',
                boxShadow: '0 16px 32px rgba(0, 102, 255, 0.25)'
              }}
            />

            <Typography
              sx={{
                mt: 3,
                color: colors.muted,
                fontWeight: 700
              }}
            >
              €3.99/month · cancel anytime
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Premium users see the actual Progress page.
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