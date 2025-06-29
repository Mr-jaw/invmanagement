import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  isOnline: boolean;
  connectionType: string;
  memoryUsage?: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    isOnline: navigator.onLine,
    connectionType: 'unknown'
  });
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Monitor performance
    const measurePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        
        setMetrics(prev => ({
          ...prev,
          loadTime: Math.round(loadTime)
        }));

        // Show alert if load time is too high
        if (loadTime > 3000) {
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 5000);
        }
      }
    };

    // Monitor connection
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setMetrics(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        connectionType: connection ? connection.effectiveType : 'unknown'
      }));
    };

    // Monitor memory usage (if available)
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
        }));
      }
    };

    // Initial measurements
    measurePerformance();
    updateConnectionInfo();
    updateMemoryUsage();

    // Event listeners
    window.addEventListener('online', updateConnectionInfo);
    window.addEventListener('offline', updateConnectionInfo);
    
    // Periodic updates
    const interval = setInterval(() => {
      updateMemoryUsage();
    }, 5000);

    return () => {
      window.removeEventListener('online', updateConnectionInfo);
      window.removeEventListener('offline', updateConnectionInfo);
      clearInterval(interval);
    };
  }, []);

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* Performance Alert */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Slow Loading Detected
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Page took {metrics.loadTime}ms to load. Consider optimizing images and scripts.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Monitor Panel */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-4 right-4 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg text-xs"
      >
        <div className="flex items-center space-x-2 mb-2">
          <Activity className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span className="font-medium text-gray-900 dark:text-white">Performance</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Load Time:</span>
            <span className={`font-medium ${
              metrics.loadTime > 3000 ? 'text-red-600' : 
              metrics.loadTime > 1000 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {metrics.loadTime}ms
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Connection:</span>
            <div className="flex items-center space-x-1">
              {metrics.isOnline ? (
                <Wifi className="h-3 w-3 text-green-600" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-600" />
              )}
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.connectionType}
              </span>
            </div>
          </div>
          
          {metrics.memoryUsage && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Memory:</span>
              <span className={`font-medium ${
                metrics.memoryUsage > 80 ? 'text-red-600' : 
                metrics.memoryUsage > 60 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {metrics.memoryUsage}%
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="font-medium text-green-600">Healthy</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};