import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { exportToPDF, exportToCSV, formatCurrency, formatDate } from '../../lib/exportUtils';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  price: number;
  images: string[];
}

interface InventoryLog {
  id: string;
  product_id: string;
  change_type: 'restock' | 'sale' | 'adjustment' | 'return';
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_at: string;
  products?: { name: string; sku: string | null };
}

interface LowStockAlert {
  id: string;
  product_id: string;
  threshold: number;
  current_stock: number;
  alert_sent: boolean;
  resolved: boolean;
  created_at: string;
  products?: { name: string; sku: string | null };
}

interface StockAdjustment {
  productId: string;
  newQuantity: number;
  changeType: 'restock' | 'adjustment' | 'return';
  reason: string;
}

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState<StockAdjustment>({
    productId: '',
    newQuantity: 0,
    changeType: 'adjustment',
    reason: ''
  });
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    const isRefresh = !loading;
    if (isRefresh) setRefreshing(true);
    
    try {
      // Fetch products with inventory data
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, low_stock_threshold, track_inventory, price, images')
        .eq('track_inventory', true)
        .order('name');

      if (productsError) throw productsError;

      // Fetch recent inventory logs
      const { data: logsData, error: logsError } = await supabase
        .from('inventory_logs')
        .select(`
          *,
          products (name, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Fetch low stock alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('low_stock_alerts')
        .select(`
          *,
          products (name, sku)
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      setProducts(productsData || []);
      setInventoryLogs(logsData || []);
      setLowStockAlerts(alertsData || []);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setAdjustmentLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: adjustmentData.newQuantity })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      // Refresh data
      await fetchInventoryData();
      
      // Reset form
      setShowAdjustmentModal(false);
      setSelectedProduct(null);
      setAdjustmentData({
        productId: '',
        newQuantity: 0,
        changeType: 'adjustment',
        reason: ''
      });
    } catch (error) {
      console.error('Error adjusting stock:', error);
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('low_stock_alerts')
        .update({ resolved: true })
        .eq('id', alertId);

      if (error) throw error;
      
      setLowStockAlerts(alerts => alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const openAdjustmentModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentData({
      productId: product.id,
      newQuantity: product.stock_quantity,
      changeType: 'adjustment',
      reason: ''
    });
    setShowAdjustmentModal(true);
  };

  const exportInventory = (format: 'pdf' | 'csv') => {
    const data = {
      headers: ['Product Name', 'SKU', 'Stock Quantity', 'Threshold', 'Status', 'Value'],
      rows: filteredProducts.map(product => {
        const isLowStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
        const isOutOfStock = product.stock_quantity === 0;
        const status = isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock';
        
        return [
          product.name,
          product.sku || 'N/A',
          product.stock_quantity.toString(),
          product.low_stock_threshold.toString(),
          status,
          formatCurrency(product.stock_quantity * product.price)
        ];
      }),
      title: 'Inventory Report',
      filename: 'inventory_report'
    };

    if (format === 'pdf') {
      exportToPDF(data);
    } else {
      exportToCSV(data);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'low_stock' && product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0) ||
      (filterStatus === 'out_of_stock' && product.stock_quantity === 0);

    return matchesSearch && matchesFilter;
  });

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-32"></div>
            ))}
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
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track stock levels and manage inventory across all products
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="relative">
            <Button 
              variant="outline" 
              icon={Download}
              onClick={() => {
                const dropdown = document.getElementById('inventory-export-dropdown');
                dropdown?.classList.toggle('hidden');
              }}
            >
              Export
            </Button>
            <div id="inventory-export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                <button
                  onClick={() => exportInventory('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => exportInventory('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
          <Button 
            onClick={fetchInventoryData} 
            icon={RefreshCw}
            loading={refreshing}
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Products',
            value: totalProducts,
            icon: Package,
            color: 'from-blue-500 to-blue-600'
          },
          {
            title: 'Low Stock Items',
            value: lowStockCount,
            icon: AlertTriangle,
            color: 'from-yellow-500 to-yellow-600'
          },
          {
            title: 'Out of Stock',
            value: outOfStockCount,
            icon: TrendingDown,
            color: 'from-red-500 to-red-600'
          },
          {
            title: 'Inventory Value',
            value: formatCurrency(totalValue),
            icon: BarChart3,
            color: 'from-green-500 to-green-600'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                Low Stock Alerts
              </h2>
              <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-1 rounded-full text-sm">
                {lowStockAlerts.length} alerts
              </span>
            </div>
            
            <div className="space-y-3">
              {lowStockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {alert.products?.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Stock: {alert.current_stock} (Threshold: {alert.threshold})
                        {alert.products?.sku && ` • SKU: ${alert.products.sku}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAlert(alert.id)}
                    icon={CheckCircle}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Input
          placeholder="Search products or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          className="flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Products</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
                  const isOutOfStock = product.stock_quantity === 0;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={product.images[0] || 'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg'}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {product.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.stock_quantity}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Threshold: {product.low_stock_threshold}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : isLowStock
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(product.stock_quantity * product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustmentModal(product)}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Recent Inventory Activity
          </h2>
          
          <div className="space-y-4">
            {inventoryLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    log.change_type === 'restock' ? 'bg-green-100 dark:bg-green-900/20' :
                    log.change_type === 'sale' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    log.change_type === 'return' ? 'bg-purple-100 dark:bg-purple-900/20' :
                    'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {log.change_type === 'restock' ? (
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : log.change_type === 'sale' ? (
                      <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {log.products?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {log.change_type === 'restock' ? 'Restocked' : 
                       log.change_type === 'sale' ? 'Sale' :
                       log.change_type === 'return' ? 'Return' : 'Adjustment'}: 
                      {log.quantity_change > 0 ? '+' : ''}{log.quantity_change} units
                      {log.reason && ` • ${log.reason}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.previous_stock} → {log.new_stock}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustmentModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleStockAdjustment} className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Adjust Stock - {selectedProduct.name}
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Stock</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedProduct.stock_quantity} units
                    </p>
                  </div>

                  <Input
                    label="New Quantity"
                    type="number"
                    min="0"
                    value={adjustmentData.newQuantity}
                    onChange={(e) => setAdjustmentData(prev => ({ 
                      ...prev, 
                      newQuantity: parseInt(e.target.value) || 0 
                    }))}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Change Type
                    </label>
                    <select
                      value={adjustmentData.changeType}
                      onChange={(e) => setAdjustmentData(prev => ({ 
                        ...prev, 
                        changeType: e.target.value as any 
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="restock">Restock</option>
                      <option value="adjustment">Adjustment</option>
                      <option value="return">Return</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason
                    </label>
                    <textarea
                      value={adjustmentData.reason}
                      onChange={(e) => setAdjustmentData(prev => ({ 
                        ...prev, 
                        reason: e.target.value 
                      }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Reason for stock adjustment..."
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Change: {adjustmentData.newQuantity - selectedProduct.stock_quantity > 0 ? '+' : ''}
                      {adjustmentData.newQuantity - selectedProduct.stock_quantity} units
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdjustmentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={adjustmentLoading}
                  >
                    Update Stock
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};