import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="154325619553-16skq2jomkno70n87nnkpptkgipakq9f.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)