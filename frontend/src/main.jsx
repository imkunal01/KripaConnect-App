import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ShopProvider } from './context/ShopContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <ShopProvider>
            <App />
          </ShopProvider>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
)
