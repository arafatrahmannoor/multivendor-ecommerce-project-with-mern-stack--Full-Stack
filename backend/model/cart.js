/* eslint-env node */

import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One cart per user
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        productImage: {
            type: String,
            default: ''
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            max: 10 // Maximum quantity per item
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        variant: {
            size: String,
            color: String,
            storage: String,
            // Add other variant properties as needed
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        // Check if item is still available
        isAvailable: {
            type: Boolean,
            default: true
        }
    }],
    
    // Cart Summary
    subtotal: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    serviceCharge: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Cart Status
    status: {
        type: String,
        enum: ['active', 'abandoned', 'converted'],
        default: 'active'
    },
    
    // Metadata
    itemCount: {
        type: Number,
        default: 0
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
// Note: user index is already created by unique: true in schema definition
cartSchema.index({ 'items.product': 1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
    if (this.isModified('items')) {
        let subtotal = 0;
        let serviceCharge = 0;
        let itemCount = 0;

        // Calculate subtotal and item count
        this.items.forEach(item => {
            subtotal += item.totalPrice;
            itemCount += item.quantity;
        });

        // Calculate service charge (5% of subtotal)
        serviceCharge = subtotal * 0.05;

        // Calculate tax (5% of subtotal)
        const tax = subtotal * 0.05;

        // Calculate shipping cost (free shipping over 1000)
        const shippingCost = subtotal > 1000 ? 0 : 60;

        // Update cart totals
        this.subtotal = subtotal;
        this.serviceCharge = serviceCharge;
        this.tax = tax;
        this.shippingCost = shippingCost;
        this.total = subtotal + serviceCharge + tax + shippingCost - this.discount;
        this.itemCount = itemCount;
        this.lastModified = new Date();
    }
    next();
});

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
    this.items = [];
    this.subtotal = 0;
    this.tax = 0;
    this.shippingCost = 0;
    this.serviceCharge = 0;
    this.total = 0;
    this.itemCount = 0;
    this.lastModified = new Date();
    return this.save();
};

// Instance method to add item
cartSchema.methods.addItem = function(productData, quantity = 1, variant = {}) {
    const existingItemIndex = this.items.findIndex(item => 
        item.product.toString() === productData._id.toString() &&
        JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingItemIndex > -1) {
        // Update existing item quantity
        this.items[existingItemIndex].quantity += quantity;
        this.items[existingItemIndex].totalPrice = 
            this.items[existingItemIndex].quantity * this.items[existingItemIndex].unitPrice;
    } else {
        // Add new item
        const newItem = {
            product: productData._id,
            productName: productData.name,
            productImage: productData.images[0]?.url || '',
            quantity,
            unitPrice: productData.price,
            totalPrice: productData.price * quantity,
            variant,
            vendor: productData.vendor,
            addedAt: new Date(),
            isAvailable: productData.status === 'active'
        };
        this.items.push(newItem);
    }
    
    return this.save();
};

// Instance method to remove item
cartSchema.methods.removeItem = function(itemId) {
    this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
    return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
    const item = this.items.find(item => item._id.toString() === itemId.toString());
    if (item) {
        item.quantity = quantity;
        item.totalPrice = item.unitPrice * quantity;
        item.addedAt = new Date(); // Update timestamp
    }
    return this.save();
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
    let cart = await this.findOne({ user: userId }).populate('items.product', 'name price images status inventory vendor');
    
    if (!cart) {
        cart = new this({ user: userId });
        await cart.save();
    }
    
    return cart;
};

export default mongoose.model('Cart', cartSchema);
