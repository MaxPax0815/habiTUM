// Displays the user's account and subscription information and manages plan
// changes: standard/premium upgrades and downgrades, plus manager community-slot
// adjustments. Upgrades run through the shared Stripe checkout flow (useBilling).

import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import GroupsIcon from '@mui/icons-material/Groups'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'

import { useAuthContext } from '../../auth/useAuthContext'
import { useBilling } from '../../billing/useBillings'
import UpgradeButton from '../../billing/UpgradeButton'
import PlanCard from '../../components/PlanCard'
import BillingInformationCard from '../../components/BillingInformationCard'
import PageContainer from '../../components/layout/PageContainer'
import PageHeader from '../../components/layout/PageHeader'
import PageSection from '../../components/layout/PageSection'
import { colors } from '../../styles/tokens'
import { pillButtonSx, sectionTitleSx } from '../../styles/recipes'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(dateString))
}

const billingRowSx = {
  py: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
}

const CurrentPlanButton = ({ accentColor, activeBackground }) => (
  <Button
    fullWidth
    variant="contained"
    disabled
    sx={{
      ...pillButtonSx,
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

// ── Manager-only plan card ────────────────────────────────────────────────────
const ManagerPlanCard = ({ user, onAdd, onRemove, isLoading }) => {
  const maxCommunities = user?.maxCommunities || 1
  const activeCommunityCount = user?.activeCommunityCount ?? 0
  const additionalCommunities = Math.max(0, maxCommunities - 1)
  const monthlyEur = 50 + additionalCommunities * 5

  // "Remove" is blocked if the manager is already at the base minimum (1 slot)
  // or if all remaining slots are occupied by active communities.
  const canRemove = maxCommunities > 1 && activeCommunityCount < maxCommunities
  const canAdd = maxCommunities < 16   // base 1 + max 15 additional

  const removeTooltip = maxCommunities <= 1
    ? 'The base plan already includes 1 community — cannot go lower.'
    : activeCommunityCount >= maxCommunities
      ? `Delete one of your ${activeCommunityCount} active communities first.`
      : ''

  const addTooltip = !canAdd
    ? 'Maximum of 16 total communities reached.'
    : ''

  return (
    <Card sx={{ border: `2px solid ${colors.primary}`, backgroundColor: colors.softBlue }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, pb: 3, borderBottom: `1px solid ${colors.border}` }}>
          <BusinessOutlinedIcon sx={{ color: colors.primary, fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {user?.institutionName || 'Your Institution'}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              HabiTUM Manager Plan
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: colors.primary, textAlign: 'right' }}>
              €{monthlyEur}.00
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', textAlign: 'right' }}>
              per month
            </Typography>
          </Box>
        </Box>

        {/* Plan details */}
        <Stack divider={<Divider />} spacing={0}>
          {/* Community slots row */}
          <Box sx={{ ...billingRowSx, py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupsIcon sx={{ fontSize: 20, color: colors.primary }} />
              <Box>
                <Typography sx={{ fontWeight: 700 }}>Community Slots</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                  {activeCommunityCount} active · {maxCommunities} total · +€5/additional slot
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <Tooltip title={removeTooltip} placement="top">
                <span>
                  <IconButton
                    size="small"
                    onClick={onRemove}
                    disabled={isLoading || !canRemove}
                    sx={{
                      border: `1px solid ${colors.border}`,
                      '&:not(:disabled):hover': { borderColor: colors.primary, bgcolor: colors.softBlue }
                    }}
                  >
                    <RemoveIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>

              <Typography sx={{ typography: 'subtitle1', fontWeight: 900, minWidth: 28, textAlign: 'center' }}>
                {maxCommunities}
              </Typography>

              <Tooltip title={addTooltip} placement="top">
                <span>
                  <IconButton
                    size="small"
                    onClick={onAdd}
                    disabled={isLoading || !canAdd}
                    sx={{
                      border: `1px solid ${colors.border}`,
                      '&:not(:disabled):hover': { borderColor: colors.primary, bgcolor: colors.softBlue }
                    }}
                  >
                    <AddIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* Challenges row */}
          <Box sx={{ ...billingRowSx, py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEventsOutlinedIcon sx={{ fontSize: 20, color: colors.primary }} />
              <Typography sx={{ fontWeight: 700 }}>Challenges</Typography>
            </Box>
            <Chip
              label="Unlimited"
              size="small"
              sx={{ fontWeight: 800, color: colors.green, bgcolor: colors.softGreen, px: 0.5 }}
            />
          </Box>
        </Stack>

        <Typography variant="caption" sx={{ color: colors.muted, display: 'block', mt: 2.5 }}>
          Adding a slot charges the prorated difference immediately and adjusts your next monthly invoice.
          To reduce slots, delete active communities first.
        </Typography>
      </CardContent>
    </Card>
  )
}

// ── Main Profile page ─────────────────────────────────────────────────────────
const Profile = () => {
  const { user } = useAuthContext()

  const {
    scheduleCancellation,
    confirmCheckoutSession,
    refreshCurrentUser,
    updateManagerCommunities,
    isLoading,
    error
  } = useBilling()

  const isPremium = user?.subscription === 'premium'
  const isManager = user?.subscription === 'manager'
  const cancellationScheduled = Boolean(user?.subscriptionCancelAtPeriodEnd)
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false)
  const checkoutSyncStarted = useRef(false)

  const accountStatusLabel = isManager
    ? 'Manager Account'
    : isPremium
      ? 'Premium Account'
      : 'Standard Account'

  const handleDowngradeClick = () => {
    if (cancellationScheduled) {
      setDowngradeDialogOpen(true)
      return
    }
    scheduleCancellation()
  }

  const handleAddSlot = async () => {
    try { await updateManagerCommunities(1) } catch { /* error shown via useBilling state */ }
  }

  const handleRemoveSlot = async () => {
    try { await updateManagerCommunities(-1) } catch { /* error shown via useBilling state */ }
  }

  // On load, reconcile subscription state with Stripe. If Stripe redirected back
  // here after checkout, confirm the session (and strip the query params so a
  // refresh can't re-trigger it); otherwise just re-fetch the current account.
  // The ref guards against React Strict Mode's double effect run.
  useEffect(() => {
    if (checkoutSyncStarted.current) return
    checkoutSyncStarted.current = true

    const searchParams = new URLSearchParams(window.location.search)
    const checkoutSucceeded = searchParams.get('checkout') === 'success'
    const sessionId = searchParams.get('session_id')

    const syncUser = async () => {
      if (checkoutSucceeded && sessionId) {
        await confirmCheckoutSession(sessionId)
        window.history.replaceState({}, '', window.location.pathname)
        return
      }
      await refreshCurrentUser()
    }

    syncUser().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Account"
        description="Manage your plan and billing information"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ── Account status ── */}
      <PageSection title="Account status">
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={1}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 800,
                  color: isManager ? colors.primary : isPremium ? colors.orange : colors.primary
                }}
              >
                {accountStatusLabel}
              </Typography>

              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Signed in as {user?.firstName} {user?.lastName} · {user?.email}
              </Typography>

              {(isPremium || isManager) && (
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Billing status: {user?.stripeSubscriptionStatus || 'active'}
                </Typography>
              )}

              {(isPremium || isManager) && user?.subscriptionCurrentPeriodEnd && (
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Current billing period ends on{' '}
                  {formatDate(user.subscriptionCurrentPeriodEnd)}
                </Typography>
              )}
            </Stack>

            {isPremium && cancellationScheduled && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Your Premium plan will downgrade to Standard on{' '}
                {formatDate(user.subscriptionCancelAt || user.subscriptionCurrentPeriodEnd)}.
              </Alert>
            )}
          </CardContent>
        </Card>
      </PageSection>

      {/* ── Plan section: manager vs regular user ── */}
      {isManager ? (
        <Box sx={{ mb: 3 }}>
          <Typography component="h2" sx={sectionTitleSx}>
            Manager Plan
          </Typography>
          <ManagerPlanCard
            user={user}
            onAdd={handleAddSlot}
            onRemove={handleRemoveSlot}
            isLoading={isLoading}
          />
        </Box>
      ) : (
        <PageSection title="Plan" sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
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
                      ...pillButtonSx,
                      py: 1,
                      backgroundColor: colors.primary,
                      color: colors.surface,
                      '&:hover': { backgroundColor: colors.primaryDark }
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
                    label="Upgrade To Premium"
                    fullWidth
                    showError={false}
                  />
                )
              }
            />
          </Box>
        </PageSection>
      )}

      <BillingInformationCard user={user} />

      <Dialog
        open={downgradeDialogOpen}
        onClose={() => setDowngradeDialogOpen(false)}
      >
        <DialogTitle>Downgrade scheduled</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Downgrade is already scheduled for{' '}
            {formatDate(user?.subscriptionCancelAt || user?.subscriptionCurrentPeriodEnd)}.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => setDowngradeDialogOpen(false)}
            sx={{ ...pillButtonSx, px: 3 }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  )
}

export default Profile
