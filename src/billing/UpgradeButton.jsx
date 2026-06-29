import { Box, Button, Typography } from '@mui/material'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'

import { useBilling } from './useBillings'
import { colors } from '../theme'

/**
 * Reusable Upgrade Button.
 *
 * Semantic purpose:
 * This component starts the Stripe Checkout flow.
 * It does NOT set the user to premium directly.
 * Premium status is changed by Stripe Webhook -> Backend -> MongoDB.
 */
const UpgradeButton = ({
  label = 'Upgrade to Premium',
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
        sx={{
          borderRadius: 999,
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
        {showIcon && <WorkspacePremiumOutlinedIcon sx={{ mr: 1 }} />}
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