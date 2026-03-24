import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './styles/common.css'
import './styles/landing.css'
import './styles/dashboard.css'
import './styles/main.css'
import './styles/detail.css'
import './styles/celebration.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
