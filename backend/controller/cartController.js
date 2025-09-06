/* eslint-env node */

import Cart from '../model/cart.js';
import Product from '../model/product.js';
import { sendEmail } from '../utils/mailer.js';

const cartController = {
    // Get user's cart
    getCart: async (req, res) => {
        try {
            let cart = await Cart.getOrCreateCart(req.user.id);
            
            // Populate the cart if it has items
            if (cart.items.length > 0) {
                cart = await cart
                    .populate({
                        path: 'items.product',
                        select: 'name price images status inventory vendor slug',
                        populate: {
                            path: 'vendor',
                            select: 'name'
                        }
                    });
            }

            // Update availability status for cart items
            let hasUnavailableItems = false;
            for (const item of cart.items) {
                if (!item.product || item.product.status !== 'active') {
                    item.isAvailable = false;
                    hasUnavailableItems = true;
                } else if (item.product.inventory.trackQuantity && 
                          item.product.inventory.quantity < item.quantity) {
                    item.isAvailable = false;
                    hasUnavailableItems = true;
                } else {
                    item.isAvailable = true;
                }
            }

            if (hasUnavailableItems) {
                await cart.save();
            }

            res.json({
                success: true,
                message: 'Cart retrieved successfully',
                data: {
                    cart,
                    summary: {
                        itemCount: cart.itemCount,
                        subtotal: cart.subtotal,
                        tax: cart.tax,
                        shippingCost: cart.shippingCost,
                        serviceCharge: cart.serviceCharge,
                        discount: cart.discount,
                        total: cart.total
                    }
                }
            });
        } catch (error) {
            console.error('Error getting cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get cart',
                error: error.message
            });
        }
    },

    // Add item to cart
    addToCart: async (req, res) => {
        try {
            const { productId, quantity = 1, variant = {} } = req.body;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
            }

            if (quantity < 1 || quantity > 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be between 1 and 10'
                });
            }

            // Get product details
            const product = await Product.findById(productId)
                .populate('vendor', 'name')
                .populate('category', 'serviceCharge');

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (product.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Product is not available for purchase'
                });
            }

            // Check inventory
            if (product.inventory.trackQuantity && product.inventory.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.inventory.quantity} items available in stock`,
                    availableQuantity: product.inventory.quantity
                });
            }

            // Get or create cart
            const cart = await Cart.getOrCreateCart(req.user.id);

            // Check if item already exists with same variant
            const existingItemIndex = cart.items.findIndex(item => 
                item.product.toString() === productId &&
                JSON.stringify(item.variant) === JSON.stringify(variant)
            );

            if (existingItemIndex > -1) {
                // Update existing item
                const newQuantity = cart.items[existingItemIndex].quantity + quantity;
                
                // Check total quantity against stock
                if (product.inventory.trackQuantity && product.inventory.quantity < newQuantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot add ${quantity} more items. Only ${product.inventory.quantity - cart.items[existingItemIndex].quantity} available`,
                        availableQuantity: product.inventory.quantity - cart.items[existingItemIndex].quantity
                    });
                }

                cart.items[existingItemIndex].quantity = newQuantity;
                cart.items[existingItemIndex].totalPrice = newQuantity * cart.items[existingItemIndex].unitPrice;
                cart.items[existingItemIndex].addedAt = new Date();
            } else {
                // Add new item
                const newItem = {
                    product: product._id,
                    productName: product.name,
                    productImage: product.images[0]?.url || '',
                    quantity,
                    unitPrice: product.price,
                    totalPrice: product.price * quantity,
                    variant,
                    vendor: product.vendor._id,
                    addedAt: new Date(),
                    isAvailable: true
                };
                cart.items.push(newItem);
            }

            await cart.save();

            // Populate cart for response
            await cart.populate({
                path: 'items.product',
                select: 'name price images status inventory vendor slug'
            });

            res.status(201).json({
                success: true,
                message: 'Item added to cart successfully',
                data: {
                    cart,
                    addedItem: {
                        productName: product.name,
                        quantity,
                        unitPrice: product.price,
                        totalPrice: product.price * quantity
                    },
                    summary: {
                        itemCount: cart.itemCount,
                        subtotal: cart.subtotal,
                        total: cart.total
                    }
                }
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add item to cart',
                error: error.message
            });
        }
    },

    // Update cart item quantity
    updateCartItem: async (req, res) => {
        try {
            const { itemId } = req.params;
            const { quantity } = req.body;

            if (!quantity || quantity < 1 || quantity > 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be between 1 and 10'
                });
            }

            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            const item = cart.items.find(item => item._id.toString() === itemId);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found in cart'
                });
            }

            // Check product availability and stock
            const product = await Product.findById(item.product);
            if (!product || product.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Product is no longer available'
                });
            }

            if (product.inventory.trackQuantity && product.inventory.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.inventory.quantity} items available in stock`,
                    availableQuantity: product.inventory.quantity
                });
            }

            // Update item
            item.quantity = quantity;
            item.totalPrice = item.unitPrice * quantity;
            item.addedAt = new Date();

            await cart.save();

            // Populate for response
            await cart.populate({
                path: 'items.product',
                select: 'name price images status inventory vendor slug'
            });

            res.json({
                success: true,
                message: 'Cart item updated successfully',
                data: {
                    cart,
                    updatedItem: item,
                    summary: {
                        itemCount: cart.itemCount,
                        subtotal: cart.subtotal,
                        total: cart.total
                    }
                }
            });
        } catch (error) {
            console.error('Error updating cart item:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update cart item',
                error: error.message
            });
        }
    },

    // Remove item from cart
    removeFromCart: async (req, res) => {
        try {
            const { itemId } = req.params;

            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found in cart'
                });
            }

            const removedItem = cart.items[itemIndex];
            cart.items.splice(itemIndex, 1);

            await cart.save();

            // Populate for response
            await cart.populate({
                path: 'items.product',
                select: 'name price images status inventory vendor slug'
            });

            res.json({
                success: true,
                message: 'Item removed from cart successfully',
                data: {
                    cart,
                    removedItem: {
                        productName: removedItem.productName,
                        quantity: removedItem.quantity
                    },
                    summary: {
                        itemCount: cart.itemCount,
                        subtotal: cart.subtotal,
                        total: cart.total
                    }
                }
            });
        } catch (error) {
            console.error('Error removing from cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove item from cart',
                error: error.message
            });
        }
    },

    // Clear entire cart
    clearCart: async (req, res) => {
        try {
            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            const itemCount = cart.itemCount;
            await cart.clearCart();

            res.json({
                success: true,
                message: 'Cart cleared successfully',
                data: {
                    cart,
                    clearedItemCount: itemCount
                }
            });
        } catch (error) {
            console.error('Error clearing cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clear cart',
                error: error.message
            });
        }
    },

    // Get cart summary (lightweight endpoint)
    getCartSummary: async (req, res) => {
        try {
            const cart = await Cart.findOne({ user: req.user.id })
                .select('itemCount subtotal tax shippingCost serviceCharge discount total items');

            if (!cart) {
                return res.json({
                    success: true,
                    data: {
                        itemCount: 0,
                        subtotal: 0,
                        tax: 0,
                        shippingCost: 0,
                        serviceCharge: 0,
                        discount: 0,
                        total: 0,
                        hasItems: false
                    }
                });
            }

            res.json({
                success: true,
                data: {
                    itemCount: cart.itemCount,
                    subtotal: cart.subtotal,
                    tax: cart.tax,
                    shippingCost: cart.shippingCost,
                    serviceCharge: cart.serviceCharge,
                    discount: cart.discount,
                    total: cart.total,
                    hasItems: cart.items.length > 0,
                    lastModified: cart.lastModified
                }
            });
        } catch (error) {
            console.error('Error getting cart summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get cart summary',
                error: error.message
            });
        }
    },

    // Check if product is in cart
    checkProductInCart: async (req, res) => {
        try {
            const { productId } = req.params;
            const { variant } = req.query;

            const cart = await Cart.findOne({ user: req.user.id });
            
            if (!cart) {
                return res.json({
                    success: true,
                    data: {
                        inCart: false,
                        quantity: 0
                    }
                });
            }

            const variantObj = variant ? JSON.parse(variant) : {};
            const item = cart.items.find(item => 
                item.product.toString() === productId &&
                JSON.stringify(item.variant) === JSON.stringify(variantObj)
            );

            res.json({
                success: true,
                data: {
                    inCart: !!item,
                    quantity: item ? item.quantity : 0,
                    itemId: item ? item._id : null
                }
            });
        } catch (error) {
            console.error('Error checking product in cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check product in cart',
                error: error.message
            });
        }
    },

    // Move cart to order (used during checkout)
    moveToOrder: async (req, res) => {
        try {
            const cart = await Cart.findOne({ user: req.user.id })
                .populate('items.product', 'name price images status inventory vendor');

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            // Validate all items are still available
            const unavailableItems = [];
            const orderItems = [];

            for (const item of cart.items) {
                if (!item.product || item.product.status !== 'active') {
                    unavailableItems.push(item.productName);
                    continue;
                }

                if (item.product.inventory.trackQuantity && 
                    item.product.inventory.quantity < item.quantity) {
                    unavailableItems.push(`${item.productName} (only ${item.product.inventory.quantity} available)`);
                    continue;
                }

                orderItems.push({
                    product: item.product._id,
                    vendor: item.vendor,
                    productName: item.productName,
                    productImage: item.productImage,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    variant: item.variant
                });
            }

            if (unavailableItems.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Some items are no longer available',
                    unavailableItems
                });
            }

            // Mark cart as converted
            cart.status = 'converted';
            await cart.save();

            res.json({
                success: true,
                message: 'Cart ready for order',
                data: {
                    items: orderItems,
                    summary: {
                        subtotal: cart.subtotal,
                        tax: cart.tax,
                        shippingCost: cart.shippingCost,
                        serviceCharge: cart.serviceCharge,
                        total: cart.total
                    }
                }
            });
        } catch (error) {
            console.error('Error moving cart to order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process cart for order',
                error: error.message
            });
        }
    }
};

export default cartController;
