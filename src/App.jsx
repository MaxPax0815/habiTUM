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

// Login/entry redirect per account state:
//   active manager   → manager dashboard
//   pending manager  → plan configuration (must pay first)
//   lapsed manager   → /today (subscription ended: app access as free user, manager features locked)
//   everyone else    → /today
const managerAwareHome = (user) => {
  if (user?.accountType === 'manager') {
    if (user.subscription === 'manager') return '/manager'
    if (user.subscription === 'manager_pending') return '/configure-manager-plan'
  }
  return '/today'
}

// Pending managers have never completed payment — locked out of ALL app pages.
const isPendingManager = (user) =>
  user?.accountType === 'manager' && user?.subscription === 'manager_pending'

// Any manager without an active subscription (pending or lapsed) may (re)configure their plan.
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

              {/* Manager onboarding — two standalone auth-layout steps.
                  Step 1: create the pending account. Step 2: choose plan → Stripe checkout. */}
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

          {/* Protected app pages.
              Pending managers (accountType manager, subscription not active) are
              locked out of ALL app pages until they complete Stripe payment —
              accountType alone must never grant access. */}
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

            {/* Manager dashboard — only active managers. Pending managers are sent
                to /configure-manager-plan to complete payment first. */}
            <Route
              path="/manager"
              element={
                user?.accountType === 'manager' && user?.subscription === 'manager'
                  ? <ManagerDashboard />
                  : <Navigate to={managerAwareHome(user)} replace />
              }
            />
            {/* Community detail opened from the manager dashboard; same active-manager guard. */}
            <Route
              path="/manager/communities/:id"
              element={
                user?.accountType === 'manager' && user?.subscription === 'manager'
                  ? <ManagerCommunity />
                  : <Navigate to={managerAwareHome(user)} replace />
              }
            />
          </Route>

          {/* Fallback Route */}
          <Route
            path="*"
            element={<Navigate to={user ? managerAwareHome(user) : '/'} replace />}
          />
        </ Routes>
      </ BrowserRouter>
  )
}

export default App
