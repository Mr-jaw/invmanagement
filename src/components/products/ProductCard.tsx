import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { LazyImage } from '../ui/LazyImage';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ 
  product, 
  index = 0, 
  viewMode = 'grid' 
}) => {
  const renderStars = (rating: number = 5) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/products/${product.id}`} className="block">
        <Card hover className={viewMode === 'list' ? 'flex p-6' : 'p-6 h-full group cursor-pointer'}>
          <div className={viewMode === 'list' ? 'flex-shrink-0 w-48 mr-6' : 'mb-4'}>
            <div className="relative overflow-hidden rounded-lg">
              <LazyImage
                src={product.images[0] || 'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg'}
                alt={product.name}
                className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                  viewMode === 'list' ? 'w-full h-32' : 'w-full aspect-square'
                }`}
              />
            </div>
          </div>
          
          <div className={`space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {product.name}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
              {product.description}
            </p>
            
            <div className="flex items-center space-x-1 mb-2">
              {renderStars()}
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                (4.8)
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ${product.price}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';