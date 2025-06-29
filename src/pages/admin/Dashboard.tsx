import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Users, 
  Mail, 
  Star, 
  TrendingUp, 
  ShoppingBag,
  MessageSquare,
  Eye,
  DollarSign,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { exportToPDF, exportToCSV, formatCurrency, formatDate } from '../../lib/exportUtils';

interface DashboardStats {
  totalProducts: number;
  totalContacts: number;
  totalSubscribers: number;
  totalReviews: number;
  unreadContacts: number;
  featuredProducts: number;
  averageRating: number;
  recentActivity: ActivityItem[];
  monthlyGrowth: {
    products: number;
    subscribers: number;
    reviews: number;
    contacts: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'product' | 'review' | 'contact' | 'subscription';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
}

interface DetailedReport {
  revenue: { month: string; amount: number; }[];
  topProducts: { name: string; sales: number; revenue: number; }[];
  customerMetrics: { newCustomers: number; returningCustomers: number; churnRate: number; };
  conversionFunnel: { stage: string; count: number; rate: number; }[];
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalContacts: 0,
    totalSubscribers: 0,
    totalReviews: 0,
    unreadContacts: 0,
    featuredProducts: 0,
    averageRating: 0,
    recentActivity: [],
    monthlyGrowth: {
      products: 0,
      subscribers: 0,
      reviews: 0,
      contacts: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [activityDateFilter, setActivityDateFilter] = useState('');
  const [detailedReport, setDetailedReport] = useState<DetailedReport | null>(null);
  const [allActivity, setAllActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch basic stats
      const [
        productsResponse,
        contactsResponse,
        subscribersResponse,
        reviewsResponse,
        unreadContactsResponse,
        featuredProductsResponse
      ] = await Promise.all([
        supabase.from('products').select('id, created_at', { count: 'exact' }),
        supabase.from('contacts').select('id, created_at', { count: 'exact' }),
        supabase.from('subscriptions').select('id, created_at', { count: 'exact' }).eq('active', true),
        supabase.from('reviews').select('id, rating, created_at', { count: 'exact' }),
        supabase.from('contacts').select('id', { count: 'exact' }).eq('read', false),
        supabase.from('products').select('id', { count: 'exact' }).eq('featured', true)
      ]);

      // Calculate average rating
      const reviews = reviewsResponse.data || [];
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      // Calculate monthly growth
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      
      const monthlyGrowth = {
        products: calculateGrowth(productsResponse.data || [], lastMonth),
        subscribers: calculateGrowth(subscribersResponse.data || [], lastMonth),
        reviews: calculateGrowth(reviews, lastMonth),
        contacts: calculateGrowth(contactsResponse.data || [], lastMonth)
      };

      // Generate recent activity
      const recentActivity = generateRecentActivity([
        ...(productsResponse.data || []).slice(0, 3).map(item => ({
          ...item,
          type: 'product' as const,
          title: 'New Product Added',
          description: 'A new product was added to the catalog',
          icon: Package
        })),
        ...(reviewsResponse.data || []).slice(0, 3).map(item => ({
          ...item,
          type: 'review' as const,
          title: 'New Review Received',
          description: `${item.rating}-star review submitted`,
          icon: Star
        })),
        ...(contactsResponse.data || []).slice(0, 2).map(item => ({
          ...item,
          type: 'contact' as const,
          title: 'New Contact Message',
          description: 'Customer inquiry received',
          icon: MessageSquare
        }))
      ]);

      // Generate all activity for the modal
      const allActivityData = generateRecentActivity([
        ...(productsResponse.data || []).map(item => ({
          ...item,
          type: 'product' as const,
          title: 'Product Added',
          description: 'New product added to catalog',
          icon: Package
        })),
        ...(reviewsResponse.data || []).map(item => ({
          ...item,
          type: 'review' as const,
          title: 'Review Received',
          description: `${item.rating}-star review submitted`,
          icon: Star
        })),
        ...(contactsResponse.data || []).map(item => ({
          ...item,
          type: 'contact' as const,
          title: 'Contact Message',
          description: 'Customer inquiry received',
          icon: MessageSquare
        })),
        ...(subscribersResponse.data || []).map(item => ({
          ...item,
          type: 'subscription' as const,
          title: 'New Subscription',
          description: 'User subscribed to newsletter',
          icon: Users
        }))
      ]);

      setStats({
        totalProducts: productsResponse.count || 0,
        totalContacts: contactsResponse.count || 0,
        totalSubscribers: subscribersResponse.count || 0,
        totalReviews: reviewsResponse.count || 0,
        unreadContacts: unreadContactsResponse.count || 0,
        featuredProducts: featuredProductsResponse.count || 0,
        averageRating,
        recentActivity,
        monthlyGrowth
      });

      setAllActivity(allActivityData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (data: any[], since: Date) => {
    const recentItems = data.filter(item => new Date(item.created_at) >= since);
    const totalItems = data.length;
    const oldItems = totalItems - recentItems.length;
    
    if (oldItems === 0) return recentItems.length > 0 ? 100 : 0;
    return Math.round((recentItems.length / oldItems) * 100);
  };

  const generateRecentActivity = (items: any[]): ActivityItem[] => {
    return items
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, showAllActivity ? items.length : 5)
      .map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        timestamp: item.created_at,
        icon: item.icon
      }));
  };

