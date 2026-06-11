import { BrowserRouter, Routes, Route } from 'react-router-dom'

// pages & components
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import Navbar from './components/Navbar'

// styles for the habit feature (Navbar / dashboard layout)
import './habits.css'

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* public marketing page — the new structural shell pulled from dev */}
          <Route path="/" element={<LandingPage />} />

          {/* the habit dashboard (yesterday's feature work) */}
          <Route
            path="/dashboard"
            element={
              <>
                <Navbar />
                <div className="pages">
                  <Home />
                </div>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
