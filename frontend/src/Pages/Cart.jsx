import React from 'react';
import { Link } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import useCartStore from '../store/useCartStore';

const Cart = () => {
    const { theme } = useTheme();
    const {
        items,
        updateQuantity,
        removeItem,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getShippingCost,
        getGrandTotal
    } = useCartStore();

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();
    const shippingCost = getShippingCost();
    const grandTotal = getGrandTotal();

    if (items.length === 0) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🛒</div>
                        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            Looks like you haven't added anything to your cart yet.
                        </p>
                        <Link
                            to="/products"
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-block"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Shopping Cart</h1>
                    <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 text-sm underline"
                    >
                        Clear all items
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className="p-6">
                                <div className="space-y-6">
                                    {items.map((item) => {
                                        const product = item.product;
                                        const price = item.variant?.price || product.price;
                                        const subtotal = price * item.quantity;

                                        return (
                                            <div key={item.id} className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                                {/* Product Image */}
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={product.images && product.images.length > 0 
                                                            ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${product.images[0]}` 
                                                            : '/placeholder-image.png'
                                                        }
                                                        alt={product.name}
                                                        className="w-20 h-20 object-cover rounded-md"
                                                    />
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1 min-w-0">
                                                    <Link 
                                                        to={`/products/${product._id}`}
                                                        className="text-lg font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 block truncate"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    {item.variant && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Variant: {item.variant.name}
                                                        </p>
                                                    )}
                                                    <p className="text-lg font-semibold text-indigo-600 mt-2">
                                                        ${price.toFixed(2)} each
                                                    </p>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className={`w-8 h-8 rounded-full border ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'} flex items-center justify-center`}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-12 text-center font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className={`w-8 h-8 rounded-full border ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'} flex items-center justify-center`}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {/* Subtotal and Remove */}
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold mb-2">
                                                        ${subtotal.toFixed(2)}
                                                    </p>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                            
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between">
                                    <span>Subtotal ({totalItems} items)</span>
                                    <span>${totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>
                                        {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                                    </span>
                                </div>
                                {shippingCost === 0 && totalPrice > 0 && (
                                    <p className="text-sm text-green-600">
                                        🎉 You qualify for free shipping!
                                    </p>
                                )}
                                {shippingCost > 0 && (
                                    <p className="text-sm text-gray-500">
                                        Free shipping on orders over $100
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total</span>
                                    <span>${grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    to="/checkout"
                                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors block text-center font-medium"
                                >
                                    Proceed to Checkout
                                </Link>
                                <Link
                                    to="/products"
                                    className={`w-full py-3 px-4 rounded-lg transition-colors block text-center font-medium border ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Continue Shopping
                                </Link>
                            </div>

                            {/* Promo Code */}
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-medium mb-2">
                                    Promo Code
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                                    />
                                    <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Security Info */}
                        <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>🔒</span>
                                <span>Secure checkout with SSL encryption</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
