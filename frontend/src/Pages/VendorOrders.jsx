import React from 'react';
import { useVendorOrders, useUpdateOrderStatus } from '../hooks/useEcommerceApi';
import useTheme from '../hooks/useTheme';

const VendorOrders = () => {
  const { theme } = useTheme();
  const { data, isLoading, error } = useVendorOrders();
  const updateStatus = useUpdateOrderStatus();

  const orders = data?.data?.orders || [];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatus.mutate({ id: orderId, status: newStatus });
  };

  if (isLoading) return <p>Loading orders...</p>;

  if (error) return <p className="text-red-500">Failed to load orders</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total Orders: {orders.length}
        </div>
      </div>

      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${theme === 'dark' ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
              {orders.map((order) => (
                <tr key={order._id} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    #{order.orderNumber || order._id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {order.customer?.name || order.shippingAddress?.fullName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {order.customer?.email || order.shippingAddress?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {order.items?.slice(0, 2).map(item => item.productName).join(', ')}
                      {order.items?.length > 2 && '...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${order.total?.toFixed(2) || order.grandTotal?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'processing')}
                          disabled={updateStatus.isPending}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                        >
                          Process
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'shipped')}
                          disabled={updateStatus.isPending}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50"
                        >
                          Ship
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'delivered')}
                          disabled={updateStatus.isPending}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        >
                          Deliver
                        </button>
                      )}
                      {['pending', 'confirmed', 'processing'].includes(order.status) && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                          disabled={updateStatus.isPending}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {orders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {['pending', 'confirmed', 'shipped', 'delivered'].map(status => {
          const count = orders.filter(order => order.status === status).length;
          return (
            <div key={status} className={`bg-white dark:bg-gray-900 rounded-lg shadow p-4 border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{status} Orders</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendorOrders;
