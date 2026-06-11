import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  // 1) palette = all the named colors components reference by role, not by hex
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',      // the vivid blue on "Mark done" / "Create Habit" / selected build toggle
      contrastText: '#fff', // text color MUI puts ON a primary-colored surface
    },
    secondary: {
      main: '#111827',      // the near-black used by the selected "Daily" toggle
    },
    background: {
      default: '#f4f6f8',   // the light grey page background behind the cards
      paper: '#ffffff',     // white surface of each habit card / the form
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280', // the muted grey of labels like "BUILD HABITS"
    },
  },

  // 2) shape.borderRadius = the global rounding. Your cards/buttons are quite rounded.
  shape: {
    borderRadius: 10,
  },

    // 3) typography = font family + tweaks. Buttons in your design aren't ALL CAPS.
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none', // MUI uppercases button text by default; your design doesn't
      fontWeight: 600,
    },
  },
})

export default theme
