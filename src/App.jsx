import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'

import { theme } from './theme'

import AppLayout from './layouts/AppLayout'

import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import Communities from './pages/Communities'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<AppLayout />}>
            <Route path="/today" element={<Home />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App