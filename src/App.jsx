import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthContext } from './auth/useAuthContext'

// Layouts
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout.jsx'
import PublicLayout from './layouts/PublicLayout.jsx'

// App pages 
import Communities from './pages/app/Communities'
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
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>
          </Route>
          <Route element={user ? <AppLayout user={user} /> : <Navigate to="/login" />}>
          <Route path="/today" element={<Home />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/challenges/:challengeId" element={<ChallengePage />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/manager" element={<ManagerDashboard />} />
        </Route>
        </ Routes>
      </ BrowserRouter>
  )
}

export default App
