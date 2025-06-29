import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Grid, List, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductCard } from '../components/products/ProductCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products and categories
        const [productsResponse, categoriesResponse] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('categories').select('id, name')
        ]);

        if (productsResponse.error) throw productsResponse.error;
        if (categoriesResponse.error) throw categoriesResponse.error;

        setProducts(productsResponse.data || []);
        setCategories(categoriesResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to sample data
        setProducts([
          {
            id: '1',
            name: 'Premium Wireless Headphones',
            description: 'Experience crystal-clear audio with our flagship headphones featuring noise cancellation.',
            price: 299,
            images: ['https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg'],
            category_id: '1'
          },
          {
            id: '2',
            name: 'Luxury Smart Watch',
            description: 'Elegance meets technology in this premium timepiece with health monitoring.',
            price: 599,
            images: ['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg'],
            category_id: '2'
          },
          {
            id: '3',
            name: 'Professional Camera',
            description: 'Capture moments with professional-grade precision and advanced features.',
            price: 1299,
            images: ['https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg'],
            category_id: '3'
          },
          {
            id: '4',
            name: 'Designer Sunglasses',
            description: 'Premium UV protection with sophisticated styling for the modern individual.',
            price: 199,
            images: ['https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg'],
            category_id: '4'
          },
          {
            id: '5',
            name: 'Leather Business Bag',
            description: 'Handcrafted leather briefcase perfect for the professional lifestyle.',
            price: 399,
            images: ['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg'],
            category_id: '5'
          },
          {
            id: '6',
            name: 'Wireless Speaker',
            description: 'Premium sound quality in a compact, portable design with long battery life.',
            price: 149,
            images: ['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg'],
            category_id: '1'
          }
        ]);
        setCategories([
          { id: '1', name: 'Audio' },
          { id: '2', name: 'Wearables' },
          { id: '3', name: 'Photography' },
          { id: '4', name: 'Fashion' },
          { id: '5', name: 'Accessories' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Our Products
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Discover our complete collection of premium products
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              className="w-full sm:w-64"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              icon={Grid}
            >
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              icon={List}
            >
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </motion.div>

        {/* Products Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
              : 'space-y-6'
          }
        >
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              viewMode={viewMode}
            />
          ))}
        </motion.div>

        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};