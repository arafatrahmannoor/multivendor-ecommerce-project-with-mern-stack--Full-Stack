import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../lib/axios';
import useAuthStore from '../store/useAuthStore';
import useTheme from '../hooks/useTheme';

const UpdateProfile = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isLoggedIn, user, updateUser } = useAuthStore();

    // Hooks must be called unconditionally
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });
    const [serverError, setServerError] = useState('');
    const [serverSuccess, setServerSuccess] = useState('');

    const mutation = useMutation({
        mutationFn: async (payload) => {
            if (!user?._id) throw new Error('User ID not available');
            const res = await apiClient.put(`/users/update/${user._id}`, payload);
            // Expecting either { user: {...} } or {...}
            return res.data.user || res.data;
        },
        onSuccess: (updated) => {
            // Update auth store and queries
            updateUser(updated);
            if (user?._id) {
                queryClient.invalidateQueries({ queryKey: ['user-profile', user._id] });
            }
            setServerSuccess('Profile updated successfully.');
            setServerError('');
            // Navigate back to profile after a short delay
            setTimeout(() => navigate('/profile'), 600);
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || err.message || 'Failed to update profile';
            setServerError(msg);
            setServerSuccess('');
        }
    });

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = (e) => {
        e.preventDefault();
        setServerError('');
        setServerSuccess('');
        mutation.mutate({ name: form.name.trim(), email: form.email.trim() });
    };

    // Render guards after hooks are declared
    if (!isLoggedIn) {
        return (
            <div className={`min-h-[60vh] flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                <div className={`w-full max-w-md rounded-xl border shadow-sm p-6 text-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
                    <p>Please sign in to update your profile.</p>
                    <Link to="/signin" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white">Go to Sign in</Link>
                </div>
            </div>
        );
    }

    if (!user?._id) {
        return (
            <div className={`min-h-[60vh] flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                <div className={`w-full max-w-md rounded-xl border shadow-sm p-6 text-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
                    <p>Unable to find your user ID. Please reload the page.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white">Reload</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} min-h-[60vh] py-10`}> 
            <div className="mx-auto w-full max-w-3xl">
                <div className={`rounded-xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="grid md:grid-cols-2">
                        <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/40 via-indigo-800/30 to-purple-900/30' : 'bg-gradient-to-br from-indigo-50 via-indigo-100 to-purple-50'} p-6 hidden md:block`}>
                            <h2 className="text-lg font-semibold">Profile Tips</h2>
                            <ul className={`mt-4 space-y-2 text-sm ${theme === 'dark' ? 'text-indigo-100/80' : 'text-indigo-900/80'}`}>
                                <li>• Use a real name for better recognition</li>
                                <li>• Keep your email address up to date</li>
                            </ul>
                        </div>
                        <div className="p-6">
                            <h1 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Update Profile</h1>
                            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Change your basic information.</p>

                    {serverError && (
                        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
                    )}
                    {serverSuccess && (
                        <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{serverSuccess}</div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={onChange}
                                required
                                className={`w-full rounded-md border px-3 py-2 outline-none transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'}`}
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={onChange}
                                required
                                className={`w-full rounded-md border px-3 py-2 outline-none transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'}`}
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                className={`rounded-md px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className={`inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                {mutation.isPending ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateProfile;
