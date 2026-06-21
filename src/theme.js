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

export const theme = createTheme({
    palette: {
        primary: {
            main: colors.primary,
            dark: colors.primaryDark,
        },
        secondary: {
            main: colors.secondary,
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
    },
    typography: {
        fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
        h1: { fontWeight: 800 },
        h2: { fontWeight: 800 },
        h3: { fontWeight: 800 },
        button: {
        textTransform: "none",
        fontWeight: 700,
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
    }
}); 

export default theme
