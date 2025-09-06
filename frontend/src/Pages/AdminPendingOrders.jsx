import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const AdminPendingOrders = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const queryClient = useQueryClient();

    // Fetch pending orders
    const { data: ordersData, isLoading, error } = useQuery({
        queryKey: ['admin-pending-orders', currentPage],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/pending?page=${currentPage}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch pending orders');
            return response.json();
        }
    });

    // Approve order mutation
    const approveOrderMutation = useMutation({
        mutationFn: async ({ orderId, adminNotes }) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/${orderId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ adminNotes })
            });
            if (!response.ok) throw new Error('Failed to approve order');
            return response.json();
        },
        onSuccess: () => {
            toast.success('Order approved and assigned to vendors successfully!');
            queryClient.invalidateQueries(['admin-pending-orders']);
            setShowApproveModal(false);
            setSelectedOrder(null);
            setAdminNotes('');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to approve order');
        }
    });

    // Reject order mutation
    const rejectOrderMutation = useMutation({
        mutationFn: async ({ orderId, rejectionReason }) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/${orderId}/reject`, {
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
            queryClient.invalidateQueries(['admin-pending-orders']);
            setShowRejectModal(false);
            setSelectedOrder(null);
            setRejectionReason('');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to reject order');
        }
    });

    const handleApprove = (order) => {
        setSelectedOrder(order);
        setShowApproveModal(true);
    };

    const handleReject = (order) => {
        setSelectedOrder(order);
        setShowRejectModal(true);
    };

    const confirmApprove = () => {
        if (selectedOrder) {
            approveOrderMutation.mutate({
                orderId: selectedOrder._id,
                adminNotes
            });
        }
    };

    const confirmReject = () => {
        if (selectedOrder && rejectionReason.trim()) {
            rejectOrderMutation.mutate({
                orderId: selectedOrder._id,
                rejectionReason
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending_admin_approval': return 'bg-yellow-100 text-yellow-800';
            case 'admin_approved': return 'bg-green-100 text-green-800';
            case 'vendor_assigned': return 'bg-blue-100 text-blue-800';
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
                <div className="text-red-600 mb-4">Error loading pending orders</div>
                <p className="text-gray-600">{error.message}</p>
            </div>
        );
    }

    const orders = ordersData?.data?.orders || [];
    const pagination = ordersData?.data?.pagination || {};

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Pending Order Approvals</h1>
                <div className="text-sm text-gray-500">
                    {orders.length} orders awaiting approval
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="text-gray-500 mb-4">No pending orders</div>
                    <p className="text-gray-400">All orders have been processed</p>
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
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
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
                                                <div className="text-sm text-gray-500">
                                                    {order.shippingAddress?.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {order.items?.length} items
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {order.items?.slice(0, 2).map((item, index) => (
                                                    <div key={index}>
                                                        {item.productName} x{item.quantity}
                                                    </div>
                                                ))}
                                                {order.items?.length > 2 && (
                                                    <div>+{order.items.length - 2} more</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                ৳{order.total?.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleApprove(order)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(order)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded-md text-xs hover:bg-red-700 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
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

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Approve Order #{selectedOrder?.orderNumber}
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Notes (Optional)
                            </label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                rows="3"
                                placeholder="Add any notes for vendors or internal tracking..."
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setSelectedOrder(null);
                                    setAdminNotes('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmApprove}
                                disabled={approveOrderMutation.isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {approveOrderMutation.isPending ? 'Approving...' : 'Approve Order'}
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
                                placeholder="Please provide a reason for rejecting this order..."
                                required
                            />
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
                                onClick={confirmReject}
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

export default AdminPendingOrders;
