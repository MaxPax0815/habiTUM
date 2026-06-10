import { BrowserRouter, Routes, Route } from 'react-router-dom'

// layouts & pages & components 
import AppLayout from './layouts/AppLayout'

import Home from './pages/Home'
import Communities from './pages/Communities'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'

import Sidebar from './components/Sidebar'


function App() {

  return (
    <div className="App">
      <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

