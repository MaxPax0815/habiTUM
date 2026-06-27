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
import { colors } from '../theme'

const formatBillingDate = (dateString) => {
  if (!dateString) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString))
}

const BillingInformationCard = ({ user, paymentMethod }) => {
  const isPremium = user?.subscription === 'premium'

  // Later this should come from Stripe via /api/billing/info.
  // For now, we use paymentMethod if passed in, otherwise a test fallback.
  const cardLast4 = paymentMethod?.last4 || '4242'

  const nextBillingDate =
    user?.subscriptionCancelAt || user?.subscriptionCurrentPeriodEnd

  const statusLabel = user?.stripeSubscriptionStatus || 'active'

  if (!isPremium) {
    return (
      <Card
        sx={{
          mt: 4,
          borderRadius: 4,
          border: `1px solid ${colors.border}`,
          boxShadow: 'none',
          backgroundColor: colors.surface
        }}
      >
        <CardContent
          sx={{
            px: {
              xs: 3,
              md: 5
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
          <Typography
            sx={{
              mb: 6,
              fontSize: '0.95rem',
              fontWeight: 900,
              letterSpacing: '0.14em',
              color: colors.muted,
              textTransform: 'uppercase',
              textAlign: 'left'
            }}
          >
            Billing Information
          </Typography>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              sx={{
                mb: 3,
                fontSize: {
                  xs: '1.2rem',
                  md: '1.45rem'
                },
                fontWeight: 700,
                color: colors.muted
              }}
            >
              No active subscription.
            </Typography>

            <UpgradeButton
              label="Upgrade to Premium"
              showIcon
              size="large"
              showError={false}
              sx={{
                px: 4,
                py: 1.3,
                fontSize: '1.1rem',
                fontWeight: 900,
                minWidth: {
                  xs: '100%',
                  sm: 330
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      sx={{
        mt: 4,
        borderRadius: 4,
        border: `1px solid ${colors.border}`,
        boxShadow: 'none',
        backgroundColor: colors.surface
      }}
    >
      <CardContent
        sx={{
          px: {
            xs: 3,
            md: 5
          },
          py: {
            xs: 4,
            md: 5
          }
        }}
      >
        <Typography
          sx={{
            mb: 4,
            fontSize: '0.95rem',
            fontWeight: 900,
            letterSpacing: '0.14em',
            color: colors.muted,
            textTransform: 'uppercase',
            textAlign: 'left'
          }}
        >
          Billing Information
        </Typography>

        <Stack divider={<Divider />} spacing={0}>
          <Box
            sx={{
              py: 2.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3
            }}
          >
            <Typography 
              sx={{
                fontSize: {
                  xs: '1.1rem',
                  md: '1.35rem'
                },
                fontWeight: 500,
                color: 'text.secondary'
              }}
            >
              Payment method
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.8,
                color: colors.textPrimary
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
                  fontSize: {
                    xs: '1.1rem',
                    md: '1.35rem'
                  },
                  fontWeight: 900,
                  letterSpacing: '0.12em'
                }}
              >
                ••••
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: '1.1rem',
                    md: '1.35rem'
                  },
                  fontWeight: 900,
                  color: colors.textPrimary
                }}
              >
                {cardLast4}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              py: 2.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: '1.1rem',
                  md: '1.35rem'
                },
                fontWeight: 500,
                color: 'text.secondary'
              }}
            >
              Monthly amount
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: '1.1rem',
                  md: '1.35rem'
                },
                fontWeight: 900,
                color: colors.textPrimary
              }}
            >
              €3.99
            </Typography>
          </Box>

          <Box
            sx={{
              py: 2.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: '1.1rem',
                  md: '1.35rem'
                },
                fontWeight: 500,
                color: 'text.secondary'
              }}
            >
              Next billing
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: '1.1rem',
                  md: '1.35rem'
                },
                fontWeight: 900,
                color: colors.textPrimary
              }}
            >
              {formatBillingDate(nextBillingDate)}
            </Typography>
          </Box>

          <Box
            sx={{
              py: 2.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: '1.1rem',
                  md: '1.35rem'
                },
                fontWeight: 500,
                color: 'text.secondary'
              }}
            >
              Status
            </Typography>

            <Chip
              label={statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
              sx={{
                px: 1.2,
                height: 32,
                borderRadius: 999,
                fontSize: '1rem',
                fontWeight: 900,
                color: colors.green,
                backgroundColor: colors.softGreen
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default BillingInformationCard