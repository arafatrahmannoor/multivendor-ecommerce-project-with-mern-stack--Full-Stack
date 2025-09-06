import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const VendorAssignedOrders = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [vendorNotes, setVendorNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const queryClient = useQueryClient();

    // Fetch assigned orders
    const { data: ordersData, isLoading, error } = useQuery({
        queryKey: ['vendor-assigned-orders', currentPage, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage,
                limit: '10'
            });
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/vendor/assigned?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch assigned orders');
            return response.json();
        }
    });

    // Confirm order mutation
    const confirmOrderMutation = useMutation({
        mutationFn: async ({ orderId, vendorNotes }) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/vendor/${orderId}/confirm`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ vendorNotes })
            });
            if (!response.ok) throw new Error('Failed to confirm order');
            return response.json();
        },
        onSuccess: () => {
            toast.success('Order confirmed successfully!');
            queryClient.invalidateQueries(['vendor-assigned-orders']);
            setShowConfirmModal(false);
            setSelectedOrder(null);
            setVendorNotes('');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to confirm order');
        }
    });

    // Reject order mutation
    const rejectOrderMutation = useMutation({
        mutationFn: async ({ orderId, rejectionReason }) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/vendor/${orderId}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ rejectionReason })
            });
            if (!response.ok) throw new Error('Failed to reject order');
            return response.json();
        },
        onSuccess: () => {
            toast.success('Order rejected successfully');
            queryClient.invalidateQueries(['vendor-assigned-orders']);
            setShowRejectModal(false);
            setSelectedOrder(null);
            setRejectionReason('');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to reject order');
        }
    });

    const handleConfirm = (order) => {
        setSelectedOrder(order);
        setShowConfirmModal(true);
    };

    const handleReject = (order) => {
        setSelectedOrder(order);
        setShowRejectModal(true);
    };

    const confirmOrder = () => {
        if (selectedOrder) {
            confirmOrderMutation.mutate({
                orderId: selectedOrder._id,
                vendorNotes
            });
        }
    };

    const rejectOrder = () => {
        if (selectedOrder && rejectionReason.trim()) {
            rejectOrderMutation.mutate({
                orderId: selectedOrder._id,
                rejectionReason
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getOrderStatusColor = (status) => {
        switch (status) {
            case 'vendor_assigned': return 'bg-blue-100 text-blue-800';
            case 'vendor_confirmed': return 'bg-green-100 text-green-800';
            case 'payment_pending': return 'bg-yellow-100 text-yellow-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'processing': return 'bg-indigo-100 text-indigo-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
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
                <div className="text-red-600 mb-4">Error loading assigned orders</div>
                <p className="text-gray-600">{error.message}</p>
            </div>
        );
    }

    const orders = ordersData?.data?.orders || [];
    const pagination = ordersData?.data?.pagination || {};

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Assigned Orders</h1>
                <div className="flex items-center space-x-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <div className="text-sm text-gray-500">
                        {orders.length} orders assigned
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="text-gray-500 mb-4">No assigned orders</div>
                    <p className="text-gray-400">You have no orders assigned by admin</p>
                </div>
            ) : (
                <>
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Your Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assignment Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{order.orderNumber}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {order.customer?.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {order.customer?.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {order.items?.length} items
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {order.items?.map((item, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-1">
                                                        {item.productImage && (
                                                            <img 
                                                                src={`${import.meta.env.VITE_API_URL}${item.productImage}`}
                                                                alt={item.productName}
                                                                className="w-8 h-8 object-cover rounded"
                                                            />
                                                        )}
                                                        <span>
                                                            {item.productName} x{item.quantity}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                ৳{order.items?.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                                                {order.status?.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.vendorAssignment?.status)}`}>
                                                {order.vendorAssignment?.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {order.vendorAssignment?.status === 'pending' ? (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleConfirm(order)}
                                                        className="bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700 transition-colors"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(order)}
                                                        className="bg-red-600 text-white px-3 py-1 rounded-md text-xs hover:bg-red-700 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-xs">
                                                    {order.vendorAssignment?.status === 'confirmed' ? 'Confirmed' : 'Rejected'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

            {/* Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Confirm Order #{selectedOrder?.orderNumber}
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vendor Notes (Optional)
                            </label>
                            <textarea
                                value={vendorNotes}
                                onChange={(e) => setVendorNotes(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                rows="3"
                                placeholder="Add any notes about this order confirmation..."
                            />
                        </div>
                        <div className="mb-4 text-sm text-gray-600">
                            By confirming this order, you agree to fulfill the items assigned to you. 
                            Once all vendors confirm, the customer will be notified to proceed with payment.
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setSelectedOrder(null);
                                    setVendorNotes('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmOrder}
                                disabled={confirmOrderMutation.isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {confirmOrderMutation.isPending ? 'Confirming...' : 'Confirm Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Reject Order #{selectedOrder?.orderNumber}
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows="3"
                                placeholder="Please provide a reason for rejecting this order assignment..."
                                required
                            />
                        </div>
                        <div className="mb-4 text-sm text-gray-600">
                            Rejecting this order will notify the admin and customer. 
                            Please provide a clear reason for rejection.
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedOrder(null);
                                    setRejectionReason('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={rejectOrder}
                                disabled={rejectOrderMutation.isPending || !rejectionReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {rejectOrderMutation.isPending ? 'Rejecting...' : 'Reject Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorAssignedOrders;
