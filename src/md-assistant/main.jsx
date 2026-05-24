import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './config/microsoft.js'
import { GOOGLE_CLIENT_ID } from './config/google.js'
import MdAssistantApp from './MdAssistantApp.jsx'
import '../index.css'

createRoot(document.getElementById('md-root')).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <MdAssistantApp />
      </GoogleOAuthProvider>
    </MsalProvider>
  </StrictMode>
)
