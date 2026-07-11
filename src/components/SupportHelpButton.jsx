import { IconButton, Tooltip } from '@mui/material'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'

import { colors, shadows } from '../styles/tokens'

const supportEmail = 'habitumsupport@gmail.com'

const SupportHelpButton = ({ isMobile = false }) => {
  const mailtoHref = `mailto:${supportEmail}?subject=HabiTUM%20Support%20Request`

  return (
    <Tooltip 
      title="Need help? Contact us per Mail." 
      placement="left" 
      arrow
      slotProps={{
        tooltip: {
          sx: {
            fontSize: 16,
            px: 2,
            py: 1.25,
            maxWidth: 320,
          },
        },
        arrow: {
          sx: {
            fontSize: 20,
          },
        },
      }}
      >
      <IconButton
        component="a"
        href={mailtoHref}
        aria-label="Need help? Contact HabiTUM support by email"
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 24 },
          bottom: isMobile
            ? 'calc(88px + env(safe-area-inset-bottom))'
            : 24,
          zIndex: (theme) => theme.zIndex.tooltip,
          width: 48,
          height: 48,
          bgcolor: colors.surface,
          color: colors.textPrimary,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.dialog,
          '&:hover': {
            bgcolor: colors.softBlue,
            color: colors.primary,
          },
        }}
      >
        <HelpOutlineOutlinedIcon sx={{ fontSize: 30 }} />
      </IconButton>
    </Tooltip>
  )
}

export default SupportHelpButton
