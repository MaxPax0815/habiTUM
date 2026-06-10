import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HabitsContextProvider } from './context/HabitsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HabitsContextProvider>
      <App />
    </HabitsContextProvider>
  </StrictMode>,
)
