import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// habit feature: global state + MUI theme
import { HabitsContextProvider } from './context/HabitsContext'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HabitsContextProvider>
        <App />
      </HabitsContextProvider>
    </ThemeProvider>
  </StrictMode>,
)
