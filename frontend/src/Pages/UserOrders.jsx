import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const UserOrders = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const queryClient = useQueryClient();

    // Fetch user orders
    const { data: ordersData, isLoading, error } = useQuery({
        queryKey: ['user-orders', currentPage, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage,
                limit: '10'
            });
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/my-orders?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch orders');
            return response.json();
        }
    });

    // Initialize payment for confirmed order
    const paymentMutation = useMutation({
        mutationFn: async (orderId) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to initialize payment');
            return response.json();
        },
        onSuccess: (data) => {
            toast.success('Payment initiated successfully!');
            // Here you would typically redirect to payment gateway
            console.log('Payment data:', data);
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to initialize payment');
        }
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending_admin_approval': return 'bg-yellow-100 text-yellow-800';
            case 'admin_approved': return 'bg-blue-100 text-blue-800';
            case 'vendor_assigned': return 'bg-indigo-100 text-indigo-800';
            case 'vendor_confirmed': return 'bg-green-100 text-green-800';
            case 'payment_pending': return 'bg-orange-100 text-orange-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'pending_admin_approval': return 'Your order is being reviewed by admin';
            case 'admin_approved': return 'Order approved and being assigned to vendors';
            case 'vendor_assigned': return 'Order assigned to vendors for confirmation';
            case 'vendor_confirmed': return 'Vendors confirmed - proceed with payment';
            case 'payment_pending': return 'Payment required to continue';
            case 'paid': return 'Payment successful - order being processed';
            case 'processing': return 'Order is being prepared';
            case 'shipped': return 'Order shipped and on the way';
            case 'delivered': return 'Order successfully delivered';
            case 'cancelled': return 'Order has been cancelled';
            default: return 'Order status unknown';
        }
    };

    const canPayNow = (order) => {
        return order.status === 'vendor_confirmed' || order.status === 'payment_pending';
    };

    const showOrderDetail = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    const initiatePayment = (orderId) => {
        paymentMutation.mutate(orderId);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 mb-4">Error loading orders</div>
                <p className="text-gray-600">{error.message}</p>
            </div>
        );
    }

    const orders = ordersData?.data?.orders || [];
    const pagination = ordersData?.data?.pagination || {};

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                <div className="flex items-center space-x-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Orders</option>
                        <option value="pending_admin_approval">Pending Approval</option>
                        <option value="vendor_assigned">Assigned to Vendors</option>
                        <option value="vendor_confirmed">Ready for Payment</option>
                        <option value="paid">Paid</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="text-sm text-gray-500">
                        {orders.length} orders found
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="text-gray-500 mb-4">No orders found</div>
                    <p className="text-gray-400">You haven't placed any orders yet</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white shadow-lg rounded-lg p-6 border">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Order #{order.orderNumber}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status?.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                        <p className="text-lg font-bold text-gray-900 mt-1">
                                            ৳{order.total?.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Status Message */}
                                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">Status:</span> {getStatusMessage(order.status)}
                                    </p>
                                </div>

                                {/* Order Items Summary */}
                                <div className="mb-4">
                                    <div className="flex items-center space-x-4 overflow-x-auto">
                                        {order.items?.slice(0, 3).map((item, index) => (
                                            <div key={index} className="flex items-center space-x-2 min-w-max">
                                                {item.productImage && (
                                                    <img 
                                                        src={`${import.meta.env.VITE_API_URL}${item.productImage}`}
                                                        alt={item.productName}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Qty: {item.quantity} × ৳{item.unitPrice}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {order.items?.length > 3 && (
                                            <span className="text-sm text-gray-500 min-w-max">
                                                +{order.items.length - 3} more items
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Order Progress */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                        <span>Order Placed</span>
                                        <span>Admin Review</span>
                                        <span>Vendor Confirm</span>
                                        <span>Payment</span>
                                        <span>Delivery</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: 
                                                    order.status === 'pending_admin_approval' ? '20%' :
                                                    order.status === 'admin_approved' || order.status === 'vendor_assigned' ? '40%' :
                                                    order.status === 'vendor_confirmed' || order.status === 'payment_pending' ? '60%' :
                                                    order.status === 'paid' || order.status === 'processing' ? '80%' :
                                                    order.status === 'shipped' || order.status === 'delivered' ? '100%' :
                                                    '20%'
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Notifications */}
                                {order.notifications && order.notifications.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Updates:</h4>
                                        <div className="space-y-1">
                                            {order.notifications
                                                .filter(notif => notif.recipient === order.customer)
                                                .slice(0, 2)
                                                .map((notification, index) => (
                                                    <p key={index} className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
                                                        {notification.message}
                                                        <span className="ml-2 text-gray-400">
                                                            {new Date(notification.sentAt).toLocaleDateString()}
                                                        </span>
                                                    </p>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => showOrderDetail(order)}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                    >
                                        View Details
                                    </button>
                                    <div className="flex space-x-2">
                                        {canPayNow(order) && (
                                            <button
                                                onClick={() => initiatePayment(order._id)}
                                                disabled={paymentMutation.isPending}
                                                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                {paymentMutation.isPending ? 'Processing...' : 'Pay Now'}
                                            </button>
                                        )}
                                        {(order.status === 'pending_admin_approval' || order.status === 'vendor_assigned') && (
                                            <button
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-2">
                                    Page {currentPage} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                                    disabled={currentPage === pagination.pages}
                                    className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Order Details Modal */}
            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Order #{selectedOrder.orderNumber} Details
                            </h3>
                            <button
                                onClick={() => setShowOrderDetails(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="mb-6">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">Order Date</p>
                                    <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status?.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Order Items</h4>
                            <div className="space-y-3">
                                {selectedOrder.items?.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                                        {item.productImage && (
                                            <img 
                                                src={`${import.meta.env.VITE_API_URL}${item.productImage}`}
                                                alt={item.productName}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.productName}</p>
                                            <p className="text-sm text-gray-600">
                                                Quantity: {item.quantity} × ৳{item.unitPrice}
                                            </p>
                                            <p className="text-sm font-medium text-gray-900">
                                                Total: ৳{item.totalPrice.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Shipping Address</h4>
                            <div className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">{selectedOrder.shippingAddress?.fullName}</p>
                                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.address}</p>
                                <p className="text-sm text-gray-600">
                                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.zipCode}
                                </p>
                                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.phone}</p>
                            </div>
                        </div>

                        {/* Order Total */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-gray-900">Total Amount</span>
                                <span className="text-lg font-bold text-gray-900">
                                    ৳{selectedOrder.total?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserOrders;