  const fetchDetailedReport = async () => {
    // Generate mock detailed report data
    const report: DetailedReport = {
      revenue: [
        { month: 'Jan', amount: 45000 },
        { month: 'Feb', amount: 52000 },
        { month: 'Mar', amount: 48000 },
        { month: 'Apr', amount: 61000 },
        { month: 'May', amount: 55000 },
        { month: 'Jun', amount: 67000 }
      ],
      topProducts: [
        { name: 'Premium Wireless Headphones', sales: 245, revenue: 73350 },
        { name: 'Luxury Smart Watch', sales: 189, revenue: 113211 },
        { name: 'Professional Camera', sales: 156, revenue: 202644 },
        { name: 'Designer Sunglasses', sales: 298, revenue: 59302 },
        { name: 'Leather Business Bag', sales: 167, revenue: 66633 }
      ],
      customerMetrics: {
        newCustomers: 1247,
        returningCustomers: 892,
        churnRate: 12.5
      },
      conversionFunnel: [
        { stage: 'Visitors', count: 15420, rate: 100 },
        { stage: 'Product Views', count: 8934, rate: 58 },
        { stage: 'Add to Cart', count: 2156, rate: 14 },
        { stage: 'Checkout', count: 1289, rate: 8.4 },
        { stage: 'Purchase', count: 987, rate: 6.4 }
      ]
    };
    setDetailedReport(report);
    setShowDetailedReport(true);
  };

  const exportDashboardReport = (format: 'pdf' | 'csv') => {
    const data = {
      headers: ['Metric', 'Value', 'Growth'],
      rows: [
        ['Total Products', stats.totalProducts.toString(), `+${stats.monthlyGrowth.products}%`],
        ['Active Subscribers', stats.totalSubscribers.toString(), `+${stats.monthlyGrowth.subscribers}%`],
        ['Total Reviews', stats.totalReviews.toString(), `+${stats.monthlyGrowth.reviews}%`],
        ['Contact Messages', stats.totalContacts.toString(), `+${stats.monthlyGrowth.contacts}%`],
        ['Average Rating', stats.averageRating.toFixed(1), '+0.2'],
        ['Featured Products', stats.featuredProducts.toString(), 'N/A'],
        ['Unread Messages', stats.unreadContacts.toString(), 'N/A']
      ],
      title: 'Dashboard Report',
      filename: 'dashboard_report'
    };

    if (format === 'pdf') {
      exportToPDF(data);
    } else {
      exportToCSV(data);
    }
  };

  const filteredActivity = allActivity.filter(activity => {
    if (!activityDateFilter) return true;
    const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
    return activityDate === activityDateFilter;
  });

