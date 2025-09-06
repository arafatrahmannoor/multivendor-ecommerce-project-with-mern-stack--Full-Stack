/* eslint-env node */
/* global process */

import SSLCommerzPayment from 'sslcommerz-lts';
import Order from '../model/order.js';
import Product from '../model/product.js';
import User from '../model/user.js';
import Cart from '../model/cart.js';

// SSLCommerz Configuration
const store_id = process.env.SSLCOMMERZ_STORE_ID || 'your_store_id';
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || 'your_store_password';
const is_live = process.env.NODE_ENV === 'production'; // true for live, false for sandbox

const paymentController = {
    // Initialize payment
    initializePayment: async (req, res) => {
        try {
            console.log('=== PAYMENT INITIALIZATION DEBUG ===');
            console.log('Request headers:', req.headers);
            console.log('Request user:', req.user);
            console.log('Auth header:', req.headers.authorization);
            console.log('Request body keys:', Object.keys(req.body));
            
            if (!req.user) {
                console.log('ERROR: req.user is undefined - authentication failed');
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    error: 'User not authenticated'
                });
            }
            
            const {
                items, // Optional: can come from request body or cart
                useCart = false, // Flag to use items from cart
                shippingAddress,
                billingAddress,
                paymentMethod = 'sslcommerz',
                customerNotes
            } = req.body;

            let orderItems = [];
            let subtotal = 0;
            let serviceCharge = 0;

            if (useCart) {
                // Use items from user's cart
                const cart = await Cart.findOne({ user: req.user.id })
                    .populate('items.product', 'name price images status inventory vendor category')
                    .populate('items.vendor', 'name email');

                if (!cart || cart.items.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cart is empty'
                    });
                }

                // Validate cart items and prepare for order
                for (const cartItem of cart.items) {
                    const product = cartItem.product;

                    if (!product || product.status !== 'active') {
                        return res.status(400).json({
                            success: false,
                            message: `Product "${cartItem.productName}" is no longer available`
                        });
                    }

                    if (product.inventory.trackQuantity && product.inventory.quantity < cartItem.quantity) {
                        return res.status(400).json({
                            success: false,
                            message: `Insufficient stock for "${product.name}". Available: ${product.inventory.quantity}`
                        });
                    }

                    orderItems.push({
                        product: product._id,
                        vendor: cartItem.vendor || product.vendor, // Use cart vendor or product vendor as fallback
                        productName: cartItem.productName,
                        productImage: cartItem.productImage,
                        variant: cartItem.variant,
                        quantity: cartItem.quantity,
                        unitPrice: cartItem.unitPrice,
                        totalPrice: cartItem.totalPrice
                    });

                    subtotal += cartItem.totalPrice;

                    // Calculate service charge from category
                    if (product.category && product.category.serviceCharge) {
                        serviceCharge += cartItem.totalPrice * (product.category.serviceCharge / 100);
                    }
                }
            } else {
                // Use items from request body (existing functionality)
                if (!items || items.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Order items are required'
                    });
                }

                // Validate and calculate order totals (existing code)
                for (const item of items) {
                    const product = await Product.findById(item.productId)
                        .populate('category', 'serviceCharge')
                        .populate('vendor', 'name email');

                    if (!product) {
                        return res.status(400).json({
                            success: false,
                            message: `Product not found: ${item.productId}`
                        });
                    }

                    if (product.status !== 'active') {
                        return res.status(400).json({
                            success: false,
                            message: `Product is not available: ${product.name}`
                        });
                    }

                    // Check inventory
                    if (product.inventory.trackQuantity && product.inventory.quantity < item.quantity) {
                        return res.status(400).json({
                            success: false,
                            message: `Insufficient stock for ${product.name}. Available: ${product.inventory.quantity}`
                        });
                    }

                    const unitPrice = product.price;
                    const totalPrice = unitPrice * item.quantity;
                    subtotal += totalPrice;

                    // Calculate service charge from category
                    if (product.category && product.category.serviceCharge) {
                        serviceCharge += totalPrice * (product.category.serviceCharge / 100);
                    }

                    console.log('Product debug:', {
                        productId: product._id,
                        productName: product.name,
                        vendor: product.vendor,
                        vendorId: product.vendor?._id
                    });

                    // Ensure vendor exists
                    if (!product.vendor || !product.vendor._id) {
                        return res.status(400).json({
                            success: false,
                            message: `Product ${product.name} does not have a vendor assigned. Please contact admin.`
                        });
                    }
                    orderItems.push({
                        product: product._id,
                        vendor: product.vendor._id,
                        productName: product.name,
                        productImage: product.images[0]?.url || '',
                        variant: item.variant || {},
                        quantity: item.quantity,
                        unitPrice,
                        totalPrice
                    });
                }
            }

            if (!shippingAddress) {
                return res.status(400).json({
                    success: false,
                    message: 'Shipping address is required'
                });
            }

            // Calculate totals
            const tax = subtotal * 0.05; // 5% tax
            const shippingCost = subtotal > 1000 ? 0 : 60; // Free shipping over 1000
            const total = subtotal + tax + shippingCost + serviceCharge;

            // Create order with new workflow
            const order = new Order({
                customer: req.user.id,
                items: orderItems,
                subtotal,
                tax,
                shippingCost,
                serviceCharge,
                total,
                shippingAddress,
                billingAddress: billingAddress?.sameAsShipping !== false ? shippingAddress : billingAddress,
                payment: {
                    method: paymentMethod,
                    status: 'pending'
                },
                customerNotes,
                status: 'pending_admin_approval', // New workflow starts with admin approval
                adminApproval: {
                    status: 'pending'
                },
                notifications: [{
                    type: 'order_placed',
                    recipient: req.user.id,
                    message: `Your order #${orderItems.length > 0 ? 'ORD-' + Date.now() : 'ORD'} has been placed and is pending admin approval.`,
                    isRead: false,
                    sentAt: new Date()
                }]
            });

            await order.save();

            // Send notification to all admins about new order
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                order.notifications.push({
                    type: 'order_placed',
                    recipient: admin._id,
                    message: `New order #${order.orderNumber} received from ${shippingAddress.fullName} and requires approval.`,
                    isRead: false,
                    sentAt: new Date()
                });
            }

            await order.save();

            // Calculate vendor payouts (for future use)
            order.calculateVendorPayouts();
            await order.save();

            // Clear cart if used
            if (useCart) {
                const cart = await Cart.findOne({ user: req.user.id });
                if (cart) {
                    await cart.clearCart();
                }
            }

            // For new workflow, return success without payment gateway initially
            return res.status(201).json({
                success: true,
                message: 'Order placed successfully! Your order is pending admin approval. You will be notified once approved.',
                data: {
                    order,
                    workflowStep: 'pending_admin_approval',
                    nextStep: 'Admin will review your order and forward it to the appropriate vendors.'
                }
            });

        } catch (error) {
            console.error('Error initializing payment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to initialize payment',
                error: error.message
            });
        }
    },

    // Payment success callback
    paymentSuccess: async (req, res) => {
        try {
            const { tran_id, val_id } = req.body;

            if (!tran_id || !val_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction ID and Validation ID are required'
                });
            }

            // Validate payment with SSLCommerz
            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
            const validation = await sslcz.validate({ val_id });

            if (validation.status === 'VALID') {
                // Find and update order
                const order = await Order.findOne({ orderNumber: tran_id });
                
                if (!order) {
                    return res.status(404).json({
                        success: false,
                        message: 'Order not found'
                    });
                }

                if (order.payment.status === 'paid') {
                    return res.json({
                        success: true,
                        message: 'Payment already processed',
                        data: order
                    });
                }

                // Update order payment status
                order.payment.status = 'paid';
                order.payment.transactionId = val_id;
                order.payment.paymentGatewayResponse = validation;
                order.payment.paidAt = new Date();
                order.status = 'confirmed';
                order.confirmedAt = new Date();

                        await order.save();

                        // Clear user's cart after successful payment
                        const cart = await Cart.findOne({ user: order.customer });
                        if (cart) {
                            await cart.clearCart();
                        }

                        // Update product inventory
                        for (const item of order.items) {
                            if (item.product.inventory?.trackQuantity) {
                                await Product.findByIdAndUpdate(
                                    item.product,
                                    { 
                                        $inc: { 
                                            'inventory.quantity': -item.quantity,
                                            'totalSales': item.totalPrice,
                                            'salesCount': item.quantity
                                        }
                                    }
                                );
                            }
                        }                res.json({
                    success: true,
                    message: 'Payment successful',
                    data: order
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Payment validation failed',
                    error: validation
                });
            }
        } catch (error) {
            console.error('Error processing payment success:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process payment',
                error: error.message
            });
        }
    },

    // Payment failure callback
    paymentFailed: async (req, res) => {
        try {
            const { tran_id } = req.body;

            const order = await Order.findOne({ orderNumber: tran_id });
            if (order) {
                order.payment.status = 'failed';
                order.status = 'cancelled';
                order.cancelledAt = new Date();
                await order.save();
            }

            res.json({
                success: false,
                message: 'Payment failed',
                data: { orderNumber: tran_id }
            });
        } catch (error) {
            console.error('Error processing payment failure:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process payment failure',
                error: error.message
            });
        }
    },

    // Payment cancelled callback
    paymentCancelled: async (req, res) => {
        try {
            const { tran_id } = req.body;

            const order = await Order.findOne({ orderNumber: tran_id });
            if (order) {
                order.payment.status = 'failed';
                order.status = 'cancelled';
                order.cancelledAt = new Date();
                order.cancellationReason = 'Payment cancelled by user';
                await order.save();
            }

            res.json({
                success: false,
                message: 'Payment cancelled',
                data: { orderNumber: tran_id }
            });
        } catch (error) {
            console.error('Error processing payment cancellation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process payment cancellation',
                error: error.message
            });
        }
    },

    // IPN (Instant Payment Notification) handler
    handleIPN: async (req, res) => {
        try {
            const { tran_id, val_id, status } = req.body;

            console.log('IPN received:', req.body);

            if (status === 'VALID') {
                // Validate with SSLCommerz
                const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
                const validation = await sslcz.validate({ val_id });

                if (validation.status === 'VALID') {
                    const order = await Order.findOne({ orderNumber: tran_id });
                    
                    if (order && order.payment.status !== 'paid') {
                        order.payment.status = 'paid';
                        order.payment.transactionId = val_id;
                        order.payment.paymentGatewayResponse = validation;
                        order.payment.paidAt = new Date();
                        order.status = 'confirmed';
                        order.confirmedAt = new Date();

                        await order.save();

                        // Clear user's cart after successful payment
                        const cart = await Cart.findOne({ user: order.customer });
                        if (cart) {
                            await cart.clearCart();
                        }

                        // Update product inventory
                        for (const item of order.items) {
                            await Product.findByIdAndUpdate(
                                item.product,
                                { 
                                    $inc: { 
                                        'inventory.quantity': -item.quantity,
                                        'totalSales': item.totalPrice,
                                        'salesCount': item.quantity
                                    }
                                }
                            );
                        }
                    }
                }
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Error handling IPN:', error);
            res.status(500).send('ERROR');
        }
    },

    // Validate payment status
    validatePayment: async (req, res) => {
        try {
            const { orderNumber } = req.params;

            const order = await Order.findOne({ 
                orderNumber,
                customer: req.user.id 
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                data: {
                    orderNumber: order.orderNumber,
                    paymentStatus: order.payment.status,
                    orderStatus: order.status,
                    total: order.total,
                    transactionId: order.payment.transactionId
                }
            });
        } catch (error) {
            console.error('Error validating payment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to validate payment',
                error: error.message
            });
        }
    },

    // Refund payment
    refundPayment: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { refundAmount, reason } = req.body;

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.payment.status !== 'paid') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot refund unpaid order'
                });
            }

            const refundData = {
                refund_amount: refundAmount || order.total,
                refund_remarks: reason || 'Customer refund request',
                bank_tran_id: order.payment.transactionId,
                refe_id: order.orderNumber
            };

            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
            const refundResponse = await sslcz.refund(refundData);

            if (refundResponse.status === 'SUCCESS') {
                order.payment.status = refundAmount >= order.total ? 'refunded' : 'partial_refund';
                order.payment.refundedAt = new Date();
                order.payment.refundAmount = refundAmount || order.total;
                order.status = 'refunded';
                
                await order.save();

                // Restore inventory if fully refunded
                if (refundAmount >= order.total) {
                    for (const item of order.items) {
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

                res.json({
                    success: true,
                    message: 'Refund processed successfully',
                    data: {
                        refundId: refundResponse.refund_ref_id,
                        amount: refundAmount || order.total,
                        status: refundResponse.status
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Refund failed',
                    error: refundResponse
                });
            }
        } catch (error) {
            console.error('Error processing refund:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process refund',
                error: error.message
            });
        }
    }
};

export default paymentController;
