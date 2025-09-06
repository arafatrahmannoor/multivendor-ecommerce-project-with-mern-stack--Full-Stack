import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useTheme from '../hooks/useTheme';
import apiClient from '../lib/axios';

const MAX_MB = 2; // client-side limit
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const ProfilePicture = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoggedIn, user, updateUser } = useAuthStore();

  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);

  const currentImage = useMemo(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const p = user?.profilePicture ? `${baseUrl}/${user.profilePicture}` : `${baseUrl}/profile_pictures/default.jpg`;
    return preview || p;
  }, [preview, user?.profilePicture]);

  const validateFile = (f) => {
    if (!f) return 'Please choose an image file.';
    if (!ALLOWED.includes(f.type)) return 'Only JPG, PNG, or WEBP images are allowed.';
    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > MAX_MB) return `Image must be <= ${MAX_MB}MB.`;
    return '';
  };

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const v = validateFile(f);
    if (v) {
      setError(v);
      setFile(null);
      setPreview('');
      return;
    }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearSelection = () => {
    setFile(null);
    setPreview('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const v = validateFile(f);
    if (v) { setError(v); return; }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const mutation = useMutation({
    mutationFn: async (theFile) => {
      if (!user?._id) throw new Error('User ID not available');

      const buildForm = (field) => {
        const f = new FormData();
        f.append(field, theFile);
        return f;
      };

      const onUploadProgress = (pe) => {
        const total = pe.total || 0;
        if (total) setProgress(Math.round((pe.loaded / total) * 100));
      };

      const fields = ['profilePicture', 'profile_picture', 'avatar', 'image', 'file'];
      const paths = [
        `/user/profile_picture/${user._id}`,
        `/user/profile-picture/${user._id}`,
      ];
      const methods = ['patch', 'put'];

      let lastErr;
      for (const field of fields) {
        const form = buildForm(field);
        for (const m of methods) {
          for (const p of paths) {
            try {
              if (m === 'patch') {
                const res = await apiClient.patch(p, form, { onUploadProgress });
                return res.data.user || res.data;
              } else {
                const res = await apiClient.put(p, form, { onUploadProgress });
                return res.data.user || res.data;
              }
            } catch (e) {
              lastErr = e;
              const code = e?.response?.status;
              // 401 won't be fixed by trying other combos; stop. For 400, try other combos.
              if (code === 401) throw e;
            }
          }
        }
      }
      throw lastErr || new Error('Failed to upload image');
    },
    onSuccess: (updated) => {
      updateUser(updated);
      if (user?._id) queryClient.invalidateQueries({ queryKey: ['user-profile', user._id] });
      setSuccess('Profile picture updated.');
      setError('');
      setProgress(0);
      // small delay then navigate back
      setTimeout(() => navigate('/profile'), 700);
    },
    onError: (err) => {
      const data = err?.response?.data;
      const details = Array.isArray(data?.errors) ? data.errors.map(e => e.msg || e).join(', ') : '';
      const msg = (data?.message || err.message || 'Failed to upload image') + (details ? ` - ${details}` : '');
      setError(msg);
      setSuccess('');
      setProgress(0);
    }
  });

  if (!isLoggedIn) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`w-full max-w-md rounded-xl border shadow-sm p-6 text-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-2xl font-bold mb-2">Profile Picture</h2>
          <p>Please sign in to update your profile picture.</p>
          <Link to="/signin" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white">Go to Sign in</Link>
        </div>
      </div>
    );
  }

  const onUpload = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!file) { setError('Please select an image first.'); return; }
    mutation.mutate(file);
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} min-h-[60vh] py-10`}>
      <div className="mx-auto w-full max-w-3xl">
        <div className={`rounded-xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="grid md:grid-cols-2">
            {/* Preview / current image */}
            <div className={`p-6 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/40 via-indigo-800/30 to-purple-900/30' : 'bg-gradient-to-br from-indigo-50 via-indigo-100 to-purple-50'}`}>
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              <div className="flex flex-col items-center gap-4">
                <img src={currentImage} alt="Preview" className={`h-40 w-40 rounded-full object-cover border shadow ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`} />
                {preview && (
                  <button type="button" onClick={clearSelection} className={`text-sm rounded-md px-3 py-1.5 ${theme === 'dark' ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'}`}>Clear selection</button>
                )}
              </div>
              <p className={`mt-6 text-xs ${theme === 'dark' ? 'text-indigo-100/80' : 'text-indigo-900/80'}`}>Allowed: JPG, PNG, WEBP • Max {MAX_MB}MB</p>
            </div>

            {/* Upload form */}
            <div className="p-6">
              <h1 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Profile Picture</h1>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Upload or change your avatar.</p>

              {error && (
                <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              {success && (
                <div className="mb-3 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
              )}

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragging ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
              >
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Drag & drop image here, or</p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-2 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Choose file
                </button>
                <input ref={inputRef} onChange={onPick} type="file" accept="image/*" className="hidden" />
                {file && (
                  <p className={`mt-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{file.name}</p>
                )}
              </div>

              {mutation.isPending && (
                <div className="mt-4">
                  <div className={`h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden`}>
                    <div className="h-2 bg-indigo-600" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Uploading… {progress}%</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-6">
                <button type="button" onClick={() => navigate('/profile')} className={`rounded-md px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
                <button onClick={onUpload} disabled={mutation.isPending} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">{mutation.isPending ? 'Uploading…' : 'Upload'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePicture;
