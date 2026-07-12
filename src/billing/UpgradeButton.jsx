import { Box, Button, Typography } from '@mui/material'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'

import { useBilling } from './useBillings'
import { colors, radii } from '../styles/tokens'

/**
 * Reusable Upgrade Button.
 *
 * Semantic purpose:
 * This component starts the Stripe Checkout flow.
 * It does NOT set the user to premium directly.
 * Premium status is changed by Stripe Webhook -> Backend -> MongoDB.
 */
const UpgradeButton = ({
  label = 'Upgrade To Premium',
  fullWidth = false,
  size = 'medium',
  showIcon = false,
  showError = true,
  sx = {}
}) => {
  const { startCheckout, isLoading, error } = useBilling()

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Button
        fullWidth={fullWidth}
        variant="contained"
        size={size}
        onClick={startCheckout}
        disabled={isLoading}
        startIcon={showIcon ? <WorkspacePremiumOutlinedIcon /> : undefined}
        sx={{
          borderRadius: radii.pill,
          fontWeight: 800,
          py: 1,
          backgroundColor: colors.primary,
          color: '#fff',
          '&:hover': {
            backgroundColor: colors.primary,
            opacity: 0.9
          },
          ...sx
        }}
      >
        {isLoading ? 'Redirecting...' : label}
      </Button>

      {showError && error && (
        <Typography sx={{ mt: 1.5, color: 'error.main' }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default UpgradeButton
