import { createTheme } from '@mui/material/styles'

import { colors, fontFamily, radii } from './tokens'

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
      contrastText: colors.surface,
    },
    secondary: {
      main: colors.secondary,
      contrastText: colors.surface,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    divider: colors.border,
    success: {
      main: colors.green,
    },
    warning: {
      main: colors.orange,
    },
  },
  typography: {
    fontFamily,
    h1: {
      fontSize: '2.75rem',
      lineHeight: 1.1,
      fontWeight: 900,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontSize: '2rem',
      lineHeight: 1.25,
      fontWeight: 900,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '1.5rem',
      lineHeight: 1.25,
      fontWeight: 900,
    },
    h4: {
      fontSize: '2rem',
      lineHeight: 1.3,
      fontWeight: 900,
    },
    h5: {
      fontSize: '1.25rem',
      lineHeight: 1.35,
      fontWeight: 800,
    },
    h6: {
      fontSize: '1.125rem',
      lineHeight: 1.4,
      fontWeight: 800,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.45,
    },
    button: {
      fontSize: '1rem',
      lineHeight: 1.25,
      textTransform: 'none',
      fontWeight: 800,
    },
  },
  shape: {
    borderRadius: radii.base,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: radii.button,
          textTransform: 'none',
          fontWeight: 700,
        },
        sizeSmall: {
          padding: '8px 18px',
          fontSize: '0.875rem',
        },
        sizeLarge: {
          padding: '14px 28px',
          fontSize: '1rem',
        },
        contained: {
          boxShadow: 'none',
        },
        outlined: {
          borderColor: colors.border,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radii.card,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'none',
      },
    },
  },
})

export default theme
