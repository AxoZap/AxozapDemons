import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Summer2026Page } from './components/Summer2026Page'
import './styles/globals.css'

const normalizedPath = window.location.pathname.replace(/\/+$/, '').toLowerCase()
const isSummerCountdownPage = normalizedPath === '/summer2026'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSummerCountdownPage ? <Summer2026Page /> : <App />}
  </StrictMode>,
)
