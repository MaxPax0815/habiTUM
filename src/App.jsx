import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthContext } from './auth/useAuthContext'

// Layouts
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout.jsx'
import PublicLayout from './layouts/PublicLayout.jsx'

// App pages 
import Communities from './pages/app/Communities'
import CommunityDashboard from './pages/app/CommunityDashboard'
import CommunityUpdatesPage from './pages/app/CommunityUpdatesPage'
import Home from './pages/app/Home'
import ManagerDashboard from './pages/app/ManagerDashboard'
import ManagerCommunity from './pages/app/ManagerCommunity'
import Profile from './pages/app/Profile'
import Progress from './pages/app/Progress'
import ChallengePage from './challenges/ChallengePage.jsx'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import Login from './pages/public/Login.jsx'
import Signup from './pages/public/Signup.jsx'
import ForgotPassword from './pages/public/ForgotPassword.jsx'
import ResetPassword from './pages/public/ResetPassword.jsx'

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
                element={!user ? <Signup /> : <Navigate to="/today" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Route>
          </Route>

          {/* Proctected app pages */}
          <Route element={user ? <AppLayout user={user} /> : <Navigate to="/login" replace />}>
            <Route path="/today" element={<Home />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/challenges/:challengeId" element={<ChallengePage />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/communities/:id/updates" element={<CommunityUpdatesPage />} />
            <Route path="/communities/:id" element={<CommunityDashboard />} /> 

            <Route
              path="/manager"
              element={user?.accountType === 'manager' ? <ManagerDashboard /> : <Navigate to="/today" replace />}
            /> {/* manager-only page; accessible by URL but only linked in sidebar for managers */}
            <Route
              path="/manager/communities/:id"
              element={user?.accountType === 'manager' ? <ManagerCommunity /> : <Navigate to="/today" replace />}
            /> {/* community detail opened from the manager dashboard; same manager-only guard */}
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
