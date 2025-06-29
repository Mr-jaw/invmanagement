import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Search, Trash2, Check, X, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ReviewDetailsModal } from '../../components/admin/ReviewDetailsModal';

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

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified' | 'pending'>('all');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [modalReview, setModalReview] = useState<Review | null>(null);

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

  const deleteReview = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent review selection when clicking delete from list
    }
    
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
      
      // Remove from selected reviews if it was selected
      setSelectedReviews(prev => prev.filter(reviewId => reviewId !== id));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleReviewClick = (review: Review) => {
    console.log('Review clicked:', review.author_name); // Debug log
    console.log('Opening modal for review:', review.id); // Additional debug
    
    // Set modal data and show modal
    setModalReview(review);
    setShowReviewModal(true);
  };

  const handleReviewUpdate = (updatedReview: Review) => {
    setReviews(reviews.map(r => 
      r.id === updatedReview.id ? updatedReview : r
    ));
    setModalReview(updatedReview);
  };

  const handleReviewDelete = (reviewId: string) => {
    setReviews(reviews.filter(r => r.id !== reviewId));
    setSelectedReviews(prev => prev.filter(id => id !== reviewId));
    setShowReviewModal(false);
    setModalReview(null);
  };

  const handleSelectReview = (reviewId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when selecting
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
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
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-24"></div>
            ))}
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

      {/* Single Column Layout - Reviews List Only */}
      <div className="max-w-4xl mx-auto">
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

        <div className="space-y-3">
          {/* Show pending reviews first */}
          {pendingReviews.length > 0 && filterStatus === 'all' && (
            <>
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Pending Verification ({pendingReviews.length})
              </div>
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className={`p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg hover:scale-[1.01] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg border-l-4 border-l-yellow-500`}
                  onClick={() => handleReviewClick(review)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        onClick={(e) => handleSelectReview(review.id, e)}
                        className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        {selectedReviews.includes(review.id) ? (
                          <CheckSquare className="h-5 w-5 text-primary-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {review.author_name}
                          </h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            Pending
                          </span>
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {review.products?.name} • {review.author_email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          "{review.comment}"
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        <p>{new Date(review.created_at).toLocaleDateString()}</p>
                        <p>{new Date(review.created_at).toLocaleTimeString()}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => deleteReview(review.id, e)}
                        icon={Trash2}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <span className="sr-only">Delete review</span>
                      </Button>
                    </div>
                  </div>
                </div>
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
            <div
              key={review.id}
              className={`p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg hover:scale-[1.01] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg ${
                !review.verified ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'
              }`}
              onClick={() => handleReviewClick(review)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={(e) => handleSelectReview(review.id, e)}
                    className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    {selectedReviews.includes(review.id) ? (
                      <CheckSquare className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {review.author_name}
                      </h3>
                      {review.verified ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Pending
                        </span>
                      )}
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {review.products?.name} • {review.author_email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      "{review.comment}"
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <p>{new Date(review.created_at).toLocaleDateString()}</p>
                    <p>{new Date(review.created_at).toLocaleTimeString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteReview(review.id, e)}
                    icon={Trash2}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <span className="sr-only">Delete review</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No reviews found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm ? 'Try adjusting your search terms' : 'Reviews will appear here when customers submit them'}
            </p>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      <ReviewDetailsModal
        isOpen={showReviewModal}
        onClose={() => {
          console.log('Closing review modal'); // Debug log
          setShowReviewModal(false);
          setModalReview(null);
        }}
        review={modalReview}
        onReviewUpdate={handleReviewUpdate}
        onReviewDelete={handleReviewDelete}
      />
    </div>
  );
};