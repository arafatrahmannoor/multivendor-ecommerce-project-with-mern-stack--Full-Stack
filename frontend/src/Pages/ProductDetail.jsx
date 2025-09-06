import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct, useProductReviews, useCreateReview } from '../hooks/useEcommerceApi';
import useTheme from '../hooks/useTheme';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';

const ProductDetail = () => {
    const { id } = useParams();
    const { theme } = useTheme();
    const { addItem } = useCartStore();
    const { isLoggedIn } = useAuthStore();
    
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewData, setReviewData] = useState({
        rating: 5,
        title: '',
        comment: '',
        images: []
    });

    const { data: product, isLoading, error } = useProduct(id);
    const { data: reviews } = useProductReviews(id);
    const createReviewMutation = useCreateReview();

    const handleAddToCart = () => {
        if (product?.data) {
            addItem(product.data, quantity);
            // Show success feedback
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isLoggedIn) return;

        const formData = new FormData();
        formData.append('rating', reviewData.rating);
        formData.append('title', reviewData.title);
        formData.append('comment', reviewData.comment);
        
        // Append images if any
        reviewData.images.forEach(image => {
            formData.append('images', image);
        });

        try {
            await createReviewMutation.mutateAsync({ productId: id, formData });
            setShowReviewForm(false);
            setReviewData({ rating: 5, title: '', comment: '', images: [] });
        } catch (error) {
            console.error('Failed to submit review:', error);
        }
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg h-96`}></div>
                            <div className="space-y-4">
                                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} h-8 rounded`}></div>
                                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} h-6 rounded w-3/4`}></div>
                                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} h-4 rounded`}></div>
                                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} h-10 rounded w-1/2`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product?.data) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
                        <Link to="/products" className="text-indigo-600 hover:text-indigo-700">
                            ← Back to Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const productData = product.data;
    const productImages = productData.images || [];
    const productReviews = reviews?.data || [];

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm mb-8">
                    <Link to="/" className="text-indigo-600 hover:text-indigo-700">Home</Link>
                    <span>/</span>
                    <Link to="/products" className="text-indigo-600 hover:text-indigo-700">Products</Link>
                    <span>/</span>
                    <span className="text-gray-500">{productData.name}</span>
                </nav>

                {/* Product Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Product Images */}
                    <div className="space-y-4">
                        <div className={`rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                            {productImages.length > 0 ? (
                                <img
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${productImages[selectedImage]}`}
                                    alt={productData.name}
                                    className="w-full h-96 object-cover"
                                />
                            ) : (
                                <div className="w-full h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                    <span className="text-gray-500">No Image Available</span>
                                </div>
                            )}
                        </div>
                        
                        {productImages.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto">
                                {productImages.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                                            selectedImage === index 
                                                ? 'border-indigo-500' 
                                                : theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                        }`}
                                    >
                                        <img
                                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${image}`}
                                            alt={`${productData.name} ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{productData.name}</h1>
                            <div className="flex items-center gap-4 mb-4">
                                {productData.rating && (
                                    <div className="flex items-center">
                                        <span className="text-yellow-400">
                                            {'★'.repeat(Math.floor(productData.rating))}
                                        </span>
                                        <span className="text-gray-300">
                                            {'★'.repeat(5 - Math.floor(productData.rating))}
                                        </span>
                                        <span className="text-sm text-gray-500 ml-2">
                                            ({productData.reviewCount || 0} reviews)
                                        </span>
                                    </div>
                                )}
                                {productData.brand && (
                                    <span className="text-sm text-gray-500">
                                        Brand: {productData.brand.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-indigo-600">
                                    ${productData.price?.toFixed(2)}
                                </span>
                                {productData.comparePrice && productData.comparePrice > productData.price && (
                                    <span className="text-xl text-gray-500 line-through">
                                        ${productData.comparePrice.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            
                            {productData.stock !== undefined && (
                                <p className={`text-sm ${productData.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {productData.stock > 0 
                                        ? `${productData.stock} in stock` 
                                        : 'Out of stock'
                                    }
                                </p>
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {productData.description}
                            </p>
                        </div>

                        {/* Add to Cart */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <label className="font-medium">Quantity:</label>
                                <div className="flex items-center border rounded-md">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        -
                                    </button>
                                    <span className="px-4 py-2 border-x">{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={productData.stock === 0}
                                className={`w-full py-3 px-6 rounded-md font-medium transition-colors ${
                                    productData.stock === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                                {productData.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Customer Reviews</h2>
                        {isLoggedIn && (
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                            >
                                Write Review
                            </button>
                        )}
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                        <form onSubmit={handleReviewSubmit} className="mb-8 p-4 border rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Rating</label>
                                    <select
                                        value={reviewData.rating}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        {[5, 4, 3, 2, 1].map(rating => (
                                            <option key={rating} value={rating}>
                                                {rating} Star{rating !== 1 ? 's' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={reviewData.title}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full p-2 border rounded-md"
                                        placeholder="Review title"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Comment</label>
                                <textarea
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                    rows={4}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Share your experience..."
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={createReviewMutation.isPending}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReviewForm(false)}
                                    className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-4">
                        {productReviews.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                        ) : (
                            productReviews.map((review) => (
                                <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{review.user?.name || 'Anonymous'}</span>
                                                <div className="flex">
                                                    <span className="text-yellow-400">
                                                        {'★'.repeat(review.rating)}
                                                    </span>
                                                    <span className="text-gray-300">
                                                        {'★'.repeat(5 - review.rating)}
                                                    </span>
                                                </div>
                                            </div>
                                            {review.title && (
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                    {review.title}
                                                </h4>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-2">{review.comment}</p>
                                    
                                    {review.images && review.images.length > 0 && (
                                        <div className="flex gap-2 mb-2">
                                            {review.images.map((image, index) => (
                                                <img
                                                    key={index}
                                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${image}`}
                                                    alt={`Review ${index + 1}`}
                                                    className="w-16 h-16 object-cover rounded-md"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    
                                    {review.vendorReply && (
                                        <div className="mt-3 ml-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                                Vendor Reply:
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {review.vendorReply.comment}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
