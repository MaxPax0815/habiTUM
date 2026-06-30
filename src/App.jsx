import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthContext } from './auth/useAuthContext'

// Layouts
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout.jsx'
import PublicLayout from './layouts/PublicLayout.jsx'

// App pages 
import Communities from './pages/app/Communities'
import NewCommunity from './pages/app/NewCommunity'
import CommunityDashboard from './pages/app/CommunityDashboard'
import Home from './pages/app/Home'
import ManagerDashboard from './pages/app/ManagerDashboard'
import Profile from './pages/app/Profile'
import Progress from './pages/app/Progress'
import ChallengePage from './challenges/ChallengePage.jsx'

// Public Pages
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
          {/* Public pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />

            <Route element={<AuthLayout />}>
              <Route 
                path="/login" 
                element={!user ? <Login /> : <Navigate to={user.accountType === 'manager' ? '/manager' : '/today'} replace /> } 
              />
              <Route 
                path="/signup" 
                element={!user ? <Signup /> : <Navigate to="/today" repalce />} />
            </Route>
          </Route>

          {/* Proctected app pages */}
          <Route element={user ? <AppLayout user={user} /> : <Navigate to="/login"  repalce />}>
            <Route path="/today" element={<Home />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/challenges/:challengeId" element={<ChallengePage />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/communities/new" element={<NewCommunity />} />
            <Route path="/communities/:id" element={<CommunityDashboard />} /> 

            <Route 
              path="/manager" 
              element={user?.acccountType === 'manager' ? <ManagerDashboard /> : <Navigate to="/today" replace />} 
            /> {/* manager-only page; accessible by URL but only linked in sidebar for managers */}
          </Route>

          {/* Fallback Route */}
          <Route
            path="*"
            element={<Navigate to={user ? '/today' : '/'} replace />}
          />
        </ Routes>
      </ BrowserRouter>
  )
}

export default App
