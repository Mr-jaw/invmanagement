import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  ShoppingCart, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { exportToPDF, exportToCSV } from '../../lib/exportUtils';

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  bounceRate: number;
  avgSessionDuration: string;
  topPages: { page: string; views: number; }[];
  trafficSources: { source: string; percentage: number; color: string; }[];
  deviceBreakdown: { device: string; percentage: number; }[];
}

interface FilterOptions {
  dateRange: string;
  metric: string;
  source: string;
}

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: '7d',
    metric: 'all',
    source: 'all'
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    pageViews: 0,
    uniqueVisitors: 0,
    conversionRate: 0,
    bounceRate: 0,
    avgSessionDuration: '0:00',
    topPages: [],
    trafficSources: [],
    deviceBreakdown: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, filters]);

  const fetchAnalyticsData = () => {
    setLoading(true);
    
    // Simulate API call with mock data
    setTimeout(() => {
      setAnalyticsData({
        pageViews: 24580,
        uniqueVisitors: 18420,
        conversionRate: 3.2,
        bounceRate: 42.1,
        avgSessionDuration: '2:34',
        topPages: [
          { page: '/products', views: 8420 },
          { page: '/', views: 6180 },
          { page: '/about', views: 3240 },
          { page: '/contact', views: 2180 },
          { page: '/products/premium-headphones', views: 1840 }
        ],
        trafficSources: [
          { source: 'Organic Search', percentage: 45, color: 'from-blue-500 to-blue-600' },
          { source: 'Direct', percentage: 30, color: 'from-green-500 to-green-600' },
          { source: 'Social Media', percentage: 15, color: 'from-purple-500 to-purple-600' },
          { source: 'Referral', percentage: 10, color: 'from-yellow-500 to-yellow-600' }
        ],
        deviceBreakdown: [
          { device: 'Desktop', percentage: 55 },
          { device: 'Mobile', percentage: 35 },
          { device: 'Tablet', percentage: 10 }
        ]
      });
      setLoading(false);
    }, 1000);
  };

  const exportAnalytics = (format: 'pdf' | 'csv') => {
    const data = {
      headers: ['Metric', 'Value'],
      rows: [
        ['Page Views', analyticsData.pageViews.toLocaleString()],
        ['Unique Visitors', analyticsData.uniqueVisitors.toLocaleString()],
        ['Conversion Rate', `${analyticsData.conversionRate}%`],
        ['Bounce Rate', `${analyticsData.bounceRate}%`],
        ['Avg Session Duration', analyticsData.avgSessionDuration],
        ['', ''], // Empty row
        ['Top Pages', ''],
        ...analyticsData.topPages.map(page => [page.page, page.views.toLocaleString()]),
        ['', ''], // Empty row
        ['Traffic Sources', ''],
        ...analyticsData.trafficSources.map(source => [source.source, `${source.percentage}%`]),
        ['', ''], // Empty row
        ['Device Breakdown', ''],
        ...analyticsData.deviceBreakdown.map(device => [device.device, `${device.percentage}%`])
      ],
      title: `Analytics Report (${timeRange})`,
      filename: 'analytics_report'
    };

    if (format === 'pdf') {
      exportToPDF(data);
    } else {
      exportToCSV(data);
    }
  };

  const applyFilters = () => {
    setTimeRange(filters.dateRange);
    setShowFilters(false);
    fetchAnalyticsData();
  };

  const resetFilters = () => {
    setFilters({
      dateRange: '7d',
      metric: 'all',
      source: 'all'
    });
    setTimeRange('7d');
    fetchAnalyticsData();
  };

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const keyMetrics = [
    {
      title: 'Page Views',
      value: analyticsData.pageViews.toLocaleString(),
      icon: Eye,
      color: 'from-blue-500 to-blue-600',
      change: '+12.5%'
    },
    {
      title: 'Unique Visitors',
      value: analyticsData.uniqueVisitors.toLocaleString(),
      icon: Users,
      color: 'from-green-500 to-green-600',
      change: '+8.2%'
    },
    {
      title: 'Conversion Rate',
      value: `${analyticsData.conversionRate}%`,
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      change: '+0.3%'
    },
    {
      title: 'Bounce Rate',
      value: `${analyticsData.bounceRate}%`,
      icon: TrendingUp,
      color: 'from-red-500 to-red-600',
      change: '-2.1%'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-64"></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your website performance and user engagement
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <Button 
            variant="outline" 
            icon={Filter}
            onClick={() => setShowFilters(true)}
          >
            Filters
          </Button>
          <div className="relative">
            <Button 
              icon={Download}
              onClick={() => {
                const dropdown = document.getElementById('analytics-export-dropdown');
                dropdown?.classList.toggle('hidden');
              }}
            >
              Export
            </Button>
            <div id="analytics-export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                <button
                  onClick={() => exportAnalytics('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => exportAnalytics('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {metric.change}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Traffic Sources
              </h2>
              <Button variant="ghost" size="sm" icon={PieChart}>
                View Details
              </Button>
            </div>
            
            <div className="space-y-4">
              {analyticsData.trafficSources.map((source, index) => (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {source.source}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {source.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.percentage}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                      className={`h-2 rounded-full bg-gradient-to-r ${source.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Top Pages
              </h2>
              <Button variant="ghost" size="sm" icon={BarChart3}>
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {analyticsData.topPages.map((page, index) => (
                <motion.div
                  key={page.page}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {page.page}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {page.views.toLocaleString()} views
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Device Breakdown & Session Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Device Breakdown
            </h2>
            
            <div className="space-y-4">
              {analyticsData.deviceBreakdown.map((device, index) => (
                <div key={device.device} className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {device.device}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${device.percentage}%` }}
                        transition={{ delay: 0.7 + index * 0.1, duration: 0.8 }}
                        className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right">
                      {device.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Session Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Session Information
            </h2>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {analyticsData.avgSessionDuration}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Average Session Duration
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    2.4
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Pages per Session
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    68%
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Returning Visitors
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Real-time Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Real-time Activity
            </h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                24
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                156
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Page Views (Last Hour)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                8
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowFilters(false)}></div>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Advanced Filters
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    icon={X}
                  >
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date Range
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      {timeRanges.map(range => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Metric Focus
                    </label>
                    <select
                      value={filters.metric}
                      onChange={(e) => setFilters({ ...filters, metric: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Metrics</option>
                      <option value="traffic">Traffic Only</option>
                      <option value="conversion">Conversion Only</option>
                      <option value="engagement">Engagement Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Traffic Source
                    </label>
                    <select
                      value={filters.source}
                      onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Sources</option>
                      <option value="organic">Organic Search</option>
                      <option value="direct">Direct</option>
                      <option value="social">Social Media</option>
                      <option value="referral">Referral</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};