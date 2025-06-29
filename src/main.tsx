import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PerformanceMonitor as PerformanceMonitorComponent } from './components/monitoring/PerformanceMonitor.tsx';
import { initializeDropdowns } from './lib/dropdownUtils.ts';
import { addResourceHints, registerServiceWorker, initWebVitals, PerformanceMonitor } from './utils/performance.ts';
import './index.css';

// Initialize performance optimizations
addResourceHints();
registerServiceWorker();
initWebVitals();

// Initialize dropdown functionality
initializeDropdowns();

// Performance monitoring
const monitor = PerformanceMonitor.getInstance();
monitor.startTiming('app-initialization');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PerformanceMonitorComponent />
  </StrictMode>
);

monitor.endTiming('app-initialization');