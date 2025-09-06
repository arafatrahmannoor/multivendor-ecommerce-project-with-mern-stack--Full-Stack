/* eslint-env node */

import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Order Items (Multi-vendor support)
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        productName: String,
        productImage: String,
        variant: {
            name: String,
            option: String
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
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
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
            default: 'pending'
        },
        trackingNumber: String,
        shippedAt: Date,
        deliveredAt: Date
    }],
    
    // Order Summary
    subtotal: {
        type: Number,
        required: true,
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
        required: true,
        min: 0
    },
    
    // Addresses
    shippingAddress: {
        fullName: { type: String, required: true },
        email: String,
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: String,
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: 'Bangladesh' }
    },
    billingAddress: {
        fullName: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        sameAsShipping: { type: Boolean, default: true }
    },
    
    // Payment Information
    payment: {
        method: {
            type: String,
            enum: ['sslcommerz', 'cod', 'bank_transfer'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refund'],
            default: 'pending'
        },
        transactionId: String,
        paymentGatewayResponse: Object,
        paidAt: Date,
        refundedAt: Date,
        refundAmount: Number
    },
    
    // Order Status
    status: {
        type: String,
        enum: ['pending_admin_approval', 'admin_approved', 'vendor_assigned', 'vendor_confirmed', 'payment_pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending_admin_approval'
    },
    
    // Admin Approval System
    adminApproval: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: Date,
        rejectionReason: String
    },
    
    // Vendor Assignment and Confirmation
    vendorAssignment: [{
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OrderItem'  // Reference to items in this order
        }],
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'rejected'],
            default: 'pending'
        },
        assignedAt: Date,
        confirmedAt: Date,
        rejectionReason: String
    }],
    
    // Timestamps
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    
    // Enhanced Notes System
    customerNotes: String,
    adminNotes: String,
    vendorNotes: String,
    cancellationReason: String,
    
    // Notification Tracking
    notifications: [{
        type: {
            type: String,
            enum: ['order_placed', 'admin_approved', 'admin_rejected', 'vendor_assigned', 'vendor_confirmed', 'vendor_rejected', 'payment_reminder', 'payment_confirmed', 'shipped', 'delivered'],
            required: true
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: String,
        isRead: {
            type: Boolean,
            default: false
        },
        sentAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Vendor Payouts
    vendorPayouts: [{
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: Number,
        commission: Number,
        serviceCharge: Number,
        netAmount: Number,
        status: {
            type: String,
            enum: ['pending', 'paid', 'hold'],
            default: 'pending'
        },
        paidAt: Date
    }]
}, {
    timestamps: true
});

// Indexes
// Note: orderNumber index is already created by unique: true in schema definition
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'items.vendor': 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
    if (this.isNew && !this.orderNumber) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        this.orderNumber = `ORD-${timestamp}-${random}`;
    }
    next();
});

// Method to calculate vendor payouts
orderSchema.methods.calculateVendorPayouts = function() {
    const vendorPayouts = {};
    
    this.items.forEach(item => {
        const vendorId = item.vendor.toString();
        
        if (!vendorPayouts[vendorId]) {
            vendorPayouts[vendorId] = {
                vendor: item.vendor,
                amount: 0,
                commission: 0,
                serviceCharge: 0,
                netAmount: 0,
                status: 'pending'
            };
        }
        
        vendorPayouts[vendorId].amount += item.totalPrice;
        // Assuming 10% commission and 2% service charge
        vendorPayouts[vendorId].commission += item.totalPrice * 0.10;
        vendorPayouts[vendorId].serviceCharge += item.totalPrice * 0.02;
    });
    
    // Calculate net amounts
    Object.keys(vendorPayouts).forEach(vendorId => {
        const payout = vendorPayouts[vendorId];
        payout.netAmount = payout.amount - payout.commission - payout.serviceCharge;
    });
    
    this.vendorPayouts = Object.values(vendorPayouts);
    return this.vendorPayouts;
};

// Virtual for order summary by vendor
orderSchema.virtual('vendorSummary').get(function() {
    const vendors = {};
    
    this.items.forEach(item => {
        const vendorId = item.vendor.toString();
        
        if (!vendors[vendorId]) {
            vendors[vendorId] = {
                vendor: item.vendor,
                items: [],
                subtotal: 0,
                itemCount: 0
            };
        }
        
        vendors[vendorId].items.push(item);
        vendors[vendorId].subtotal += item.totalPrice;
        vendors[vendorId].itemCount += item.quantity;
    });
    
    return Object.values(vendors);
});

orderSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Order', orderSchema);
