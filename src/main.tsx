import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PerformanceMonitor } from './components/monitoring/PerformanceMonitor.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PerformanceMonitor />
  </StrictMode>
);