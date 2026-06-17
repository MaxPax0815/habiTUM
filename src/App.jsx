import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthContext } from './auth/useAuthContext'

import AppLayout from './layouts/AppLayout'


import Communities from './pages/app/Communities'
import Home from './pages/app/Home'
import ManagerDashboard from './pages/app/ManagerDashboard'
import Profile from './pages/app/Profile'
import Progress from './pages/app/Progress'

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

          {/* after login, managers go to /manager; regular users go to /today */}
          <Route
            path="/login" element={!user ? <Login /> :
            <Navigate to={user.accountType === 'manager' ? '/manager' : '/today'} />}
          />

          <Route 
            path="/signup" element={!user ? <Signup /> : <Navigate to="/today" />} 
          />

          <Route
            element={user ? <AppLayout user={user} /> : <Navigate to="/login" />}
          />
          <Route element={<AppLayout />}>
            <Route path="/today" element={<Home />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/manager" element={<ManagerDashboard />} /> {/* manager-only page; accessible by URL but only linked in sidebar for managers */}
          </Route>
        </ Routes>
      </ BrowserRouter>
  )
}

export default App