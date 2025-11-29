import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeDatabase } from '@/lib/database';
import './index.css';

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
