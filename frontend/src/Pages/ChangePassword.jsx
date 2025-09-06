import React, { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import useAuthStore from '../store/useAuthStore';
import apiClient from '../lib/axios';

const ChangePassword = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();

  // Hooks
  const [form, setForm] = useState({ currentPassword: '', newpassword: '', confirm: '' });
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const strength = useMemo(() => {
    const pwd = form.newpassword || '';
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
    const clamp = Math.max(0, Math.min(4, score));
    const label = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][clamp];
    const width = ['w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'][clamp];
    const color = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-600'][clamp];
    return { score: clamp, label, width, color };
  }, [form.newpassword]);

  const mutation = useMutation({
    mutationFn: async ({ currentPassword, newpassword }) => {
      if (!user?._id) throw new Error('User ID not available');
      // Include both casings to satisfy various backend expectations
      const payload = { currentPassword, newpassword, newPassword: newpassword };

      const tryReq = async (method, path) => {
        if (method === 'patch') {
          const res = await apiClient.patch(path, payload);
          return res.data;
        }
        if (method === 'put') {
          const res = await apiClient.put(path, payload);
          return res.data;
        }
      };

      const paths = [
        `/user/change_password/${user._id}`,
        `/user/change-password/${user._id}`,
      ];
      const methods = ['patch', 'put'];
      let lastErr;
      for (const m of methods) {
        for (const p of paths) {
          try {
            return await tryReq(m, p);
          } catch (e) {
            lastErr = e;
            const code = e?.response?.status;
            // If validation or unauthorized, no need to try other combos
            if (code === 400 || code === 401) throw e;
          }
        }
      }
      throw lastErr || new Error('Failed to change password');
    },
    onSuccess: () => {
      setServerSuccess('Password changed successfully.');
      setServerError('');
      // Optional: navigate back after short delay
      setTimeout(() => navigate('/profile'), 800);
    },
    onError: (err) => {
      const data = err?.response?.data;
      const details = Array.isArray(data?.errors) ? data.errors.map(e => e.msg || e).join(', ') : '';
      const msg = (data?.message || err.message || 'Failed to change password') + (details ? ` - ${details}` : '');
      setServerError(msg);
      setServerSuccess('');
    }
  });

  // Guards (after hooks declared)
  if (!isLoggedIn) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}> 
        <div className={`w-full max-w-md rounded-xl border shadow-sm p-6 text-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-2xl font-bold mb-4">Change Password</h2>
          <p>Please sign in to change your password.</p>
          <Link to="/signin" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white">Go to Sign in</Link>
        </div>
      </div>
    );
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');
    // Client validation
    if (!form.currentPassword || !form.newpassword) {
      setServerError('Please fill all required fields.');
      return;
    }
    if (form.newpassword.length < 6) {
      setServerError('New password must be at least 6 characters.');
      return;
    }
    if (form.newpassword !== form.confirm) {
      setServerError('New password and confirm password do not match.');
      return;
    }

    mutation.mutate({ currentPassword: form.currentPassword, newpassword: form.newpassword });
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} min-h-[60vh] py-10`}>
      <div className="mx-auto w-full max-w-3xl">
        <div className={`rounded-xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="grid md:grid-cols-2">
            {/* Illustration / info panel */}
            <div className={`hidden md:flex flex-col justify-between p-6 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/40 via-indigo-800/30 to-purple-900/30' : 'bg-gradient-to-br from-indigo-50 via-indigo-100 to-purple-50'}`}>
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-600 grid place-items-center text-white shadow">🔒</div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-700'}`}>Account security</p>
                    <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Keep your account protected</h2>
                  </div>
                </div>
                <ul className={`mt-6 space-y-2 text-sm ${theme === 'dark' ? 'text-indigo-100/80' : 'text-indigo-900/80'}`}>
                  <li>• Use at least 6 characters</li>
                  <li>• Mix upper/lowercase, numbers, symbols</li>
                  <li>• Don’t reuse old passwords</li>
                </ul>
              </div>
              <div className="relative mt-8">
                <div className={`absolute -top-6 -right-4 h-24 w-24 rounded-full blur-2xl ${theme === 'dark' ? 'bg-indigo-600/30' : 'bg-indigo-300/40'}`}></div>
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={`${theme === 'dark' ? 'text-indigo-300/30' : 'text-indigo-400/30'} w-40 h-40 mx-auto`}>
                  <path fill="currentColor" d="M40.5,-55.3C52.3,-48.6,62.6,-39.6,69.4,-27.9C76.1,-16.1,79.3,-1.6,75.1,10.8C70.9,23.2,59.4,33.4,47.6,43.2C35.8,53,23.8,62.4,9.5,67.1C-4.8,71.8,-21.3,71.8,-35.6,65.9C-49.9,60,-62.1,48.3,-69.1,34.3C-76.1,20.2,-77.9,4,-73.5,-10.7C-69.2,-25.3,-58.7,-38.4,-46.3,-46C-34,-53.6,-20,-55.6,-6.2,-57.9C7.5,-60.2,15.1,-62,25.4,-61.2C35.7,-60.3,47.7,-56.9,40.5,-55.3Z" transform="translate(100 100)" />
                </svg>
              </div>
            </div>

            {/* Form panel */}
            <div className="p-6">
              <h1 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Change Password</h1>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Enter your current and new password.</p>

              {serverError && (
                <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
              )}
              {serverSuccess && (
                <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{serverSuccess}</div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">Current password</label>
              <div className="flex items-center gap-2">
                <input
                  type={show.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={onChange}
                  required
                  className={`w-full rounded-md border px-3 py-2 outline-none transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                  className={`shrink-0 rounded-md px-2 py-2 text-xs ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  aria-label={show.current ? 'Hide current password' : 'Show current password'}
                >
                  {show.current ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">New password</label>
              <div className="flex items-center gap-2">
                <input
                  type={show.next ? 'text' : 'password'}
                  name="newpassword"
                  value={form.newpassword}
                  onChange={onChange}
                  required
                  className={`w-full rounded-md border px-3 py-2 outline-none transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'}`}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                  className={`shrink-0 rounded-md px-2 py-2 text-xs ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  aria-label={show.next ? 'Hide new password' : 'Show new password'}
                >
                  {show.next ? 'Hide' : 'Show'}
                </button>
              </div>
              {/* Strength meter */}
              <div className="mt-2">
                <div className={`h-1.5 rounded bg-gray-200 ${theme === 'dark' ? 'bg-opacity-20' : ''}`}>
                  <div className={`h-1.5 rounded ${strength.color} ${strength.width}`}></div>
                </div>
                <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Strength: {strength.label}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">Confirm new password</label>
              <div className="flex items-center gap-2">
                <input
                  type={show.confirm ? 'text' : 'password'}
                  name="confirm"
                  value={form.confirm}
                  onChange={onChange}
                  required
                  className={`w-full rounded-md border px-3 py-2 outline-none transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'}`}
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                  className={`shrink-0 rounded-md px-2 py-2 text-xs ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  aria-label={show.confirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {show.confirm ? 'Hide' : 'Show'}
                </button>
              </div>
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
                {mutation.isPending ? 'Changing...' : 'Change password'}
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

export default ChangePassword;
