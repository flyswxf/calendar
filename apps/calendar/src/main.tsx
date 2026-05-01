/**
 * 应用入口
 * 提供 Storage → Timer → App 三层 Provider 嵌套
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StorageProvider } from './context/StorageContext';
import { TimerProvider } from './context/TimerContext';

import './styles/shared.module.css';
import './styles/base.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StorageProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </StorageProvider>
  </React.StrictMode>,
);
