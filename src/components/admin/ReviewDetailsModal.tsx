import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  CheckCircle, 
  Shield, 
  AlertTriangle, 
  Trash2, 
  User, 
  Calendar, 
  Package, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Eye,
  Check,
  Mail
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Review {
  id: string;
  product_id: string;
  author_name: string;
  author_email: string;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
  products?: {
    name: string;
    price: number;
    images: string[];
  };
}

interface ReviewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onReviewUpdate: (updatedReview: Review) => void;
  onReviewDelete: (reviewId: string) => void;
}

export const ReviewDetailsModal: React.FC<ReviewDetailsModalProps> = ({
  isOpen,
  onClose,
  review,
  onReviewUpdate,
  onReviewDelete
}) => {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Close modal on ESC key press
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const logAdminAction = async (actionType: string, reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('admin_actions')
        .insert([{
          action_type: actionType,
          review_id: reviewId,
          admin_email: user.email,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const toggleVerified = async () => {
    if (!review) return;
    
    setLoading(true);
    try {
      const newVerifiedStatus = !review.verified;
      
      const { error } = await supabase
        .from('reviews')
        .update({ verified: newVerifiedStatus })
        .eq('id', review.id);

      if (error) throw error;
      
      // Log admin action
      await logAdminAction(newVerifiedStatus ? 'verify_review' : 'unverify_review', review.id);
      
      // Update the review in parent component
      const updatedReview = {
        ...review,
        verified: newVerifiedStatus
      };
      
      onReviewUpdate(updatedReview);
      
      // Show success feedback
      console.log(`Review ${newVerifiedStatus ? 'verified and published' : 'unverified and unpublished'} successfully`);
    } catch (error) {
      console.error('Error updating review status:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async () => {
    if (!review) return;
    
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', review.id);

      if (error) throw error;
      
      // Log admin action
      await logAdminAction('delete_review', review.id);
      
      // Notify parent component
      onReviewDelete(review.id);
      
      // Close modal
      onClose();
      
      console.log('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReplyViaEmail = () => {
    if (!review) return;
    
    const subject = `Thank you for your review of ${review.products?.name || 'our product'}`;
    const body = `Hi ${review.author_name},\n\nThank you for taking the time to review ${review.products?.name || 'our product'}. We appreciate your ${review.rating}-star rating and your feedback.\n\n${review.comment ? `Your comment: "${review.comment}"\n\n` : ''}We're glad you chose our product and hope you continue to enjoy it.\n\nBest regards,\nLuxeShowcase Team`;
    const mailtoUrl = `mailto:${review.author_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoUrl;
  };

  const handleViewProduct = () => {
    if (!review) return;
    window.open(`/products/${review.product_id}`, '_blank');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${sizeClasses[size]} ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const getReviewSentiment = (rating: number, comment: string) => {
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing'];
    
    const lowerComment = comment.toLowerCase();
    const hasPositiveWords = positiveWords.some(word => lowerComment.includes(word));
    const hasNegativeWords = negativeWords.some(word => lowerComment.includes(word));
    
    if (rating >= 4 && hasPositiveWords) {
      return { sentiment: 'Very Positive', color: 'text-green-600 dark:text-green-400', icon: ThumbsUp };
    } else if (rating >= 3) {
      return { sentiment: 'Positive', color: 'text-blue-600 dark:text-blue-400', icon: ThumbsUp };
    } else if (rating === 2 || hasNegativeWords) {
      return { sentiment: 'Negative', color: 'text-orange-600 dark:text-orange-400', icon: ThumbsDown };
    } else {
      return { sentiment: 'Very Negative', color: 'text-red-600 dark:text-red-400', icon: ThumbsDown };
    }
  };

  if (!isOpen || !review) return null;

  const sentiment = getReviewSentiment(review.rating, review.comment);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
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
            className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-luxury-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Review by {review.author_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {review.products?.name || 'Product Review'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Status Badge */}
                  {review.verified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      <Shield className="h-4 w-4 mr-1" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Pending
                    </span>
                  )}
                  
                  {/* Close Button */}
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
            <div className="px-6 py-6 space-y-6">
              {/* Reviewer and Product Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reviewer Information */}
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">Reviewer Information</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Name:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">{review.author_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Email:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">{review.author_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Domain:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">@{review.author_email.split('@')[1]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Submitted:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>

                {/* Product Information */}
                {review.products && (
                  <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center space-x-2 mb-3">
                      <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-purple-800 dark:text-purple-200">Product Information</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <img
                        src={review.products.images?.[0] || 'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg'}
                        alt={review.products.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                          {review.products.name}
                        </p>
                        <p className="text-purple-700 dark:text-purple-300 text-sm">
                          ${review.products.price}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Rating and Sentiment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">Customer Rating</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {renderStars(review.rating, 'lg')}
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {review.rating}/5
                    </span>
                  </div>
                </Card>

                <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-200">Sentiment Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {React.createElement(sentiment.icon, {
                      className: `h-5 w-5 ${sentiment.color}`
                    })}
                    <span className={`font-medium ${sentiment.color}`}>
                      {sentiment.sentiment}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Review Content */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Customer Review
                </h3>
                <Card className="p-6 bg-gray-50 dark:bg-gray-700 border-l-4 border-l-primary-500">
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                      "{review.comment}"
                    </p>
                  </div>
                </Card>
              </div>

              {/* Review Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-indigo-800 dark:text-indigo-200">Review Analytics</span>
                  </div>
                  <div className="space-y-1 text-sm text-indigo-700 dark:text-indigo-300">
                    <p>Review ID: {review.id.slice(0, 8)}...</p>
                    <p>Word Count: {review.comment.split(' ').length} words</p>
                    <p>Character Count: {review.comment.length} characters</p>
                  </div>
                </Card>

                <Card className="p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Timeline</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>Submitted: {new Date(review.created_at).toLocaleString()}</p>
                    <p>Status: {review.verified ? 'Published' : 'Pending Verification'}</p>
                    <p>Visibility: {review.verified ? 'Public' : 'Hidden from customers'}</p>
                  </div>
                </Card>
              </div>

              {/* Verification Status */}
              {!review.verified && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Review Awaiting Your Approval
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        This review is currently hidden from customers and will only appear on the product page after you verify and publish it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {review.verified && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Review Published
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        This review is currently visible to customers on the product page and contributes to the overall rating.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleReplyViaEmail}
                    icon={Mail}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Reply via Email
                  </Button>
                  
                  <Button
                    onClick={toggleVerified}
                    loading={loading}
                    variant={review.verified ? 'outline' : 'primary'}
                    icon={review.verified ? X : Check}
                    className={review.verified ? 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20' : ''}
                  >
                    {review.verified ? 'Unpublish' : 'Verify & Publish'}
                  </Button>

                  {review.products && (
                    <Button
                      variant="outline"
                      icon={Package}
                      onClick={handleViewProduct}
                    >
                      View Product
                    </Button>
                  )}
                </div>
                
                <Button
                  onClick={deleteReview}
                  loading={deleteLoading}
                  variant="danger"
                  icon={Trash2}
                  className="sm:ml-3"
                >
                  Delete Review
                </Button>
              </div>
              
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                <p>
                  {review.verified 
                    ? 'Unpublishing will remove this review from the website immediately and it will no longer contribute to the product rating.'
                    : 'Publishing will make this review visible to all customers on the product page and include it in the overall rating calculation.'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};