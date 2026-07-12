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
import ManagerSignup from './pages/public/ManagerSignup.jsx'
import ConfigureManagerPlan from './pages/public/ConfigureManagerPlan.jsx'
import ForgotPassword from './pages/public/ForgotPassword.jsx'
import ResetPassword from './pages/public/ResetPassword.jsx'
import CheckoutSuccess from './pages/public/CheckoutSuccess.jsx'
import CheckoutCancel from './pages/public/CheckoutCancel.jsx'
import { ImpressumPage, PrivacyPage, TermsPage } from './pages/public/LegalPage.jsx'

// Entry redirect helper: active manager → /manager, pending manager → pay/config, others → /today.
const managerAwareHome = (user) => {
  if (user?.accountType === 'manager') {
    if (user.subscription === 'manager') return '/manager'
    if (user.subscription === 'manager_pending') return '/configure-manager-plan'
  }
  return '/today'
}

// Pending managers have not paid yet, so protected app pages redirect to plan config.
const isPendingManager = (user) =>
  user?.accountType === 'manager' && user?.subscription === 'manager_pending'

// Managers without active manager subscription may open the plan configuration page.
const canConfigureManagerPlan = (user) =>
  user?.accountType === 'manager' && user?.subscription !== 'manager'

function App() {
  const { user } = useAuthContext()

  return (
      <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/datenschutz" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Checkout result pages — user is logged in (just signed up) but not in AppLayout */}
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />

            <Route element={<AuthLayout />}>
              <Route
                path="/login"
                element={!user ? <Login /> : <Navigate to={managerAwareHome(user)} replace />}
              />
              <Route
                path="/signup"
                element={!user ? <Signup /> : <Navigate to="/today" replace />} />

              {/* Manager onboarding: create pending account, then choose plan and pay via Stripe. */}
              <Route
                path="/signup/manager"
                element={!user ? <ManagerSignup /> : <Navigate to={managerAwareHome(user)} replace />}
              />
              <Route
                path="/configure-manager-plan"
                element={
                  !user
                    ? <Navigate to="/" replace />
                    : canConfigureManagerPlan(user)
                      ? <ConfigureManagerPlan />
                      : <Navigate to={managerAwareHome(user)} replace />
                }
              />

              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Route>
          </Route>

          {/* Protected app wall: logged out → landing; unpaid manager → config; otherwise AppLayout. */}
          <Route
            element={
              !user
                ? <Navigate to="/" replace />
                : isPendingManager(user)
                  ? <Navigate to="/configure-manager-plan" replace />
                  : <AppLayout user={user} />
            }
          >
            <Route path="/today" element={<Home />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/challenges/:challengeId" element={<ChallengePage />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/communities/:id/updates" element={<CommunityUpdatesPage />} />
            <Route path="/communities/:id" element={<CommunityDashboard />} />

            {/* Manager dashboard: requires both manager role and active manager subscription. */}
            <Route
              path="/manager"
              element={
                user?.accountType === 'manager' && user?.subscription === 'manager'
                  ? <ManagerDashboard />
                  : <Navigate to={managerAwareHome(user)} replace />
              }
            />
            {/* Manager community detail uses the same active-manager page guard. */}
            <Route
              path="/manager/communities/:id"
              element={
                user?.accountType === 'manager' && user?.subscription === 'manager'
                  ? <ManagerCommunity />
                  : <Navigate to={managerAwareHome(user)} replace />
              }
            />
          </Route>

          {/* Catch-all sends unknown URLs to the right home for the current auth state. */}
          <Route
            path="*"
            element={<Navigate to={user ? managerAwareHome(user) : '/'} replace />}
          />
        </ Routes>
      </ BrowserRouter>
  )
}

export default App
