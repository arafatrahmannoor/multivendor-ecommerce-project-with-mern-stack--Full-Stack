import React from 'react';
import { useAdminStats } from '../hooks/useEcommerceApi';
import useTheme from '../hooks/useTheme';

const AdminStats = () => {
  const { theme } = useTheme();
  const { data, isLoading, error } = useAdminStats();
  const stats = data?.data || {};

  if (isLoading) return <p>Loading stats...</p>;

  if (error) return <p className="text-red-500">Failed to load stats</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Stats</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {['users','vendors','products','orders'].map(k => (
          <div key={k} className={`p-4 rounded border ${theme==='dark'?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
            <div className="text-sm text-gray-500 capitalize">{k}</div>
            <div className="text-2xl font-semibold">{stats?.counts?.[k] ?? 0}</div>
          </div>
        ))}
      </div>

      <div className={`p-4 rounded border mb-8 ${theme==='dark'?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
        <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">BDT {Number(stats?.totalRevenue || 0).toFixed(2)}</div>
      </div>

      <div className={`p-4 rounded border ${theme==='dark'?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
        <h2 className="font-semibold mb-3">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.map(o => (
                <tr key={o._id} className="border-b last:border-0 border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 text-xs">{o._id}</td>
                  <td className="py-2 pr-4">{o.user?.name || o.user?.email || '-'}</td>
                  <td className="py-2 pr-4">BDT {Number(o.total || 0).toFixed(2)}</td>
                  <td className="py-2 pr-4 capitalize">{o.status}</td>
                  <td className="py-2 pr-4 text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                </tr>
              )) || <tr><td colSpan="5" className="py-4 text-center text-gray-500">No orders</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-6 text-xs text-gray-500 flex gap-6 flex-wrap">
          <div>Uptime: {Math.floor(stats?.server?.uptime || 0)}s</div>
          <div>Memory RSS: {stats?.server?.memory?.rss ? Math.round(stats.server.memory.rss / 1024 / 1024) : 0} MB</div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
