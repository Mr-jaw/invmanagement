import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  CheckCircle,
  MessageCircle,
  Phone,
  Copy,
  Download,
  Mail
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { InquiryModal } from '../components/ui/InquiryModal';
import { generateProductBrochure } from '../lib/pdfGenerator';
import { useCachedProductDetail, useCachedProductReviews } from '../hooks/useCache';
import { cache, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { supabase } from '../lib/supabase';

interface ReviewFormData {
  author_name: string;
  author_email: string;
  rating: number;
  comment: string;
}

// Configuration for contact information
const CONTACT_CONFIG = {
  phone: '+1 (555) 123-4567',
  whatsapp: '15551234567', // WhatsApp number (without + or spaces)
  email: 'hello@luxeshowcase.com'
};

// Default placeholder image
const DEFAULT_IMAGE = 'https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=800';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, loading: productLoading, error: productError } = useCachedProductDetail(id || '');
  const { data: reviews, loading: reviewsLoading, refetch: refetchReviews } = useCachedProductReviews(id || '');
  
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [reviewFormData, setReviewFormData] = useState<ReviewFormData>({
    author_name: '',
    author_email: '',
    rating: 5,
    comment: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Safe image access helper
  const getProductImages = () => {
    if (!product?.images || !Array.isArray(product.images) || product.images.length === 0) {
      return [DEFAULT_IMAGE];
    }
    return product.images;
  };

  const productImages = getProductImages();

  useEffect(() => {
    if (product?.category_id) {
      fetchRelatedProducts(product.category_id);
    }
  }, [product?.category_id, id]);

  const fetchRelatedProducts = async (categoryId: string) => {
    const cacheKey = CACHE_KEYS.RELATED_PRODUCTS(categoryId);
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      setRelatedProducts(cachedData.filter((p: any) => p.id !== id));
      return;
    }

    setRelatedLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .neq('id', id || '')
        .limit(4);

      if (error) throw error;
      
      // Cache the result
      cache.set(cacheKey, data || [], CACHE_TTL.MEDIUM);
      setRelatedProducts(data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setReviewSubmitting(true);
    try {
      // Submit review as unverified (verified: false by default)
      const { error } = await supabase
        .from('reviews')
        .insert([{
          product_id: id,
          ...reviewFormData,
          verified: false // Reviews start as unverified
        }]);

      if (error) throw error;

      setReviewSuccess(true);
      setReviewFormData({
        author_name: '',
        author_email: '',
        rating: 5,
        comment: ''
      });
      setShowReviewForm(false);
      
      // Invalidate reviews cache to show updated count
      cache.delete(CACHE_KEYS.PRODUCT_REVIEWS(id));
      
      // Note: We don't refresh reviews here since unverified reviews won't show
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (!product) return;
    
    const message = `Hi! I'm interested in ${product.name}. Could you please provide more information?`;
    const whatsappUrl = `https://wa.me/${CONTACT_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallNow = () => {
    // Create a more user-friendly call experience
    if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
      // Mobile device - direct call
      window.location.href = `tel:${CONTACT_CONFIG.phone}`;
    } else {
      // Desktop - show call information
      alert(`Call us at: ${CONTACT_CONFIG.phone}\n\nOur business hours:\nMonday - Friday: 9:00 AM - 6:00 PM EST\nSaturday: 10:00 AM - 4:00 PM EST\nSunday: Closed`);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadBrochure = () => {
    if (!product) return;
    
    try {
      generateProductBrochure({
        name: product.name,
        description: product.description,
        price: product.price,
        specifications: product.specifications || {},
        images: productImages
      });
    } catch (error) {
      console.error('Error generating brochure:', error);
      alert('Sorry, there was an error generating the brochure. Please try again later.');
    }
  };

  const handleEmailInquiry = () => {
    if (!product) return;
    
    const subject = `Inquiry about ${product.name}`;
    const body = `Hi,\n\nI'm interested in learning more about ${product.name} (Price: $${product.price}).\n\nCould you please provide additional information about:\n- Availability\n- Shipping options\n- Warranty details\n- Any current promotions\n\nThank you!\n\nBest regards`;
    
    const mailtoUrl = `mailto:${CONTACT_CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={interactive ? 24 : 16}
        className={`${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300 dark:text-gray-600'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive && onRatingChange ? () => onRatingChange(i + 1) : undefined}
      />
    ));
  };

  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const loading = productLoading || reviewsLoading;

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Product Not Found
          </h1>
          <Link to="/products">
            <Button icon={ArrowLeft}>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            to="/products" 
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </motion.div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={productImages[currentImageIndex] || productImages[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? productImages.length - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === productImages.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImageIndex === index
                        ? 'border-primary-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                  {product.categories?.name}
                </span>
                <div className="flex items-center space-x-1">
                  {renderStars(Math.round(averageRating))}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    ({reviews?.length || 0} verified reviews)
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {product.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              ${product.price}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={handleWhatsAppContact}
                  icon={MessageCircle}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  WhatsApp Contact
                </Button>
                <Button 
                  onClick={handleCallNow}
                  icon={Phone}
                  variant="outline"
                >
                  Call Now
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  onClick={handleCopyLink}
                  icon={Copy}
                  variant="outline"
                  className={copySuccess ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400' : ''}
                >
                  {copySuccess ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button 
                  onClick={handleDownloadBrochure}
                  icon={Download}
                  variant="outline"
                >
                  Download Brochure
                </Button>
                <Button 
                  onClick={() => setShowInquiryModal(true)}
                  icon={Mail}
                  variant="secondary"
                >
                  Inquire Now
                </Button>
              </div>

              {/* Email Direct Contact */}
              <div className="pt-2">
                <Button 
                  onClick={handleEmailInquiry}
                  icon={Mail}
                  variant="ghost"
                  className="w-full text-primary-600 dark:text-primary-400"
                >
                  Send Direct Email to {CONTACT_CONFIG.email}
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Free Shipping</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">On orders over $100</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Warranty</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">2 year coverage</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Returns</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">30 day policy</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Specifications */}
        {Object.keys(product.specifications || {}).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <span className="font-medium text-gray-900 dark:text-white">{key}:</span>
                    <span className="text-gray-600 dark:text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Customer Reviews
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {renderStars(Math.round(averageRating))}
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  Based on {reviews?.length || 0} verified reviews
                </span>
              </div>
            </div>
            <Button onClick={() => setShowReviewForm(true)}>
              Write a Review
            </Button>
          </div>

          {/* Review Form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Write Your Review
                  </h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Your Name"
                        value={reviewFormData.author_name}
                        onChange={(e) => setReviewFormData(prev => ({ ...prev, author_name: e.target.value }))}
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={reviewFormData.author_email}
                        onChange={(e) => setReviewFormData(prev => ({ ...prev, author_email: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rating
                      </label>
                      <div className="flex items-center space-x-1">
                        {renderStars(reviewFormData.rating, true, (rating) => 
                          setReviewFormData(prev => ({ ...prev, rating }))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Your Review
                      </label>
                      <textarea
                        value={reviewFormData.comment}
                        onChange={(e) => setReviewFormData(prev => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                        placeholder="Share your experience with this product..."
                        required
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button type="submit" loading={reviewSubmitting}>
                        Submit Review
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowReviewForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {reviewSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                    <p className="text-green-800 dark:text-green-200">
                      Thank you for your review! It will be published after verification by our team.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reviews List - Only verified reviews are shown */}
          <div className="space-y-6">
            {reviews?.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-luxury-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {review.author_name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {renderStars(review.rating)}
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified Purchase
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )) || []}
          </div>

          {(!reviews || reviews.length === 0) && (
            <Card className="p-12 text-center">
              <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Be the first to share your experience with this product
              </p>
              <Button onClick={() => setShowReviewForm(true)}>
                Write the First Review
              </Button>
            </Card>
          )}
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/products/${relatedProduct.id}`}>
                    <Card hover className="p-4 h-full">
                      <img
                        src={relatedProduct.images?.[0] || DEFAULT_IMAGE}
                        alt={relatedProduct.name}
                        className="w-full aspect-square object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        ${relatedProduct.price}
                      </p>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        productName={product.name}
        productId={product.id}
      />
    </div>
  );
};