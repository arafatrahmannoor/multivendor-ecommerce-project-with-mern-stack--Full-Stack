import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: 500
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory'
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Pricing
    price: {
        type: Number,
        required: true,
        min: 0
    },
    comparePrice: {
        type: Number,
        min: 0
    },
    costPrice: {
        type: Number,
        min: 0
    },
    
    // Inventory Management
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true
    },
    inventory: {
        trackQuantity: {
            type: Boolean,
            default: true
        },
        quantity: {
            type: Number,
            default: 0,
            min: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 5,
            min: 0
        }
    },
    
    // Physical Properties
    weight: {
        type: Number,
        min: 0
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'inch'],
            default: 'cm'
        }
    },
    
    // Media
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: String,
        isMain: {
            type: Boolean,
            default: false
        }
    }],
    
    // Product Variants
    variants: [{
        name: {
            type: String,
            required: true
        },
        options: [{
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                default: 0
            },
            quantity: {
                type: Number,
                default: 0
            },
            sku: String,
            image: String
        }]
    }],
    
    // SEO & Marketing
    seoTitle: String,
    seoDescription: String,
    tags: [String],
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    
    // Status & Visibility
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'inactive', 'rejected', 'out_of_stock'],
        default: 'draft'
    },
    isFeature: {
        type: Boolean,
        default: false
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'hidden'],
        default: 'public'
    },
    
    // Admin Review Fields
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    adminNote: {
        type: String,
        trim: true
    },
    
    // Shipping
    shippingRequired: {
        type: Boolean,
        default: true
    },
    shippingClass: String,
    
    // Reviews & Ratings
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    ratingDistribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 }
    },
    
    // Sales Analytics
    totalSales: {
        type: Number,
        default: 0
    },
    salesCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    
    // Timestamps
    publishedAt: Date,
    lastRestocked: Date
}, {
    timestamps: true
});

// Indexes for performance
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
// Note: slug index is already created by unique: true in schema definition

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        const baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        this.slug = `${baseSlug}-${Date.now()}`;
    }
    
    // Auto-generate SKU if not provided
    if (!this.sku && this.isNew) {
        this.sku = `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    }
    
    // Set published date when status changes to active
    if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    
    next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.comparePrice && this.comparePrice > this.price) {
        return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
    }
    return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (!this.inventory.trackQuantity) return 'in_stock';
    if (this.inventory.quantity <= 0) return 'out_of_stock';
    if (this.inventory.quantity <= this.inventory.lowStockThreshold) return 'low_stock';
    return 'in_stock';
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Product', productSchema);
