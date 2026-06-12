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
}); 

export default theme
