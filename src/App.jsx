import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useAuthContext } from './auth/useAuthContext'

// pages & components
import Navbar from './components/Navbar'
import Home from './pages/Home'
import LandingPage from './pages/LandingPage'
// auth pages
import Login from './auth/Login.jsx'
import Signup from './auth/Signup.jsx'

// styles for the habit feature (Navbar / dashboard layout)
import './habits.css'

function App() {
  const { user } = useAuthContext()

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route
            path="/dashboard"
            element={user ? (
              <>
                <Navbar />
                <div className="pages">
                  <Home />
                </div>
              </>
            ) : (
              <Navigate to="/login" />
            )}
          />

          <Route path="/login" element={!user ? <><Navbar /><Login /></> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!user ? <><Navbar /><Signup /></> : <Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
