import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'

import './index.css'
import App from './App.jsx'
import theme from './styles/theme'

import { HabitsContextProvider } from './context/HabitsContext'
import { AuthContextProvider } from './auth/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthContextProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* Habits sits inside Auth so logout can clear both user and cached habits. */}
        <HabitsContextProvider>
          <App />
        </HabitsContextProvider>
      </ThemeProvider>
    </AuthContextProvider>
  </StrictMode>,
)
