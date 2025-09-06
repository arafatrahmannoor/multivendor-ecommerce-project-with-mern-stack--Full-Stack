import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        trim: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    images: [{
        url: String,
        alt: String
    }],
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    helpfulVotes: {
        type: Number,
        default: 0
    },
    reportCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'spam'],
        default: 'pending'
    },
    vendorReply: {
        comment: String,
        repliedAt: Date,
        repliedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
}, {
    timestamps: true
});

// Compound index to ensure one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Static method to calculate average rating for a product
reviewSchema.statics.calculateAverageRating = async function(productId) {
    try {
        const stats = await this.aggregate([
            {
                $match: { 
                    product: mongoose.Types.ObjectId(productId),
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: '$product',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            }
        ]);

        if (stats.length > 0) {
            const { averageRating, totalReviews, ratingDistribution } = stats[0];
            
            // Calculate rating distribution
            const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            ratingDistribution.forEach(rating => {
                distribution[rating]++;
            });

            // Update product with new ratings
            await mongoose.model('Product').findByIdAndUpdate(productId, {
                averageRating: Math.round(averageRating * 10) / 10,
                totalReviews,
                ratingDistribution: distribution
            });
        } else {
            // No reviews, reset to defaults
            await mongoose.model('Product').findByIdAndUpdate(productId, {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            });
        }
    } catch (error) {
        console.error('Error calculating average rating:', error);
    }
};

// Post middleware to update product ratings after save/remove
reviewSchema.post('save', function() {
    if (this.status === 'approved') {
        this.constructor.calculateAverageRating(this.product);
    }
});

reviewSchema.post('findOneAndUpdate', async function() {
    if (this.getUpdate().$set && this.getUpdate().$set.status === 'approved') {
        const review = await this.model.findOne(this.getQuery());
        if (review) {
            this.model.calculateAverageRating(review.product);
        }
    }
});

reviewSchema.post('findOneAndDelete', function(doc) {
    if (doc) {
        this.model.calculateAverageRating(doc.product);
    }
});

export default mongoose.model('Review', reviewSchema);
