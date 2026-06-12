import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './auth/useAuthContext'

import AppLayout from './layouts/AppLayout'


import Home from './pages/app/Home'
import Communities from './pages/app/Communities'
import Progress from './pages/app/Progress'
import Profile from './pages/app/Profile'

import LandingPage from './pages/public/LandingPage'
import Login from './pages/public/Login.jsx'
import Signup from './pages/public/Signup.jsx'

// styles for the habit feature (Navbar / dashboard layout)
import './habits.css'

function App() {
  const { user } = useAuthContext()

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route 
            path="/login" element={!user ? <Login /> : <Navigate to="/today" />} 
          />

          <Route 
            path="/signup" element={!user ? <Signup /> : <Navigate to="/today" />} 
          />

          <Route
            element={user ? <AppLayout /> : <Navigate to="/login" />}
          />
          <Route element={<AppLayout />}>
            <Route path="/today" element={<Home />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </ Routes>
      </ BrowserRouter>
  )
}

export default App