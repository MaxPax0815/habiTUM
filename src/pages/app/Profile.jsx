import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'

import { useAuthContext } from '../../auth/useAuthContext'
import { useBilling } from '../../billing/useBillings'
import UpgradeButton from '../../billing/UpgradeButton'
import PlanCard from '../../components/PlanCard'
import BillingInformationCard from '../../components/BillingInformationCard'
import { colors } from '../../theme'


const formatDate = (dateString) => {
  if (!dateString) return '—'

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(dateString))
}

const CurrentPlanButton = ({ accentColor, activeBackground }) => {
  return (
    <Button
      fullWidth
      variant="contained"
      disabled
      sx={{
        borderRadius: 999,
        fontWeight: 800,
        py: 1,
        backgroundColor: activeBackground,
        color: accentColor,
        border: `1.5px solid ${accentColor}`,
        '&.Mui-disabled': {
          backgroundColor: activeBackground,
          color: accentColor,
          border: `1.5px solid ${accentColor}`,
          opacity: 1
        }
      }}
    >
      Current Plan
    </Button>
  )
}

const Profile = () => {
  const { user } = useAuthContext()
  const {
    startCheckout,
    scheduleCancellation,
    refreshCurrentUser,
    isLoading,
    error
  } = useBilling()
  const isPremium = user?.subscription === 'premium'
  const cancellationScheduled = Boolean(user?.subscriptionCancelAtPeriodEnd)
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false)
  const accountStatusLabel = isPremium ? 'Premium Account' : 'Normal Account'
  const handleDowngradeClick = () => {
    if (cancellationScheduled) {
      setDowngradeDialogOpen(true)
      return
    }

    scheduleCancellation()
  }

  useEffect(() => {
    // Refresh once when opening the Profile page,
    // so billing info is loaded from MongoDB.
    refreshCurrentUser().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Account
        </Typography>

        <Typography sx={{ color: 'text.secondary' }}>
          Manage your plan and billing information
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card
        sx={{
          mb: 4,
          borderRadius: 4,
          border: `1px solid ${colors.border}`,
          boxShadow: 'none'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Account status
          </Typography>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>
              {accountStatusLabel}
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Signed in as {user?.firstName} {user?.lastName} · {user?.email}
            </Typography>

            {isPremium && (
              <Typography sx={{ color: 'text.secondary' }}>
                Billing status: {user?.stripeSubscriptionStatus || 'active'}
              </Typography>
            )}

            {isPremium && user?.subscriptionCurrentPeriodEnd && (
              <Typography sx={{ color: 'text.secondary' }}>
                Current billing period ends on {formatDate(user.subscriptionCurrentPeriodEnd)}
              </Typography>
            )}

            {isPremium && cancellationScheduled && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Your Premium plan will downgrade to Normal on{' '}
                {formatDate(user.subscriptionCancelAt || user.subscriptionCurrentPeriodEnd)}.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ 
          mb: 4,
            fontSize: '0.95rem',
            fontWeight: 900,
            letterSpacing: '0.14em',
            color: colors.muted,
            textTransform: 'uppercase',
            textAlign: 'left'
        }}>
          Plan
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr'
          },
          gap: 3
        }}
      >
        <PlanCard
          title="Standard"
          price="Free"
          description="Basic habit tracking for everyday use."
          icon={<AccountCircleOutlinedIcon sx={{ color: colors.primary }} />}
          accentColor={colors.primary}
          activeBackground={colors.softBlue}
          priceBadgeBackground="#EEF2F7"
          features={[
            'Create and track habits',
            'Join Communities and Challenges'
          ]}
          isCurrent={!isPremium}
          action={
            !isPremium ? (
              <CurrentPlanButton
                accentColor={colors.primary}
                activeBackground={colors.softBlue}
              />
            ) : (
              <Button
                fullWidth
                variant="contained"
                onClick={handleDowngradeClick}
                disabled={isLoading}
                sx={{
                  borderRadius: 999,
                  fontWeight: 800,
                  py: 1,
                  backgroundColor: colors.primary,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: colors.primary,
                    opacity: 0.9
                  }
                }}
              >
                {isLoading ? 'Processing...' : 'Downgrade'}
              </Button>
            )
          }
        />

        <PlanCard
          title="Premium"
          price="3,99€/month"
          description="Unlock advanced analytics on your progress page."
          icon={<WorkspacePremiumOutlinedIcon sx={{ color: colors.orange }} />}
          accentColor={colors.orange}
          activeBackground={colors.softOrange}
          priceBadgeBackground={colors.softOrange}
          features={[
            'Advanced progress analytics',
            'Create your own communities',
            'Create challenges',
            'Priority support'
          ]}
          isCurrent={isPremium}
          action={
            isPremium ? (
              <CurrentPlanButton
                accentColor={colors.orange}
                activeBackground={colors.softOrange}
              />
            ) : (
              <UpgradeButton
                label="Upgrade to Premium"
                fullWidth
                showError={false}
              />
            )
          }
        />

        <Dialog
          open={downgradeDialogOpen}
          onClose={() => setDowngradeDialogOpen(false)}
        >
          <DialogTitle>
            Downgrade scheduled
          </DialogTitle>

          <DialogContent>
            <DialogContentText>
              Downgrade is already scheduled for{' '}
              {formatDate(user?.subscriptionCancelAt || user?.subscriptionCurrentPeriodEnd)}.
            </DialogContentText>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setDowngradeDialogOpen(false)}
              sx={{
                borderRadius: 999,
                fontWeight: 800,
                px: 3
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
        <BillingInformationCard user={user} />
    </Box>
  )
}

export default Profile