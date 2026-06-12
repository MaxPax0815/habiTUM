import { Box, Button, Stack, Typography } from '@mui/material'
import { NavLink } from 'react-router-dom'
import { colors } from '../theme'

const AuthHeader = ({ title, subtitle }) => {
  return (
    <Box sx={{ width: '100%', maxWidth: 420, mb: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        {title}
      </Typography>

      {subtitle && (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Stack direction="row" spacing={1}>
        <Button
          component={NavLink}
          to="/login"
          end
          fullWidth
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',

            '&.active': {
              backgroundColor: colors.primary,
              color: colors.surface,
              borderColor: colors.primary,
            },

            '&.active:hover': {
              backgroundColor: colors.primary,
            },
          }}
        >
          Login
        </Button>

        <Button
          component={NavLink}
          to="/signup"
          end
          fullWidth
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',

            '&.active': {
              backgroundColor: colors.primary,
              color: colors.surface,
              borderColor: colors.primary,
            },

            '&.active:hover': {
              backgroundColor: colors.primary,
            },
          }}
        >
          Sign up
        </Button>
      </Stack>
    </Box>
  )
}

export default AuthHeader