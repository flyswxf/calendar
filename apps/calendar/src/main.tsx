import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { StorageProvider } from './context/StorageContext'
import { TimerProvider } from './context/TimerContext'

import './styles/base.css'
import './styles/layout.css'
import './styles/components/sidebar-course-reminder.css'
import './styles/components/sidebar-deadline.css'
import './styles/components/sidebar-task.css'
import './styles/components/sidebar-daily-action.css'
import './styles/calendar.css'
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
