import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeDatabase } from '@/lib/database';
import { registerSW } from 'virtual:pwa-register';
import { Buffer } from 'buffer';
import './index.css';

// Polyfill Buffer for isomorphic-git
window.Buffer = Buffer;

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      console.log('New version available, please refresh');
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('✅ Database initialized');
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error);
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
