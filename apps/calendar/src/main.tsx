import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { StorageProvider } from './context/StorageContext'
import { TimerProvider } from './context/TimerProvider'

import './styles/base.css'
import './styles/layout.css'
import './styles/course-reminder.css'
import './styles/calendar.css'
import './styles/todo.css'
import './styles/modals.css'
import './styles/timer.css'
import './styles/responsive.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StorageProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </StorageProvider>
  </React.StrictMode>,
)
