/* eslint-env node */

import mongoose from 'mongoose';
import Review from '../model/review.js';
import Product from '../model/product.js';
import Order from '../model/order.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reviewController = {
    // Create new review
    createReview: async (req, res) => {
        try {
            const { productId } = req.params;
            const { rating, title, comment, orderId } = req.body;

            if (!rating || !comment) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating and comment are required'
                });
            }

            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            // Check if product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check if user already reviewed this product
            const existingReview = await Review.findOne({
                product: productId,
                user: req.user.id
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already reviewed this product'
                });
            }

            // Verify purchase if orderId is provided
            let isVerifiedPurchase = false;
            if (orderId) {
                const order = await Order.findOne({
                    _id: orderId,
                    customer: req.user.id,
                    'items.product': productId,
                    status: 'delivered'
                });

                if (order) {
                    isVerifiedPurchase = true;
                }
            }

            // Handle image uploads
            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map((file) => ({
                    url: `/public/review_images/${file.filename}`,
                    alt: `Review image for ${product.name}`
                }));
            }

            const review = new Review({
                product: productId,
                user: req.user.id,
                order: orderId || undefined,
                rating: parseInt(rating),
                title,
                comment,
                images,
                isVerifiedPurchase,
                status: 'pending' // Reviews need approval
            });

            await review.save();
            await review.populate([
                { path: 'user', select: 'name profilePicture' },
                { path: 'product', select: 'name' }
            ]);

            res.status(201).json({
                success: true,
                message: 'Review submitted successfully and is pending approval',
                data: review
            });
        } catch (error) {
            console.error('Error creating review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create review',
                error: error.message
            });
        }
    },

    // Get reviews for a product
    getProductReviews: async (req, res) => {
        try {
            const { productId } = req.params;
            const {
                page = 1,
                limit = 10,
                rating,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                verified
            } = req.query;

            // Build filter
            const filter = { 
                product: productId,
                status: 'approved'
            };

            if (rating) {
                filter.rating = parseInt(rating);
            }

            if (verified !== undefined) {
                filter.isVerifiedPurchase = verified === 'true';
            }

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const reviews = await Review.find(filter)
                .populate('user', 'name profilePicture')
                .populate('vendorReply.repliedBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Review.countDocuments(filter);

            // Get rating summary
            const ratingSummary = await Review.aggregate([
                {
                    $match: { 
                        product: new mongoose.Types.ObjectId(productId),
                        status: 'approved'
                    }
                },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            ratingSummary.forEach(item => {
                ratingCounts[item._id] = item.count;
            });

            res.json({
                success: true,
                data: {
                    reviews,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    },
                    ratingSummary: ratingCounts
                }
            });
        } catch (error) {
            console.error('Error fetching product reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch reviews',
                error: error.message
            });
        }
    },

    // Get user's reviews
    getUserReviews: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filter
            const filter = { user: req.user.id };
            if (status) {
                filter.status = status;
            }

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const reviews = await Review.find(filter)
                .populate('product', 'name images price')
                .populate('vendorReply.repliedBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Review.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    reviews,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch reviews',
                error: error.message
            });
        }
    },

    // Update review
    updateReview: async (req, res) => {
        try {
            const { id } = req.params;
            const { rating, title, comment } = req.body;

            const review = await Review.findById(id);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
            }

            // Check if user owns the review
            if (review.user.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this review'
                });
            }

            // Check if review can be updated (only pending and approved reviews)
            if (review.status === 'rejected' || review.status === 'spam') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update rejected or spam reviews'
                });
            }

            // Handle new image uploads
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map((file) => ({
                    url: `/public/review_images/${file.filename}`,
                    alt: `Review image update`
                }));
                
                review.images = [...review.images, ...newImages];
            }

            // Update fields
            if (rating) {
                if (rating < 1 || rating > 5) {
                    return res.status(400).json({
                        success: false,
                        message: 'Rating must be between 1 and 5'
                    });
                }
                review.rating = parseInt(rating);
            }

            if (title !== undefined) review.title = title;
            if (comment) review.comment = comment;

            // Reset to pending if approved review is being updated
            if (review.status === 'approved') {
                review.status = 'pending';
            }

            await review.save();
            await review.populate([
                { path: 'user', select: 'name profilePicture' },
                { path: 'product', select: 'name' }
            ]);

            res.json({
                success: true,
                message: 'Review updated successfully',
                data: review
            });
        } catch (error) {
            console.error('Error updating review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update review',
                error: error.message
            });
        }
    },

    // Delete review
    deleteReview: async (req, res) => {
        try {
            const { id } = req.params;

            const review = await Review.findById(id);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
            }

            // Check if user owns the review or is admin
            if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this review'
                });
            }

            // Delete review images
            if (review.images && review.images.length > 0) {
                for (const image of review.images) {
                    try {
                        const imagePath = path.join(__dirname, '..', image.url);
                        await fs.unlink(imagePath);
                    } catch (error) {
                        console.log('Error deleting review image:', error.message);
                    }
                }
            }

            await Review.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Review deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete review',
                error: error.message
            });
        }
    },

    // Remove review image
    removeReviewImage: async (req, res) => {
        try {
            const { id } = req.params;
            const { imageUrl } = req.body;

            const review = await Review.findById(id);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
            }

            // Check if user owns the review
            if (review.user.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this review'
                });
            }

            // Remove image from array
            review.images = review.images.filter(img => img.url !== imageUrl);
            await review.save();

            // Delete the physical file
            try {
                const imagePath = path.join(__dirname, '..', imageUrl);
                await fs.unlink(imagePath);
            } catch (error) {
                console.log('Error deleting image file:', error.message);
            }

            res.json({
                success: true,
                message: 'Image removed successfully',
                data: review
            });
        } catch (error) {
            console.error('Error removing review image:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove image',
                error: error.message
            });
        }
    },

    // Vote helpful on review
    voteHelpful: async (req, res) => {
        try {
            const { id } = req.params;

            const review = await Review.findByIdAndUpdate(
                id,
                { $inc: { helpfulVotes: 1 } },
                { new: true }
            ).populate('user', 'name profilePicture');

            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
            }

            res.json({
                success: true,
                message: 'Vote recorded successfully',
                data: { helpfulVotes: review.helpfulVotes }
            });
        } catch (error) {
            console.error('Error voting helpful:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to vote',
                error: error.message
            });
        }
    },

    // Report review
    reportReview: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const review = await Review.findByIdAndUpdate(
                id,
                { $inc: { reportCount: 1 } },
                { new: true }
            );

            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
            }

            // Auto-hide review if it gets too many reports
            if (review.reportCount >= 5 && review.status === 'approved') {
                review.status = 'pending';
                await review.save();
            }

            res.json({
                success: true,
                message: 'Review reported successfully'
            });
        } catch (error) {
            console.error('Error reporting review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to report review',
                error: error.message
            });
        }
    },

    // Vendor reply to review
    vendorReply: async (req, res) => {
        try {
            const { id } = req.params;
            const { comment } = req.body;

            if (!comment) {
                return res.status(400).json({
                    success: false,
                    message: 'Reply comment is required'
                });
            }

            const review = await Review.findById(id).populate('product', 'vendor');
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
            }

            // Check if user is the vendor of the product
            if (review.product.vendor.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the product vendor can reply to this review'
                });
            }

            review.vendorReply = {
                comment,
                repliedAt: new Date(),
                repliedBy: req.user.id
            };

            await review.save();
            await review.populate([
                { path: 'user', select: 'name profilePicture' },
                { path: 'vendorReply.repliedBy', select: 'name' }
            ]);

            res.json({
                success: true,
                message: 'Reply added successfully',
                data: review
            });
        } catch (error) {
            console.error('Error adding vendor reply:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add reply',
                error: error.message
            });
        }
    },

    // Admin: Get all reviews for moderation
    getAllReviews: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                rating,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search
            } = req.query;

            // Build filter
            const filter = {};
            if (status) filter.status = status;
            if (rating) filter.rating = parseInt(rating);

            // Search in comment or product name
            if (search) {
                const products = await Product.find({
                    name: { $regex: search, $options: 'i' }
                }).select('_id');
                
                filter.$or = [
                    { comment: { $regex: search, $options: 'i' } },
                    { product: { $in: products.map(p => p._id) } }
                ];
            }

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const reviews = await Review.find(filter)
                .populate('user', 'name email profilePicture')
                .populate('product', 'name vendor')
                .populate('vendorReply.repliedBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Review.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    reviews,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching all reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch reviews',
                error: error.message
            });
        }
    },

    // Admin: Update review status
    updateReviewStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['pending', 'approved', 'rejected', 'spam'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            const review = await Review.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            ).populate([
                { path: 'user', select: 'name email' },
                { path: 'product', select: 'name' }
            ]);

            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
            }

            res.json({
                success: true,
                message: `Review ${status} successfully`,
                data: review
            });
        } catch (error) {
            console.error('Error updating review status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update review status',
                error: error.message
            });
        }
    }
};

export default reviewController;
