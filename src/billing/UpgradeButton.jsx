import { Box, Button, Typography } from '@mui/material'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'

import { useBilling } from './useBillings'
import { colors, radii } from '../styles/tokens'

// Reusable button that only starts the Stripe Checkout flow. Premium status is
// never set here — it is granted server-side via the Stripe webhook after payment.
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
