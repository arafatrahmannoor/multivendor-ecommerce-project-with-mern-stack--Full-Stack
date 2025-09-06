import React from 'react';
import useTheme from '../hooks/useTheme';

const AdminPayments = () => {
  const { theme } = useTheme();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage vendor payouts and commissions
        </p>
      </div>

      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
        <p className="text-center text-gray-500">Payment management interface coming soon...</p>
      </div>
    </div>
  );
};

export default AdminPayments;
