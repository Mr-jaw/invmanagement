import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PerformanceMonitor } from './components/monitoring/PerformanceMonitor.tsx';
import { initializeDropdowns } from './lib/dropdownUtils.ts';
import './index.css';

// Initialize dropdown functionality
initializeDropdowns();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PerformanceMonitor />
  </StrictMode>
);