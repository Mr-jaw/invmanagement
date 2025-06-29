import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ProductCard } from '../products/ProductCard';
import { Button } from '../ui/Button';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: string;
}

export const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(6);

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        // Fallback to sample data
        setProducts([
          {
            id: '1',
            name: 'Premium Wireless Headphones',
            description: 'Experience crystal-clear audio with our flagship headphones.',
            price: 299,
            images: ['https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg'],
            category_id: '1'
          },
          {
            id: '2',
            name: 'Luxury Smart Watch',
            description: 'Elegance meets technology in this premium timepiece.',
            price: 599,
            images: ['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg'],
            category_id: '2'
          },
          {
            id: '3',
            name: 'Professional Camera',
            description: 'Capture moments with professional-grade precision.',
            price: 1299,
            images: ['https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg'],
            category_id: '3'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-700 rounded-xl p-6 animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover our hand-picked selection of premium products that define excellence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/products">
            <Button size="lg" icon={ArrowRight} iconPosition="right">
              View All Products
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};