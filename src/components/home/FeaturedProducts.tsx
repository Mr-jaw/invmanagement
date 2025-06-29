import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../products/ProductCard';
import { Button } from '../ui/Button';
import { useCachedFeaturedProducts } from '../../hooks/useCache';

export const FeaturedProducts: React.FC = () => {
  const { data: products, loading, error } = useCachedFeaturedProducts();

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

  if (error) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load featured products</p>
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
          {products?.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
            />
          )) || []}
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