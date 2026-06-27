import { createTheme } from '@mui/material/styles';

export const colors = {
    primary: "#0066FF", 
    primaryDark: "#00213D", 
    secondary: "#00B894", 
    background: "#F4F7FB", 
    surface: "#FFFFFF", 
    textPrimary: "#071D35", 
    textSecondary: "#5B6B7F", 
    muted: "#94A3B8", 
    border: "#DDE5EF", 
    softBlue: "#EAF2FF", 
    softOrange: "#FFF1E8", 
    softGreen: "#E9FFF5", 
    orange: "#FF7A1A", 
    green: "#00A86B",
};

export const pillButtonSx = {
    borderRadius: 999,
    px: 2,
    py: 1,
    fontWeight: 800,
};

export const outlinedPillButtonSx = {
  ...pillButtonSx,
  color: colors.textPrimary,
  borderColor: colors.border,
  backgroundColor: colors.surface,

  "&:hover": {
    border: "1px solid",
    borderColor: colors.primary,
    backgroundColor: colors.softBlue,
  },
};

export const linkResetSx = {
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': {
    color: 'inherit',
    textDecoration: 'none',
  },
};

export const theme = createTheme({
    palette: {
        primary: {
            main: colors.primary,
            dark: colors.primaryDark,
            contrastText: colors.surface
        },
        secondary: {
            main: colors.secondary,
            contrastText: colors.surface
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
        succes: {
            main: colors.green
        },
        warining: {
            main: colors.orange
        },
    },

    typography: {
        fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
        h1: {
            fontSize: "2.75rem",
            lineHeight: 1.1,
            fontWeight: 900,
            letterSpacing: '-0.03em'
        },
        h2: {
            fontSize: "2rem",
            lineHeight: 1.25,
            fontWeight: 900,
            letterSpacing: '-0.02em'
        },
        h3: {
            fontSize: "1.5rem",
            lineHeight: 1.25,
            fontWeight: 900,
        },

        h4: {
            fontSize: "2rem",
            lineHeight: 1.3,
            fontWeight: 900,
        },

        h5: {
            fontSize: "1.25rem",
            lineHeight: 1.35,
            fontWeight: 800,
        },

        h6: {
            fontSize: "1.125rem",
            lineHeight: 1.4,
            fontWeight: 800,
        },

        body1: {
            fontSize: "1rem",
            lineHeight: 1.5,
        },

        body2: {
            fontSize: "0.875rem",
            lineHeight: 1.45,
        },

        button: {
            fontSize: "1rem",
            lineHeight: 1.25,
            textTransform: "none",
            fontWeight: 800,
        },
    },

    shape: {
        borderRadius: 14,
    },
    
    components: {
        MuiButton: {
            defaultProps: {
            disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: "none",
                    fontWeight: 700,
                },
                sizeSmall: {
                    padding: "8px 18px",
                    fontSize: "0.875rem",
                },
                sizeLarge: {
                    padding: "14px 28px",
                    fontSize: "1rem",
                },
                contained: {
                    boxShadow: "none",
                },
                outlined: {
                    borderColor: colors.border,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                borderRadius: 16,
                },
            },
            },
            MuiLink: {
            defaultProps: {
                underline: 'none',
            },
        },
    }
}); 

export default theme
