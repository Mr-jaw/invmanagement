import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Search, Eye, Trash2, Check, X, Filter, CheckSquare, Square, User, Calendar, Package, Shield, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

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

interface AdminAction {
  id: string;
  action_type: 'verify_review' | 'unverify_review' | 'delete_review';
  review_id: string;
  admin_email: string;
  timestamp: string;
}

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified' | 'pending'>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products (
            name,
            price,
            images
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleVerified = async (id: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ verified: !verified })
        .eq('id', id);

      if (error) throw error;
      
      // Log admin action
      await logAdminAction(!verified ? 'verify_review' : 'unverify_review', id);
      
      setReviews(reviews.map(r => 
        r.id === id ? { ...r, verified: !verified } : r
      ));

      // Update selected review if it's the one being modified
      if (selectedReview?.id === id) {
        setSelectedReview({ ...selectedReview, verified: !verified });
      }

      // Show real-time update notification
      const action = !verified ? 'verified and published' : 'unverified and unpublished';
      console.log(`Review ${action} successfully`);
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Log admin action
      await logAdminAction('delete_review', id);
      
      setReviews(reviews.filter(r => r.id !== id));
      if (selectedReview?.id === id) {
        setSelectedReview(null);
      }
      
      // Remove from selected reviews if it was selected
      setSelectedReviews(prev => prev.filter(reviewId => reviewId !== id));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleReviewClick = (review: Review) => {
    setSelectedReview(review);
  };

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(review => review.id));
    }
  };

  const handleBulkVerify = async () => {
    if (selectedReviews.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ verified: true })
        .in('id', selectedReviews);

      if (error) throw error;

      // Log admin actions for each review
      for (const reviewId of selectedReviews) {
        await logAdminAction('verify_review', reviewId);
      }

      setReviews(reviews.map(r => 
        selectedReviews.includes(r.id) ? { ...r, verified: true } : r
      ));

      setSelectedReviews([]);
      console.log(`${selectedReviews.length} reviews verified and published successfully`);
    } catch (error) {
      console.error('Error bulk verifying reviews:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
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

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.author_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.products?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'verified' && review.verified) ||
      (filterStatus === 'unverified' && !review.verified) ||
      (filterStatus === 'pending' && !review.verified);

    return matchesSearch && matchesFilter;
  });

  // Separate pending reviews (unverified) for priority display
  const pendingReviews = filteredReviews.filter(review => !review.verified);
  const verifiedReviews = filteredReviews.filter(review => review.verified);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 h-24"></div>
              ))}
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Product Reviews Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage customer reviews and control what appears on your website
        </p>
        {pendingReviews.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {pendingReviews.length} Reviews Awaiting Verification
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  These reviews are not visible on the website and require your approval to be published.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reviews List */}
        <div className="lg:col-span-1">
          <div className="space-y-4 mb-4">
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Reviews ({reviews.length})</option>
              <option value="pending">Pending Verification ({pendingReviews.length})</option>
              <option value="verified">Verified ({verifiedReviews.length})</option>
              <option value="unverified">Unverified ({pendingReviews.length})</option>
            </select>

            {/* Bulk Actions */}
            {selectedReviews.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {selectedReviews.length} selected
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedReviews([])}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    Clear
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={handleBulkVerify}
                  loading={bulkActionLoading}
                  icon={Check}
                  className="w-full"
                >
                  Verify & Publish All
                </Button>
              </div>
            )}

            {/* Select All */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {selectedReviews.length === filteredReviews.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>Select All</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Show pending reviews first */}
            {pendingReviews.length > 0 && filterStatus === 'all' && (
              <>
                <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Pending Verification ({pendingReviews.length})
                </div>
                {pendingReviews.map((review) => (
                  <Card
                    key={review.id}
                    className={`p-4 cursor-pointer transition-colors border-l-4 border-l-yellow-500 ${
                      selectedReview?.id === review.id
                        ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleReviewClick(review)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectReview(review.id);
                            }}
                            className="flex-shrink-0"
                          >
                            {selectedReviews.includes(review.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {review.author_name}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            Pending
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {review.products?.name}
                      </p>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {review.comment}
                      </p>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
                
                {verifiedReviews.length > 0 && (
                  <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 mt-4 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Published Reviews ({verifiedReviews.length})
                  </div>
                )}
              </>
            )}

            {/* Show filtered reviews */}
            {(filterStatus !== 'all' ? filteredReviews : verifiedReviews).map((review) => (
              <Card
                key={review.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedReview?.id === review.id
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${!review.verified ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'}`}
                onClick={() => handleReviewClick(review)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectReview(review.id);
                        }}
                        className="flex-shrink-0"
                      >
                        {selectedReviews.includes(review.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {review.author_name}
                      </span>
                      {review.verified ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {review.products?.name}
                  </p>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {review.comment}
                  </p>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-8">
              <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No reviews found
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Review Detail */}
        <div className="lg:col-span-2">
          {selectedReview ? (
            <Card className="p-6">
              <div className="space-y-6">
                {/* Header with Reviewer Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-luxury-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Review by {selectedReview.author_name}
                      </h2>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{selectedReview.author_email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Submitted: {new Date(selectedReview.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedReview.verified ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <Shield className="h-4 w-4 mr-1" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Awaiting Verification
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Information */}
                {selectedReview.products && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img
                      src={selectedReview.products.images?.[0] || 'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg'}
                      alt={selectedReview.products.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedReview.products.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Price: ${selectedReview.products.price}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rating and Sentiment Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200">Customer Rating</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {renderStars(selectedReview.rating, 'lg')}
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedReview.rating}/5
                      </span>
                    </div>
                  </Card>

                  <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Sentiment Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {React.createElement(getReviewSentiment(selectedReview.rating, selectedReview.comment).icon, {
                        className: `h-5 w-5 ${getReviewSentiment(selectedReview.rating, selectedReview.comment).color}`
                      })}
                      <span className={`font-medium ${getReviewSentiment(selectedReview.rating, selectedReview.comment).color}`}>
                        {getReviewSentiment(selectedReview.rating, selectedReview.comment).sentiment}
                      </span>
                    </div>
                  </Card>
                </div>

                {/* Review Content */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Customer Review
                  </h3>
                  <Card className="p-6 bg-gray-50 dark:bg-gray-700 border-l-4 border-l-primary-500">
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                        "{selectedReview.comment}"
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Review Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-purple-800 dark:text-purple-200">Review Details</span>
                    </div>
                    <div className="space-y-1 text-sm text-purple-700 dark:text-purple-300">
                      <p>Review ID: {selectedReview.id.slice(0, 8)}...</p>
                      <p>Word Count: {selectedReview.comment.split(' ').length} words</p>
                      <p>Character Count: {selectedReview.comment.length} characters</p>
                    </div>
                  </Card>

                  <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-800 dark:text-green-200">Reviewer Info</span>
                    </div>
                    <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                      <p>Name: {selectedReview.author_name}</p>
                      <p>Email: {selectedReview.author_email}</p>
                      <p>Domain: @{selectedReview.author_email.split('@')[1]}</p>
                    </div>
                  </Card>
                </div>

                {/* Verification Status */}
                {!selectedReview.verified && (
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

                {selectedReview.verified && (
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

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => toggleVerified(selectedReview.id, selectedReview.verified)}
                        variant={selectedReview.verified ? 'outline' : 'primary'}
                        icon={selectedReview.verified ? X : Check}
                        className={selectedReview.verified ? 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20' : ''}
                      >
                        {selectedReview.verified ? 'Unpublish Review' : 'Verify & Publish'}
                      </Button>
                      
                      {selectedReview.products && (
                        <Button
                          variant="outline"
                          icon={Package}
                          onClick={() => window.open(`/products/${selectedReview.product_id}`, '_blank')}
                        >
                          View Product
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="danger"
                      onClick={() => deleteReview(selectedReview.id)}
                      icon={Trash2}
                      className="sm:ml-3"
                    >
                      Delete Review
                    </Button>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <p>
                      {selectedReview.verified 
                        ? 'Unpublishing will remove this review from the website immediately and it will no longer contribute to the product rating.'
                        : 'Publishing will make this review visible to all customers on the product page and include it in the overall rating calculation.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a review to manage
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose a review from the list to view complete details, reviewer information, sentiment analysis, and manage its publication status
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};