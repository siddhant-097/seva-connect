import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import AdminPage from './AdminPage.jsx'

const isHomePath = window.location.pathname === '/' || window.location.pathname === '/index.html'
const isAdminPath = window.location.pathname === '/admin' || window.location.pathname === '/admin/'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        {isAdminPath ? <AdminPage /> : isHomePath ? <App /> : <NotFoundPage />}
    </StrictMode>,
)
