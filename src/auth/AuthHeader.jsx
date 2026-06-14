import { Box, Button, IconButton, Typography } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { colors } from '../theme'

const AuthHeader = ({ title, subtitle }) => {
  const location = useLocation()

  const isSignupPage = location.pathname === '/signup'
  const targetPath = isSignupPage ? '/login' : '/signup'
  const buttonText = isSignupPage ? 'Login' : 'Sign up'

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        pt: 7,
        mb: 5,
        textAlign: 'center',
      }}
    >

      <IconButton
        component={RouterLink}
        to="/"
        aria-label="Back to landing page"
        sx={{
          position: 'absolute',
          top: 28,
          left: 32,
          color: colors.textPrimary,
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',

          '&:hover': {
            color: colors.primary,
            backgroundColor: 'transparent',
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Button
        component={RouterLink}
        to={targetPath}
        variant="outlined"
        sx={{
          position: 'absolute',
          top: 24,
          right: 32,
          borderRadius: 999,
          px: 3,
          py: 1,
          fontWeight: 800,
          color: colors.textPrimary,
          borderColor: colors.border,
          backgroundColor: colors.surface,

          '&:hover': {
            borderColor: colors.primary,
            backgroundColor: colors.softBlue,
          },
        }}
      >
        {buttonText}
      </Button>

      <Typography
        variant="h4"
        sx={{
          fontWeight: 900,
          color: colors.primary,
          mb: 1,
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          variant="body1"
          sx={{
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}

export default AuthHeader