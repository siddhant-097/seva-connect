import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import NotFoundPage from './NotFoundPage.jsx'

const isHomePath = window.location.pathname === '/' || window.location.pathname === '/index.html'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        {isHomePath ? <App /> : <NotFoundPage />}
    </StrictMode>,
)
