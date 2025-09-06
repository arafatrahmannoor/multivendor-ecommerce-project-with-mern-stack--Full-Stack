/* eslint-env node */

import mongoose from 'mongoose';

const vendorPayoutSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    orderNumber: {
        type: String,
        required: true
    },
    
    // Payout Details
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    commission: {
        type: Number,
        required: true,
        min: 0
    },
    serviceCharge: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    netAmount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'paid', 'hold', 'cancelled'],
        default: 'pending'
    },
    
    // Payment Details
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'mobile_banking', 'check', 'cash']
    },
    paymentDetails: {
        accountNumber: String,
        bankName: String,
        accountHolderName: String,
        routingNumber: String,
        mobileNumber: String,
        checkNumber: String
    },
    transactionId: String,
    
    // Timestamps
    approvedAt: Date,
    paidAt: Date,
    holdAt: Date,
    cancelledAt: Date,
    
    // Notes
    adminNotes: String,
    vendorNotes: String,
    
    // Processing
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
vendorPayoutSchema.index({ vendor: 1, createdAt: -1 });
vendorPayoutSchema.index({ order: 1 });
vendorPayoutSchema.index({ status: 1 });
vendorPayoutSchema.index({ orderNumber: 1 });

// Virtual for commission percentage
vendorPayoutSchema.virtual('commissionPercentage').get(function() {
    if (this.amount > 0) {
        return Math.round((this.commission / this.amount) * 100 * 100) / 100;
    }
    return 0;
});

// Virtual for service charge percentage
vendorPayoutSchema.virtual('serviceChargePercentage').get(function() {
    if (this.amount > 0) {
        return Math.round((this.serviceCharge / this.amount) * 100 * 100) / 100;
    }
    return 0;
});

vendorPayoutSchema.set('toJSON', { virtuals: true });

export default mongoose.model('VendorPayout', vendorPayoutSchema);
