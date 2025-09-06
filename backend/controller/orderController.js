/* eslint-env node */
/* global process */

import mongoose from 'mongoose';
import Order from '../model/order.js';
import Product from '../model/product.js';
import User from '../model/user.js';
import VendorPayout from '../model/vendorPayout.js';
import { sendEmail } from '../utils/mailer.js';

const orderController = {
    // Get user orders
    getUserOrders: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filter
            const filter = { customer: req.user.id };
            if (status) filter.status = status;

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const orders = await Order.find(filter)
                .populate('items.product', 'name images price')
                .populate('items.vendor', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Order.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching user orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders',
                error: error.message
            });
        }
    },

    // Get single order
    getOrder: async (req, res) => {
        try {
            const { id } = req.params;

            const order = await Order.findById(id)
                .populate('customer', 'name email phone')
                .populate('items.product', 'name images price description')
                .populate('items.vendor', 'name email phone');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if user has access to this order
            if (order.customer._id.toString() !== req.user.id && 
                !order.items.some(item => item.vendor._id.toString() === req.user.id) &&
                req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this order'
                });
            }

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            console.error('Error fetching order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order',
                error: error.message
            });
        }
    },

    // Get vendor orders
    getVendorOrders: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build aggregation pipeline
            const pipeline = [
                {
                    $match: {
                        'items.vendor': mongoose.Types.ObjectId(req.user.id)
                    }
                },
                {
                    $addFields: {
                        vendorItems: {
                            $filter: {
                                input: '$items',
                                cond: { $eq: ['$$item.vendor', mongoose.Types.ObjectId(req.user.id)] }
                            }
                        }
                    }
                }
            ];

            // Add status filter if provided
            if (status) {
                pipeline.push({
                    $match: {
                        'vendorItems.status': status
                    }
                });
            }

            // Add sorting
            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
            pipeline.push({ $sort: sortObj });

            // Add pagination
            pipeline.push(
                { $skip: (parseInt(page) - 1) * parseInt(limit) },
                { $limit: parseInt(limit) }
            );

            // Add population
            pipeline.push(
                {
                    $lookup: {
                        from: 'users',
                        localField: 'customer',
                        foreignField: '_id',
                        as: 'customer',
                        pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }]
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'vendorItems.product',
                        foreignField: '_id',
                        as: 'productDetails',
                        pipeline: [{ $project: { name: 1, images: 1, price: 1 } }]
                    }
                },
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } }
            );

            const orders = await Order.aggregate(pipeline);

            // Get total count
            const countPipeline = [
                {
                    $match: {
                        'items.vendor': mongoose.Types.ObjectId(req.user.id)
                    }
                },
                { $count: 'total' }
            ];

            const totalResult = await Order.aggregate(countPipeline);
            const total = totalResult[0]?.total || 0;

            res.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching vendor orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch vendor orders',
                error: error.message
            });
        }
    },

    // Update order status (for vendors)
    updateOrderStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, itemId, trackingNumber, notes } = req.body;

            const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            const order = await Order.findById(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // If itemId is provided, update specific item
            if (itemId) {
                const item = order.items.id(itemId);
                if (!item) {
                    return res.status(404).json({
                        success: false,
                        message: 'Order item not found'
                    });
                }

                // Check if user is the vendor for this item
                if (item.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Not authorized to update this item'
                    });
                }

                item.status = status;
                if (trackingNumber) item.trackingNumber = trackingNumber;
                if (status === 'shipped') item.shippedAt = new Date();
                if (status === 'delivered') item.deliveredAt = new Date();

                // Update overall order status if all items are delivered
                const allDelivered = order.items.every(item => item.status === 'delivered');
                if (allDelivered) {
                    order.status = 'delivered';
                    order.deliveredAt = new Date();
                }
            } else {
                // Update overall order status (admin only)
                if (req.user.role !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Only admin can update overall order status'
                    });
                }

                order.status = status;
                if (status === 'confirmed') order.confirmedAt = new Date();
                if (status === 'shipped') order.shippedAt = new Date();
                if (status === 'delivered') order.deliveredAt = new Date();
                if (status === 'cancelled') order.cancelledAt = new Date();
            }

            if (notes) order.adminNotes = notes;

            await order.save();

            // Send email notification to customer
            try {
                const customer = await order.populate('customer', 'name email');
                await sendEmail({
                    to: customer.customer.email,
                    subject: `Order ${order.orderNumber} Status Update`,
                    template: 'orderStatusUpdate',
                    data: {
                        customerName: customer.customer.name,
                        orderNumber: order.orderNumber,
                        status,
                        trackingNumber,
                        orderUrl: `${process.env.FRONTEND_URL}/orders/${order._id}`
                    }
                });
            } catch (emailError) {
                console.log('Error sending email notification:', emailError.message);
            }

            await order.populate([
                { path: 'customer', select: 'name email' },
                { path: 'items.product', select: 'name images' },
                { path: 'items.vendor', select: 'name' }
            ]);

            res.json({
                success: true,
                message: 'Order status updated successfully',
                data: order
            });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error.message
            });
        }
    },

    // Cancel order
    cancelOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const order = await Order.findById(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if user can cancel this order
            if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to cancel this order'
                });
            }

            // Check if order can be cancelled
            const nonCancellableStatuses = ['shipped', 'delivered', 'cancelled', 'refunded'];
            if (nonCancellableStatuses.includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot cancel order with status: ${order.status}`
                });
            }

            order.status = 'cancelled';
            order.cancelledAt = new Date();
            order.cancellationReason = reason || 'Cancelled by customer';

            // Update item statuses
            order.items.forEach(item => {
                if (!['shipped', 'delivered'].includes(item.status)) {
                    item.status = 'cancelled';
                }
            });

            await order.save();

            // Restore inventory for cancelled items
            for (const item of order.items) {
                if (item.status === 'cancelled') {
                    await Product.findByIdAndUpdate(
                        item.product,
                        { 
                            $inc: { 
                                'inventory.quantity': item.quantity,
                                'totalSales': -item.totalPrice,
                                'salesCount': -item.quantity
                            }
                        }
                    );
                }
            }

            // Process refund if payment was made
            if (order.payment.status === 'paid') {
                // This would trigger a refund process
                // Implementation depends on payment gateway
                order.payment.status = 'refunded';
                order.payment.refundedAt = new Date();
            }

            res.json({
                success: true,
                message: 'Order cancelled successfully',
                data: order
            });
        } catch (error) {
            console.error('Error cancelling order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order',
                error: error.message
            });
        }
    },

    // Get order analytics (for vendors and admin)
    getOrderAnalytics: async (req, res) => {
        try {
            const { period = '30d', vendorId } = req.query;

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            
            switch (period) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
                case '1y':
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 30);
            }

            // Build match condition
            const matchCondition = {
                createdAt: { $gte: startDate, $lte: endDate }
            };

            // Add vendor filter if not admin
            if (req.user.role !== 'admin') {
                matchCondition['items.vendor'] = mongoose.Types.ObjectId(req.user.id);
            } else if (vendorId) {
                matchCondition['items.vendor'] = mongoose.Types.ObjectId(vendorId);
            }

            const analytics = await Order.aggregate([
                { $match: matchCondition },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$total' },
                        averageOrderValue: { $avg: '$total' },
                        pendingOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                        },
                        confirmedOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                        },
                        processingOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
                        },
                        shippedOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
                        },
                        deliveredOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                        },
                        cancelledOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                        }
                    }
                }
            ]);

            // Get daily order trends
            const dailyTrends = await Order.aggregate([
                { $match: matchCondition },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        orders: { $sum: 1 },
                        revenue: { $sum: '$total' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Get top products
            const topProducts = await Order.aggregate([
                { $match: matchCondition },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.product',
                        productName: { $first: '$items.productName' },
                        totalQuantity: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: '$items.totalPrice' }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 }
            ]);

            res.json({
                success: true,
                data: {
                    overview: analytics[0] || {
                        totalOrders: 0,
                        totalRevenue: 0,
                        averageOrderValue: 0,
                        pendingOrders: 0,
                        confirmedOrders: 0,
                        processingOrders: 0,
                        shippedOrders: 0,
                        deliveredOrders: 0,
                        cancelledOrders: 0
                    },
                    dailyTrends,
                    topProducts
                }
            });
        } catch (error) {
            console.error('Error fetching order analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order analytics',
                error: error.message
            });
        }
    },

    // Admin: Get all orders
    getAllOrders: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                paymentStatus,
                search,
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filter
            const filter = {};
            
            if (status) filter.status = status;
            if (paymentStatus) filter['payment.status'] = paymentStatus;
            
            // Date range filter
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }

            // Search filter
            if (search) {
                filter.$or = [
                    { orderNumber: { $regex: search, $options: 'i' } },
                    { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
                    { 'shippingAddress.email': { $regex: search, $options: 'i' } }
                ];
            }

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const orders = await Order.find(filter)
                .populate('customer', 'name email phone')
                .populate('items.product', 'name images')
                .populate('items.vendor', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Order.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching all orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders',
                error: error.message
            });
        }
    },

    // Admin: Get pending orders for approval
    getPendingOrders: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Check admin role
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            // Build filter for pending orders
            const filter = { 
                status: 'pending_admin_approval',
                'adminApproval.status': 'pending'
            };

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const orders = await Order.find(filter)
                .populate('customer', 'name email phone')
                .populate('items.product', 'name images price vendor')
                .populate('items.vendor', 'name email phone')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Order.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching pending orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending orders',
                error: error.message
            });
        }
    },

    // Admin: Approve order and assign to vendors
    approveOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { adminNotes } = req.body;

            // Check admin role
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            const order = await Order.findById(id)
                .populate('customer', 'name email')
                .populate('items.product', 'name')
                .populate('items.vendor', 'name email');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.status !== 'pending_admin_approval') {
                return res.status(400).json({
                    success: false,
                    message: 'Order is not pending approval'
                });
            }

            // Update order status
            order.status = 'admin_approved';
            order.adminApproval.status = 'approved';
            order.adminApproval.approvedBy = req.user.id;
            order.adminApproval.approvedAt = new Date();
            if (adminNotes) order.adminNotes = adminNotes;

            // Group items by vendor and create vendor assignments
            const vendorGroups = {};
            order.items.forEach((item, index) => {
                const vendorId = item.vendor._id.toString();
                if (!vendorGroups[vendorId]) {
                    vendorGroups[vendorId] = {
                        vendor: item.vendor._id,
                        items: [],
                        status: 'pending',
                        assignedAt: new Date()
                    };
                }
                vendorGroups[vendorId].items.push(order.items[index]._id);
            });

            order.vendorAssignment = Object.values(vendorGroups);
            order.status = 'vendor_assigned';

            // Add notifications
            // Notify customer
            order.notifications.push({
                type: 'admin_approved',
                recipient: order.customer._id,
                message: `Your order #${order.orderNumber} has been approved and forwarded to vendors.`,
                isRead: false,
                sentAt: new Date()
            });

            // Notify vendors
            for (const vendorGroup of order.vendorAssignment) {
                order.notifications.push({
                    type: 'vendor_assigned',
                    recipient: vendorGroup.vendor,
                    message: `New order #${order.orderNumber} has been assigned to you. Please confirm your items.`,
                    isRead: false,
                    sentAt: new Date()
                });
            }

            await order.save();

            res.json({
                success: true,
                message: 'Order approved and assigned to vendors successfully',
                data: order
            });
        } catch (error) {
            console.error('Error approving order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve order',
                error: error.message
            });
        }
    },

    // Admin: Reject order
    rejectOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { rejectionReason } = req.body;

            // Check admin role
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            if (!rejectionReason) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required'
                });
            }

            const order = await Order.findById(id).populate('customer', 'name email');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.status !== 'pending_admin_approval') {
                return res.status(400).json({
                    success: false,
                    message: 'Order is not pending approval'
                });
            }

            // Update order status
            order.status = 'cancelled';
            order.adminApproval.status = 'rejected';
            order.adminApproval.rejectionReason = rejectionReason;
            order.cancelledAt = new Date();

            // Add notification to customer
            order.notifications.push({
                type: 'admin_rejected',
                recipient: order.customer._id,
                message: `Your order #${order.orderNumber} has been rejected. Reason: ${rejectionReason}`,
                isRead: false,
                sentAt: new Date()
            });

            await order.save();

            res.json({
                success: true,
                message: 'Order rejected successfully',
                data: order
            });
        } catch (error) {
            console.error('Error rejecting order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject order',
                error: error.message
            });
        }
    },

    // Vendor: Get assigned orders
    getAssignedOrders: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filter for vendor assigned orders
            const filter = {
                'vendorAssignment.vendor': req.user.id
            };

            if (status) {
                filter['vendorAssignment.status'] = status;
            }

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const orders = await Order.find(filter)
                .populate('customer', 'name email phone')
                .populate('items.product', 'name images price')
                .populate('vendorAssignment.vendor', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            // Filter to show only vendor's items
            const vendorOrders = orders.map(order => {
                const vendorAssignment = order.vendorAssignment.find(
                    va => va.vendor._id.toString() === req.user.id
                );
                
                const vendorItems = order.items.filter(item => 
                    item.vendor.toString() === req.user.id
                );

                return {
                    ...order.toObject(),
                    items: vendorItems,
                    vendorAssignment: vendorAssignment
                };
            });

            const total = await Order.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    orders: vendorOrders,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching assigned orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch assigned orders',
                error: error.message
            });
        }
    },

    // Vendor: Confirm assigned order
    confirmVendorOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { vendorNotes } = req.body;

            const order = await Order.findById(id)
                .populate('customer', 'name email')
                .populate('items.product', 'name');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Find vendor assignment
            const vendorAssignment = order.vendorAssignment.find(
                va => va.vendor.toString() === req.user.id
            );

            if (!vendorAssignment) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to this order'
                });
            }

            if (vendorAssignment.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Order assignment is not pending'
                });
            }

            // Update vendor assignment
            vendorAssignment.status = 'confirmed';
            vendorAssignment.confirmedAt = new Date();

            if (vendorNotes) order.vendorNotes = vendorNotes;

            // Check if all vendors have confirmed
            const allConfirmed = order.vendorAssignment.every(
                va => va.status === 'confirmed'
            );

            if (allConfirmed) {
                order.status = 'vendor_confirmed';
                
                // Add notification to customer for payment
                order.notifications.push({
                    type: 'vendor_confirmed',
                    recipient: order.customer._id,
                    message: `All vendors have confirmed your order #${order.orderNumber}. Please proceed with payment.`,
                    isRead: false,
                    sentAt: new Date()
                });
            }

            await order.save();

            res.json({
                success: true,
                message: 'Order confirmed successfully',
                data: order
            });
        } catch (error) {
            console.error('Error confirming vendor order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to confirm order',
                error: error.message
            });
        }
    },

    // Vendor: Reject assigned order
    rejectVendorOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { rejectionReason } = req.body;

            if (!rejectionReason) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required'
                });
            }

            const order = await Order.findById(id).populate('customer', 'name email');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Find vendor assignment
            const vendorAssignment = order.vendorAssignment.find(
                va => va.vendor.toString() === req.user.id
            );

            if (!vendorAssignment) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to this order'
                });
            }

            if (vendorAssignment.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Order assignment is not pending'
                });
            }

            // Update vendor assignment
            vendorAssignment.status = 'rejected';
            vendorAssignment.rejectionReason = rejectionReason;

            // Add notification to admin and customer
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                order.notifications.push({
                    type: 'vendor_rejected',
                    recipient: admin._id,
                    message: `Vendor rejected order #${order.orderNumber}. Reason: ${rejectionReason}`,
                    isRead: false,
                    sentAt: new Date()
                });
            }

            order.notifications.push({
                type: 'vendor_rejected',
                recipient: order.customer._id,
                message: `A vendor rejected part of your order #${order.orderNumber}. Admin will review and contact you.`,
                isRead: false,
                sentAt: new Date()
            });

            await order.save();

            res.json({
                success: true,
                message: 'Order rejected successfully',
                data: order
            });
        } catch (error) {
            console.error('Error rejecting vendor order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject order',
                error: error.message
            });
        }
    },

    // Initialize payment for confirmed order
    initializeOrderPayment: async (req, res) => {
        try {
            const { id } = req.params;

            const order = await Order.findById(id).populate('customer', 'name email');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if user owns this order
            if (order.customer._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to pay for this order'
                });
            }

            if (order.status !== 'vendor_confirmed') {
                return res.status(400).json({
                    success: false,
                    message: 'Order is not ready for payment'
                });
            }

            // Update order status to payment pending
            order.status = 'payment_pending';
            await order.save();

            // Here you would integrate with payment gateway
            // For now, return payment instructions
            res.json({
                success: true,
                message: 'Order is ready for payment',
                data: {
                    order,
                    paymentInstructions: 'Please proceed with payment using your preferred method.',
                    paymentMethods: ['sslcommerz', 'cod', 'bank_transfer']
                }
            });
        } catch (error) {
            console.error('Error initializing order payment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to initialize payment',
                error: error.message
            });
        }
    }
};

export default orderController;
