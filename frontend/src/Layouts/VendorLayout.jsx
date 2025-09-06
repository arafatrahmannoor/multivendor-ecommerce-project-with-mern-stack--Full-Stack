import React, { useEffect } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useTheme from '../hooks/useTheme';

// Vendor-only layout with role-based guard
const VendorLayout = () => {
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

    // Block non-vendor roles
    if (role !== 'vendor') {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                    <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        {user?.name ? `${user.name}, you don't have permission to access the vendor area.` : `You don't have permission to access the vendor area.`}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Link to="/" className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Go Home</Link>
                        <Link to="/profile" className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} px-5 py-2 rounded-lg`}>My Profile</Link>
                    </div>
                </div>
            </div>
        );
    }

    // Vendor shell
    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`${theme === 'dark' ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-200'} sticky top-0 z-10`}>
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Vendor Panel</h1>
                        <p className="text-xs text-gray-500">Welcome, {user?.name || 'Vendor'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            Store Front
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
                        <Link to="/vendor/dashboard" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-2-5 2V5z" />
                            </svg>
                            Dashboard
                        </Link>
                        
                        <Link to="/vendor/products" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            My Products
                        </Link>
                        
                        <Link to="/vendor/assigned-orders" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Assigned Orders
                        </Link>
                        
                        <Link to="/vendor/orders" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            All Orders
                        </Link>
                        
                        <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Analytics
                        </div>
                        
                        <Link to="/vendor/analytics" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Sales Analytics
                        </Link>
                        
                        <Link to="/vendor/inventory" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Inventory
                        </Link>
                        
                        <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Settings
                        </div>
                        
                        <Link to="/vendor/settings" 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Store Settings
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

export default VendorLayout;
