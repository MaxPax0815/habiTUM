import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography
} from '@mui/material'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'

import UpgradeButton from '../billing/UpgradeButton'
import { colors } from '../styles/tokens'
import { sectionTitleSx } from '../styles/recipes'

const formatBillingDate = (dateString) => {
  if (!dateString) return '—'

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(dateString))
}

const billingRowSx = {
  py: 2.25,
  display: 'flex',
  alignItems: {
    xs: 'flex-start',
    sm: 'center'
  },
  justifyContent: 'space-between',
  flexDirection: {
    xs: 'column',
    sm: 'row'
  },
  gap: {
    xs: 1,
    sm: 3
  }
}

const billingLabelSx = {
  color: 'text.secondary',
  fontWeight: 700
}

const billingValueSx = {
  color: 'text.primary',
  fontWeight: 900,
  textAlign: {
    xs: 'left',
    sm: 'right'
  }
}

const BillingInformationCard = ({ user, paymentMethod }) => {
  const isPremium = user?.subscription === 'premium'
  const isManager = user?.subscription === 'manager'
  const hasActiveBilling = isPremium || isManager

  // Later this should come from Stripe via /api/billing/info.
  // For now, we use paymentMethod if passed in, otherwise a test fallback.
  const cardLast4 = paymentMethod?.last4 || '4242'

  const nextBillingDate =
    user?.subscriptionCancelAt || user?.subscriptionCurrentPeriodEnd

  const statusLabel = user?.stripeSubscriptionStatus || 'active'
  const formattedStatusLabel =
    statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)

  // For managers: 50 € base + 5 € per additional community (beyond the 1 included)
  const managerAdditional = Math.max(0, (user?.maxCommunities || 1) - 1)
  const monthlyAmountDisplay = isPremium
    ? '€3.99'
    : isManager
      ? `€${50 + managerAdditional * 5}.00`
      : null

  if (!hasActiveBilling) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography component="h2" sx={sectionTitleSx}>
          Billing Information
        </Typography>

        <Card>
          <CardContent
            sx={{
              px: {
                xs: 3,
                md: 4
              },
              py: {
                xs: 4,
                md: 5
              },
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <Typography
                variant="h5"
                component="p"
                sx={{
                  mb: 1,
                  color: 'text.primary'
                }}
              >
                No active subscription
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  maxWidth: 420,
                  color: 'text.secondary'
                }}
              >
                Upgrade to Premium to unlock advanced analytics and billing
                details.
              </Typography>

              <UpgradeButton
                label="Upgrade to Premium"
                showIcon
                size="large"
                showError={false}
                sx={{
                  px: 4,
                  py: 1.3,
                  fontSize: '1rem',
                  fontWeight: 900,
                  minWidth: {
                    xs: '100%',
                    sm: 320
                  }
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography component="h2" sx={sectionTitleSx}>
        Billing Information
      </Typography>

      <Card>
        <CardContent
          sx={{
            px: {
              xs: 3,
              md: 4
            },
            py: {
              xs: 3,
              md: 4
            }
          }}
        >
          <Stack divider={<Divider />} spacing={0}>
            <Box sx={billingRowSx}>
              <Typography variant="body1" sx={billingLabelSx}>
                Payment method
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  color: 'text.primary'
                }}
              >
                <CreditCardOutlinedIcon
                  sx={{
                    fontSize: 24,
                    color: colors.muted
                  }}
                />

                <Typography
                  sx={{
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    color: 'text.primary'
                  }}
                >
                  ••••
                </Typography>

                <Typography variant="body1" sx={billingValueSx}>
                  {cardLast4}
                </Typography>
              </Box>
            </Box>

            <Box sx={billingRowSx}>
              <Typography variant="body1" sx={billingLabelSx}>
                Monthly amount
              </Typography>

              <Typography variant="body1" sx={billingValueSx}>
                {monthlyAmountDisplay}
              </Typography>
            </Box>

            <Box sx={billingRowSx}>
              <Typography variant="body1" sx={billingLabelSx}>
                Next billing
              </Typography>

              <Typography variant="body1" sx={billingValueSx}>
                {formatBillingDate(nextBillingDate)}
              </Typography>
            </Box>

            <Box sx={billingRowSx}>
              <Typography variant="body1" sx={billingLabelSx}>
                Status
              </Typography>

              <Chip
                label={formattedStatusLabel}
                sx={{
                  height: 32,
                  px: 1.2,
                  fontSize: '0.875rem',
                  fontWeight: 900,
                  color: colors.green,
                  backgroundColor: colors.softGreen
                }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default BillingInformationCard
