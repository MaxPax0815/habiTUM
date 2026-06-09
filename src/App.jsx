import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Button from '@mui/material/Button';
// pages & components
import Home from './pages/Home'
import Navbar from './components/Navbar'

function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <div className="pages">
          <Button variant="contained" color="primary">
            Material UI Example Button
          </Button>
          <Routes>
            <Route 
              path="/" 
              element={<Home />} 
            />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
