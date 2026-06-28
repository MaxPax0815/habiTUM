import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography
} from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'

import { colors } from '../theme'

/**
 * Reusable plan card for the Profile page.
 *
 * Semantic purpose:
 * This component only displays one subscription plan.
 * It does not know anything about Stripe or user state.
 * The parent component decides:
 * - is this the current plan?
 * - which button/action should be shown?
 */
const PlanCard = ({
  title,
  price,
  description,
  features,
  isCurrent,
  icon,
  accentColor,
  activeBackground,
  priceBadgeBackground,
  action
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        border: isCurrent
          ? `2px solid ${accentColor}`
          : `1px solid ${colors.border}`,
        backgroundColor: isCurrent ? activeBackground : colors.surface,
        boxShadow: 'none'
      }}
    >
      <CardContent
        sx={{
          p: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'left'
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon}

            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>

            <Typography
              sx={{
                ml: 'auto',
                px: 1.4,
                py: 0.4,
                borderRadius: 999,
                fontSize: '0.875rem',
                fontWeight: 800,
                color: accentColor,
                backgroundColor: priceBadgeBackground
              }}
            >
              {price}
            </Typography>
          </Box>

          <Typography sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>

          <Divider />

          <Stack spacing={1}>
            {features.map((feature) => (
              <Box
                key={feature}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                <CheckCircleOutlinedIcon
                  sx={{
                    fontSize: 18,
                    color: accentColor,
                    mt: '3px',
                    flexShrink: 0
                  }}
                />

                <Typography sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>

        {/* mt: auto pushes the action button to the bottom of the card */}
        <Box sx={{ mt: 'auto', pt: 3 }}>
          {action}
        </Box>
      </CardContent>
    </Card>
  )
}

export default PlanCard