import { createTheme } from '@mui/material/styles'

import { colors, fontFamily, radii, shadows } from './tokens'

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
    subtitle1: {
      fontSize: '1.125rem',
      lineHeight: 1.4,
      fontWeight: 700,
    },
    subtitle2: {
      fontSize: '0.875rem',
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
    caption: {
      fontSize: '0.8125rem',
      lineHeight: 1.35,
    },
    overline: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 800,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
    },
    button: {
      fontSize: '1rem',
      lineHeight: 1.25,
      textTransform: 'none',
      fontWeight: 800,
    },
    fieldLabel: {
      fontSize: '0.8125rem',
      lineHeight: 1.35,
      fontWeight: 600,
    },
    finePrint: {
      fontSize: '0.8125rem',
      lineHeight: 1.45,
    },
    micro: {
      fontSize: '0.625rem',
      lineHeight: 1.3,
    },
    navLabel: {
      fontSize: '0.7rem',
      lineHeight: 1.2,
    },
    sectionTitle: {
      fontSize: '0.95rem',
      lineHeight: 1.25,
      fontWeight: 900,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
    },
    feedTitle: {
      fontSize: '0.95rem',
      lineHeight: 1.25,
      fontWeight: 900,
    },
    metricValue: {
      fontSize: '1.25rem',
      lineHeight: 1,
      fontWeight: 900,
    },
    metricLabel: {
      fontSize: '1.125rem',
      lineHeight: 1,
      fontWeight: 700,
    },
    landingDisplay: {
      fontSize: 'clamp(2.625rem, 6vw, 4.25rem)',
      lineHeight: 1.02,
      fontWeight: 900,
    },
    landingSectionTitle: {
      fontSize: 'clamp(1.875rem, 3.5vw, 2.375rem)',
      lineHeight: 1.15,
      fontWeight: 900,
    },
    landingLead: {
      fontSize: 'clamp(1rem, 2vw, 1.125rem)',
      lineHeight: 1.7,
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
          minHeight: 40,
          textTransform: 'none',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          transition: 'background-color 160ms ease, border-color 160ms ease, transform 160ms ease',
          '&:active': {
            transform: 'scale(0.99)',
          },
          '&.Mui-focusVisible': {
            outline: `3px solid ${colors.primary}`,
            outlineOffset: 2,
          },
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
          boxShadow: shadows.none,
          '&:hover': {
            boxShadow: shadows.none,
          },
        },
        outlined: {
          borderColor: colors.border,
          '&:hover': {
            borderColor: colors.primary,
            backgroundColor: colors.softBlue,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radii.button,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          borderRadius: radii.card,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          boxShadow: shadows.none,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: radii.card,
        },
        outlined: {
          borderColor: colors.border,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(15, 23, 42, 0.25)',
          },
        },
        paper: {
          border: `1px solid ${colors.border}`,
          borderRadius: radii.dialog,
          boxShadow: shadows.dialog,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '24px 24px 16px',
          fontWeight: 900,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          gap: 8,
          padding: '16px 24px 24px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radii.button,
          fontSize: 15,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary,
            borderWidth: 2,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: colors.primary,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radii.pill,
          fontWeight: 700,
        },
        outlined: {
          borderColor: colors.border,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: radii.pill,
          backgroundColor: colors.progressTrack,
        },
        bar: {
          borderRadius: radii.pill,
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
