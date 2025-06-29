import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PerformanceMonitor as PerformanceMonitorComponent } from './components/monitoring/PerformanceMonitor.tsx';
import { initializeDropdowns } from './lib/dropdownUtils.ts';
import { addResourceHints, registerServiceWorker, initWebVitals, PerformanceMonitor } from './utils/performance.ts';
import { preloadCriticalData } from './lib/cache.ts';
import './index.css';

// Initialize performance optimizations immediately
addResourceHints();
registerServiceWorker();
initWebVitals();

// Initialize dropdown functionality
initializeDropdowns();

// Performance monitoring
const monitor = PerformanceMonitor.getInstance();
monitor.startTiming('app-initialization');

// Preload critical data in background
preloadCriticalData();

// Optimize React rendering
const root = createRoot(document.getElementById('root')!, {
  // Enable concurrent features for better performance
  identifierPrefix: 'luxe-'
});

root.render(
  <StrictMode>
    <App />
    <PerformanceMonitorComponent />
  </StrictMode>
);

monitor.endTiming('app-initialization');

// Remove loading indicator once app is mounted
setTimeout(() => {
  const loadingElement = document.querySelector('.loading');
  if (loadingElement) {
    loadingElement.remove();
  }
}, 100);