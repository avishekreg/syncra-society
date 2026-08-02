import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ensurePushServiceWorker } from './lib/pushNotifications'
import './styles.css'

void ensurePushServiceWorker()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