  const statCards = [
    {
      title: 'Total Revenue',
      value: '$24,580',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      change: '+12.5%',
      trend: 'up'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      change: `+${stats.monthlyGrowth.products}%`,
      trend: stats.monthlyGrowth.products > 0 ? 'up' : 'down'
    },
    {
      title: 'Active Subscribers',
      value: stats.totalSubscribers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      change: `+${stats.monthlyGrowth.subscribers}%`,
      trend: stats.monthlyGrowth.subscribers > 0 ? 'up' : 'down'
    },
    {
      title: 'Avg. Rating',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      change: '+0.2',
      trend: 'up'
    },
    {
      title: 'Contact Messages',
      value: stats.totalContacts,
      icon: MessageSquare,
      color: 'from-indigo-500 to-indigo-600',
      change: `+${stats.monthlyGrowth.contacts}%`,
      trend: stats.monthlyGrowth.contacts > 0 ? 'up' : 'down',
      badge: stats.unreadContacts > 0 ? stats.unreadContacts : undefined
    },
    {
      title: 'Monthly Visitors',
      value: '12.4K',
      icon: Activity,
      color: 'from-pink-500 to-pink-600',
      change: '+8.2%',
      trend: 'up'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
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
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome back! Here's what's happening with your showcase.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button variant="outline" icon={Calendar}>
            Last 30 days
          </Button>
          <div className="relative">
            <Button 
              icon={Download}
              onClick={() => {
                const dropdown = document.getElementById('export-dropdown');
                dropdown?.classList.toggle('hidden');
              }}
            >
              Export Report
            </Button>
            <div id="export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                <button
                  onClick={() => exportDashboardReport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => exportDashboardReport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                {stat.badge && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stat.badge}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                <div className="flex items-center space-x-1">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <p className={`text-sm ${
                    stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.change} from last month
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Activity Overview
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                icon={PieChart}
                onClick={fetchDetailedReport}
              >
                View Details
              </Button>
            </div>
            
            {/* Simple visualization */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalProducts}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Products</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.totalSubscribers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Subscribers</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalReviews}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reviews</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                icon={Eye}
                onClick={() => setShowAllActivity(true)}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <activity.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {stats.recentActivity.length === 0 && (
              <div className="text-center py-8">
                <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  No recent activity
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Add Product', icon: Package, href: '/admin/products/new', color: 'from-blue-500 to-blue-600' },
            { title: 'View Messages', icon: MessageSquare, href: '/admin/contacts', color: 'from-green-500 to-green-600' },
            { title: 'Manage Reviews', icon: Star, href: '/admin/reviews', color: 'from-yellow-500 to-yellow-600' },
            { title: 'Analytics', icon: BarChart3, href: '/admin/analytics', color: 'from-purple-500 to-purple-600' }
          ].map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
            >
              <Link to={action.href}>
                <Card hover className="p-6 cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 bg-gradient-to-r ${action.color} rounded-xl group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quick access
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Detailed Report Modal */}
      {showDetailedReport && detailedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailedReport(false)}></div>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Detailed Analytics Report
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetailedReport(false)}
                    icon={X}
                  >
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <Card className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h4>
                    <div className="space-y-2">
                      {detailedReport.revenue.map((item, index) => (
                        <div key={item.month} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.month}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Top Products */}
                  <Card className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Top Products</h4>
                    <div className="space-y-2">
                      {detailedReport.topProducts.map((product, index) => (
                        <div key={product.name} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{product.sales} sales</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">{formatCurrency(product.revenue)}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Customer Metrics */}
                  <Card className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Customer Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">New Customers</span>
                        <span className="font-medium text-gray-900 dark:text-white">{detailedReport.customerMetrics.newCustomers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Returning Customers</span>
                        <span className="font-medium text-gray-900 dark:text-white">{detailedReport.customerMetrics.returningCustomers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Churn Rate</span>
                        <span className="font-medium text-red-600 dark:text-red-400">{detailedReport.customerMetrics.churnRate}%</span>
                      </div>
                    </div>
                  </Card>

                  {/* Conversion Funnel */}
                  <Card className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Conversion Funnel</h4>
                    <div className="space-y-2">
                      {detailedReport.conversionFunnel.map((stage, index) => (
                        <div key={stage.stage} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{stage.stage}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{stage.count.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full" 
                              style={{ width: `${stage.rate}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">{stage.rate}%</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Activity Modal */}
      {showAllActivity && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAllActivity(false)}></div>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    All Recent Activity
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllActivity(false)}
                    icon={X}
                  >
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
                
                <div className="mb-4">
                  <Input
                    type="date"
                    label="Filter by Date"
                    value={activityDateFilter}
                    onChange={(e) => setActivityDateFilter(e.target.value)}
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3">
                  {filteredActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <activity.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredActivity.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      No activity found for the selected date
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};