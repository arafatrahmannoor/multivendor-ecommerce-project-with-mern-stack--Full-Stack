import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/axios';
import useTheme from '../hooks/useTheme';
import useAuthStore from '../store/useAuthStore';

const Profile = () => {
    const { theme } = useTheme();
    const { isLoggedIn, updateUser, user } = useAuthStore();

    const fetchUser = async () => {
        try {
            // First check if user is logged in
            if (!isLoggedIn) {
                throw new Error('Not authenticated');
            }

            // Check if we have the user ID from the auth store
            if (!user?._id) {
                throw new Error('User ID not available');
            }

            // Use the current user's ID from the auth store
            const response = await apiClient.get(`/users/${user._id}`);

            // Extract user from the response data structure
            const userData = response.data.user || response.data;

            // Update the auth store with fresh user data
            updateUser(userData);

            return userData;
        } catch (error) {
            console.error('API Error:', error);
            // Don't let this specific error trigger automatic logout
            if (error.response?.status === 401) {
                throw new Error('Unauthorized to view this profile');
            }
            throw error;
        }
    };


    const { data, isLoading, error } = useQuery({
        queryKey: ['user-profile', user?._id], // Include user ID in query key
        queryFn: fetchUser,
        retry: 1,
        staleTime: 0, // Always fetch fresh data
        enabled: isLoggedIn && !!user?._id, // Only run query if user is logged in and has ID
    });

    // Show login message if not authenticated
    if (!isLoggedIn) {
        return (
            <div className={`min-h-[60vh] flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                <div className={`w-full max-w-md rounded-xl border shadow-sm p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h2 className="text-2xl font-bold mb-4 text-center">Profile</h2>
                    <p className="text-center">Please log in to view profile information.</p>
                </div>
            </div>
        );
    }

    return (
    <div className={`min-h-[60vh] flex items-center justify-center py-6 sm:py-8 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`w-full max-w-2xl rounded-xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {/* Header: centered avatar on its own line */}
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/40 via-indigo-800/30 to-purple-900/30' : 'bg-gradient-to-br from-indigo-50 via-indigo-100 to-purple-50'} p-6`}>
                    <h2 className="text-lg font-semibold mb-3 text-center">Your Profile</h2>
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <div className="h-28 w-28 rounded-full bg-indigo-300/40"></div>
                            <div className="h-4 w-40 rounded bg-indigo-300/40"></div>
                        </div>
                    ) : (
                        data && (
                            <div className="flex flex-col items-center gap-3">
                                <img
                                    src={data.profilePicture
                                        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${data.profilePicture}`
                                        : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/profile_pictures/default.jpg`}
                                    alt="Profile"
                                    className={`h-60 w-60 rounded-full object-cover shadow ring-2 ring-indigo-500 ${theme === 'dark' ? 'ring-offset-gray-800' : 'ring-offset-indigo-50'} ring-offset-2`}
                                />
                                <div className="text-center">
                                    <p className="text-lg font-semibold">{data.name || 'N/A'}</p>
                                    <p className="text-xs opacity-80">{data.role || 'N/A'}</p>
                                </div>
                                <div className="pt-1">
                                    <Link to="/profile-picture" className={`text-xs underline-offset-2 hover:underline ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>Change photo</Link>
                                </div>
                            </div>
                        )
                    )}
                </div>
                <div className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-t`}></div>

                {/* Body: details and actions */}
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-3">Account details</h2>

                    {isLoading && (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-12 rounded bg-gray-200/70 dark:bg-gray-700"></div>
                            <div className="h-12 rounded bg-gray-200/70 dark:bg-gray-700"></div>
                            <div className="h-12 rounded bg-gray-200/70 dark:bg-gray-700"></div>
                        </div>
                    )}

                    {error && (
                        <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${theme === 'dark' ? 'border-red-900 bg-red-950/40 text-red-300' : 'border-red-300 bg-red-50 text-red-700'}`}>
                            {error.message}
                        </div>
                    )}

                    {data && (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Name</p>
                                    <p className={`mt-0.5 text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{data.name || 'N/A'}</p>
                                </div>
                                <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Email</p>
                                    <p className={`mt-0.5 text-base break-all ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{data.email || 'N/A'}</p>
                                </div>
                                <div className={`p-3 rounded-lg border md:col-span-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Role</p>
                                    <p className={`mt-0.5 text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{data.role || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                                <Link to="/profile/update" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">Edit Profile</Link>
                                <Link to="/change-password" className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium shadow-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'}`}>Change Password</Link>
                                <Link to="/profile-picture" className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium shadow-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'}`}>Change Picture</Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;