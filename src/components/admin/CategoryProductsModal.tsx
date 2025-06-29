import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Search, Edit, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock_quantity?: number;
  created_at: string;
}

interface CategoryProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

export const CategoryProductsModal: React.FC<CategoryProductsModalProps> = ({
  isOpen,
  onClose,
  category
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Close modal on ESC key press
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Fetch products when category changes
  useEffect(() => {
    if (category && isOpen) {
      console.log('Fetching products for category:', category.name); // Debug log
      fetchCategoryProducts();
    }
  }, [category, isOpen]);

  const fetchCategoryProducts = async () => {
    if (!category) return;
    
    setLoading(true);
    try {
      console.log('Fetching products for category ID:', category.id); // Debug log
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, images, stock_quantity, created_at')
        .eq('category_id', category.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched products:', data?.length || 0); // Debug log
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching category products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      console.log('Backdrop clicked, closing modal'); // Debug log
      onClose();
    }
  };

  const handleDeleteProduct = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Modal render - isOpen:', isOpen, 'category:', category?.name); // Debug log

  if (!isOpen || !category) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleBackdropClick}
        />
        
        {/* Modal Container */}
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {category.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {products.length} products in this category
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link to="/admin/products/new">
                    <Button
                      size="sm"
                      icon={Plus}
                      onClick={onClose}
                    >
                      Add Product
                    </Button>
                  </Link>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    icon={X}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Search */}
              <div className="mb-6">
                <Input
                  placeholder="Search products in this category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                  className="max-w-md"
                />
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card hover className="p-6 h-full group">
                        <div className="relative">
                          <img
                            src={product.images[0] || 'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg'}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                          />
                          
                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-y-1">
                            <Link to={`/admin/products/${product.id}/edit`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={Edit}
                                className="bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                                onClick={onClose}
                              >
                                <span className="sr-only">Edit</span>
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Trash2}
                              onClick={(e) => handleDeleteProduct(product.id, e)}
                              className="bg-white/90 hover:bg-red-50 text-red-600 shadow-sm"
                            >
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                              ${product.price}
                            </span>
                            {product.stock_quantity !== undefined && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Stock: {product.stock_quantity}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Added: {new Date(product.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchTerm ? 'No products found' : 'No products in this category'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : 'Products assigned to this category will appear here.'
                    }
                  </p>
                  <Link to="/admin/products/new">
                    <Button icon={Plus} onClick={onClose}>
                      Add First Product
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {filteredProducts.length} of {products.length} products
                  {searchTerm && ` matching "${searchTerm}"`}
                </div>
                <div className="flex items-center space-x-3">
                  <Link to="/admin/categories">
                    <Button variant="outline" onClick={onClose}>
                      Manage Categories
                    </Button>
                  </Link>
                  <Link to="/admin/products">
                    <Button onClick={onClose}>
                      View All Products
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};