import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyOrders, useCancelOrder } from '../hooks/useEcommerceApi';
import useTheme from '../hooks/useTheme';
import useAuthStore from '../store/useAuthStore';

const Orders = () => {
    const { theme } = useTheme();
    const { isLoggedIn } = useAuthStore();
    const [cancelReason, setCancelReason] = useState('');
    const [cancellingOrderId, setCancellingOrderId] = useState(null);

    const { data: orders, isLoading, error } = useMyOrders();
    const cancelOrderMutation = useCancelOrder();

    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="text-center py-16">
                        <h1 className="text-3xl font-bold mb-4">Please sign in to view your orders</h1>
                        <Link
                            to="/signin"
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-block"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleCancelOrder = async (orderId) => {
        try {
            await cancelOrderMutation.mutateAsync({ 
                id: orderId, 
                reason: cancelReason || 'Customer requested cancellation' 
            });
            setCancellingOrderId(null);
            setCancelReason('');
        } catch (error) {
            console.error('Failed to cancel order:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'processing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
            case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const canCancelOrder = (order) => {
        return ['pending', 'confirmed'].includes(order.status) && order.paymentStatus !== 'paid';
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className={`h-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded w-1/4`}></div>
                        {[1, 2, 3].map((item) => (
                            <div key={item} className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                <div className={`h-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded w-1/3 mb-4`}></div>
                                <div className={`h-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded w-1/2 mb-2`}></div>
                                <div className={`h-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded w-1/4`}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-4">My Orders</h1>
                        <div className="mx-auto max-w-xl rounded-md border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-4 py-3 mb-4">
                            Failed to load orders. Please try again later.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const ordersList = orders?.data?.orders || [];

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">My Orders</h1>
                    <Link
                        to="/products"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>

                {ordersList.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📦</div>
                        <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            You haven't placed any orders yet. Start shopping to see your orders here.
                        </p>
                        <Link
                            to="/products"
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-block"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {ordersList.map((order) => (
                            <div key={order._id} className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                {/* Order Header */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">
                                            Order #{order.orderNumber}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 md:mt-0">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                        <span className="text-lg font-bold">
                                            ${order.totalAmount?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3 mb-4">
                                    {order.items?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <img
                                                src={item.product?.images && item.product.images.length > 0 
                                                    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${item.product.images[0]}` 
                                                    : '/placeholder-image.png'
                                                }
                                                alt={item.product?.name || 'Product'}
                                                className="w-16 h-16 object-cover rounded-md"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-medium">{item.product?.name || 'Unknown Product'}</h4>
                                                <p className="text-sm text-gray-500">
                                                    Quantity: {item.quantity} × ${item.price?.toFixed(2)}
                                                </p>
                                                {item.variant && (
                                                    <p className="text-xs text-gray-400">
                                                        Variant: {item.variant.name}
                                                    </p>
                                                )}
                                                {item.status && item.status !== order.status && (
                                                    <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${getStatusColor(item.status)}`}>
                                                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Shipping Info */}
                                {order.shippingAddress && (
                                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                        <h4 className="font-medium mb-2">Shipping Address</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {order.shippingAddress.fullName}<br />
                                            {order.shippingAddress.address}<br />
                                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                                            {order.shippingAddress.country}
                                        </p>
                                    </div>
                                )}

                                {/* Tracking Info */}
                                {order.trackingNumber && (
                                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                        <h4 className="font-medium mb-1">Tracking Information</h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Tracking Number: {order.trackingNumber}
                                        </p>
                                    </div>
                                )}

                                {/* Order Actions */}
                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Link
                                        to={`/orders/${order._id}`}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        View Details
                                    </Link>
                                    
                                    {canCancelOrder(order) && (
                                        <button
                                            onClick={() => setCancellingOrderId(order._id)}
                                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                                        >
                                            Cancel Order
                                        </button>
                                    )}

                                    {order.status === 'delivered' && (
                                        <Link
                                            to={`/reviews/create?order=${order._id}`}
                                            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm"
                                        >
                                            Leave Review
                                        </Link>
                                    )}
                                </div>

                                {/* Cancel Order Modal */}
                                {cancellingOrderId === order._id && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                        <div className={`max-w-md w-full mx-4 p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                                            <h3 className="text-lg font-semibold mb-4">Cancel Order</h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                Are you sure you want to cancel this order?
                                            </p>
                                            <textarea
                                                value={cancelReason}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                placeholder="Reason for cancellation (optional)"
                                                rows={3}
                                                className={`w-full px-3 py-2 border rounded-md mb-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCancelOrder(order._id)}
                                                    disabled={cancelOrderMutation.isPending}
                                                    className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCancellingOrderId(null);
                                                        setCancelReason('');
                                                    }}
                                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                                                >
                                                    Keep Order
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
