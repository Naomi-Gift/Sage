import React from 'react';
import ReactDOM from 'react-dom/client';
import { SageAuthProvider } from './auth/SageAuthProvider';
import { ToastProvider } from './context/ToastContext';
import { App } from './App';
import './styles.css';
import './landing.css';

// Global Buffer & process polyfill for browser Web3 dependencies
if (typeof window !== 'undefined') {
  (window as unknown as { global: typeof globalThis }).global = window;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <SageAuthProvider>
        <App />
      </SageAuthProvider>
    </ToastProvider>
  </React.StrictMode>
);

