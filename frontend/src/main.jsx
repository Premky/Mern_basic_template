import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.jsx'
import { BaseURLProvider } from './Context/BaseURLProvider.jsx'
import { AuthProvider } from './Context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BaseURLProvider>
        <App />
      </BaseURLProvider>
    </AuthProvider>

  </StrictMode>,
)
