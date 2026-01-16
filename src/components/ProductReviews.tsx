import React, { useState, useEffect, useContext } from 'react';
import { Star, User, Send, Loader2, MessageSquare, CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';

interface Review {
    id: string;
    user_id: string;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
    helpful_count?: number;
    not_helpful_count?: number;
}

interface ProductReviewsProps {
    productId: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
    const { user } = useContext(AuthContext);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});

    useEffect(() => {
        fetchReviews();
        if (user) {
            fetchUserVotes();
        }
    }, [productId, user]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserVotes = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('review_votes')
            .select('review_id, vote_type')
            .eq('user_id', user.id);

        if (data) {
            const votes: Record<string, 'up' | 'down'> = {};
            data.forEach((v: any) => {
                votes[v.review_id] = v.vote_type;
            });
            setUserVotes(votes);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to write a review');
            return;
        }

        if (!newComment.trim()) {
            toast.error('Please write a comment');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('reviews').insert({
                product_id: productId,
                user_id: user.id,
                user_name: user.name || user.email?.split('@')[0] || 'User',
                rating: newRating,
                comment: newComment.trim(),
            });

            if (error) throw error;

            toast.success('Review submitted successfully!');
            setNewComment('');
            setNewRating(5);
            fetchReviews(); // Refresh list
        } catch (error: any) {
            console.error('Error submitting review:', error);
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (reviewId: string, type: 'up' | 'down') => {
        if (!user) {
            toast.error('Please login to vote');
            return;
        }

        const currentVote = userVotes[reviewId];

        // Optimistic update
        setReviews(prev => prev.map(r => {
            if (r.id === reviewId) {
                let newHelpful = r.helpful_count || 0;
                let newNotHelpful = r.not_helpful_count || 0;

                if (currentVote === type) {
                    // Toggle off
                    if (type === 'up') newHelpful = Math.max(0, newHelpful - 1);
                    else newNotHelpful = Math.max(0, newNotHelpful - 1);
                } else if (currentVote) {
                    // Switch
                    if (type === 'up') {
                        newHelpful++;
                        newNotHelpful = Math.max(0, newNotHelpful - 1);
                    } else {
                        newNotHelpful++;
                        newHelpful = Math.max(0, newHelpful - 1);
                    }
                } else {
                    // New vote
                    if (type === 'up') newHelpful++;
                    else newNotHelpful++;
                }

                return { ...r, helpful_count: newHelpful, not_helpful_count: newNotHelpful };
            }
            return r;
        }));

        // Update local vote state
        setUserVotes(prev => {
            const newVotes = { ...prev };
            if (currentVote === type) {
                delete newVotes[reviewId];
            } else {
                newVotes[reviewId] = type;
            }
            return newVotes;
        });

        try {
            const { error } = await supabase.rpc('vote_for_review', {
                row_id: reviewId,
                vote_type: type
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error voting:', error);
            toast.error('Failed to record vote');
            fetchReviews();
            fetchUserVotes();
        }
    };

    const averageRating = reviews.length
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    return (
        <section className="w-full rounded-xl mx-auto px-4 py-8 bg-white" id="reviews">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 border border-gray-100 rounded-xl shadow-sm bg-white">

                    {/* Left Column: Summary & Stats */}
                    <div className="lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="section-title-themed mb-4 text-left text-2xl">
                                <span className="text-primary">Ratings</span> <span className="text-highlight">& Reviews</span>
                            </h2>
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="lg:hidden btn-outline-glow px-4 py-2 text-sm font-medium rounded-md"
                            >
                                Rate Product
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-medium text-gray-900">{averageRating}</span>
                                <Star className="w-6 h-6 fill-teal text-teal" />
                            </div>
                            <p className="text-gray-500 text-sm">
                                {reviews.length} ratings and {reviews.length} reviews
                            </p>
                        </div>

                        {/* Mocked Sentiment Tags */}
                        <div className="mb-6">
                            <h4 className="text-gray-900 font-medium mb-3">What our customers felt:</h4>
                            <div className="flex flex-wrap gap-2">
                                {['Look', 'Quality', 'Design', 'Value'].map((tag) => (
                                    <span key={tag} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-full cursor-default hover:border-teal hover:text-teal transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Rate Button */}
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="hidden lg:block w-full py-3 btn-outline-glow font-semibold rounded-md mt-4 cursor-pointer"
                        >
                            Rate Product
                        </button>
                    </div>

                    {/* Right Column: Reviews List & Form */}
                    <div className="flex-1 p-6">

                        {/* Write a Review Form - Collapsible */}
                        {showReviewForm && (
                            <div className="mb-8 p-6 bg-gray-50 rounded border border-gray-200 animate-in fade-in slide-in-from-top-2">
                                {user ? (
                                    <form onSubmit={handleSubmitReview}>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate this product</h3>

                                        <div className="mb-4">
                                            <div className="flex gap-2 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setNewRating(star)}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        className="focus:outline-none transition-transform hover:scale-110"
                                                    >
                                                        <Star
                                                            className={`w-8 h-8 ${star <= (hoverRating || newRating)
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'fill-gray-200 text-gray-200'
                                                                }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Description..."
                                                className="w-full px-4 py-3 rounded border border-gray-300 text-gray-900 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal min-h-[120px]"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowReviewForm(false)}
                                                className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="px-8 py-2 btn-glow-teal text-white font-medium rounded-lg disabled:opacity-70 transition-all shadow-lg hover:shadow-teal-500/30"
                                            >
                                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-gray-600 mb-4">Please log in to write a review.</p>
                                        <button disabled className="px-6 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed">Log In</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reviews List */}
                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-8 h-8 text-teal animate-spin" />
                                </div>
                            ) : reviews.length > 0 ? (
                                <div>
                                    {reviews.map((review) => (
                                        <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 mb-6 last:pb-0 last:mb-0">
                                            {/* Header: Badge + Comment Preview/Title */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center justify-center bg-teal text-white text-xs font-bold px-2 py-0.5 rounded gap-1 shadow-sm">
                                                    <span>{review.rating}</span>
                                                    <Star className="w-3 h-3 fill-current" />
                                                </div>
                                                <span className="font-semibold text-gray-900 text-sm">{review.comment.split(' ').slice(0, 5).join(' ')}...</span>
                                            </div>

                                            {/* Body: Full Comment */}
                                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                                {review.comment}
                                            </p>

                                            {/* Footer: Meta & Actions */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-gray-400">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="font-medium text-gray-500">{review.user_name}</span>
                                                    <span className="hidden sm:inline w-px h-3 bg-gray-300"></span>
                                                    <span className="flex items-center gap-1 text-gray-500">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                                                        Certified Buyer
                                                    </span>
                                                    <span className="hidden sm:inline w-px h-3 bg-gray-300"></span>
                                                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                                </div>

                                                {/* Like/Dislike Actions */}
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleVote(review.id, 'up')}
                                                        className={`flex items-center gap-1 transition-colors group ${userVotes[review.id] === 'up' ? 'text-teal font-bold' : 'text-gray-400 hover:text-teal'
                                                            }`}
                                                    >
                                                        <ThumbsUp className={`w-4 h-4 transition-transform ${userVotes[review.id] === 'up' ? 'scale-110 fill-current' : 'group-hover:scale-110'}`} />
                                                        <span className="pt-0.5 font-medium">{review.helpful_count || 0}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleVote(review.id, 'down')}
                                                        className={`flex items-center gap-1 transition-colors group ${userVotes[review.id] === 'down' ? 'text-red-500 font-bold' : 'text-gray-400 hover:text-red-500'
                                                            }`}
                                                    >
                                                        <ThumbsDown className={`w-4 h-4 transition-transform ${userVotes[review.id] === 'down' ? 'scale-110 fill-current' : 'group-hover:scale-110'}`} />
                                                        <span className="pt-0.5 font-medium">{review.not_helpful_count || 0}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-gray-500">No reviews yet. Be the first to rate this product!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
