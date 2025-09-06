import React, { useEffect } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useTheme from '../hooks/useTheme';

// Admin-only layout with role-based guard
const AdminLayout = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { isLoggedIn, role, user } = useAuthStore();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/signin', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    // While redirecting
    if (!isLoggedIn) return null;

    // Block non-admin roles
    if (role !== 'admin') {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                    <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        {user?.name ? `${user.name}, you don't have permission to access the admin area.` : `You don't have permission to access the admin area.`}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Link to="/" className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Go Home</Link>
                        <Link to="/profile" className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} px-5 py-2 rounded-lg`}>My Profile</Link>
                    </div>
                </div>
            </div>
        );
    }

    // Admin shell
    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`${theme === 'dark' ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-200'} sticky top-0 z-10`}>
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Admin Panel</h1>
                        <p className="text-xs text-gray-500">Welcome, {user?.name || 'Admin'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            View Store
                        </Link>
                        <Link to="/profile" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            Profile
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className={`w-64 min-h-screen ${theme === 'dark' ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'}`}>
                    <nav className="p-4 space-y-2">
                        <Link to="/admin/dashboard" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-2-5 2V5z" />
                            </svg>
                            Dashboard
                        </Link>
                        
                        <Link to="/admin/products" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Products
                        </Link>
                        
                        <Link to="/admin/pending-products" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pending Products
                        </Link>
                        
                        <Link to="/admin/pending-orders" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pending Orders
                        </Link>
                        
                        <Link to="/admin/orders" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            All Orders
                        </Link>
                        
                        <Link to="/admin/users" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            Users
                        </Link>
                        
                        <Link to="/admin/categories" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7v4a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2zM5 11v4a2 2 0 002 2h10a2 2 0 002-2v-4" />
                            </svg>
                            Categories
                        </Link>
                        
                        <Link to="/admin/brands" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Brands
                        </Link>
                        
                        <Link to="/admin/payments" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Payments
                        </Link>
                        
                        <Link to="/admin/stats" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analytics
                        </Link>
                        
                        <Link to="/admin/api-test" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            API Test
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 px-6 py-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;