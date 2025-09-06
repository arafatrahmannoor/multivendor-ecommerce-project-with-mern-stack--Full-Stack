import React, { useState } from 'react';

import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useEcommerceApi';
import useTheme from '../hooks/useTheme';

const AdminCategories = () => {
  const { theme } = useTheme();
  const { data, isLoading, error } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [form, setForm] = useState({ name: '', description: '', image: null });
  const [editingId, setEditingId] = useState(null);

  const categories = data?.data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    if (form.description) fd.append('description', form.description);
    if (form.image) fd.append('image', form.image);

    if (editingId) {
      updateCategory.mutate({ id: editingId, formData: fd });
    } else {
      createCategory.mutate(fd, { onSuccess: () => setForm({ name: '', description: '', image: null }) });
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, description: cat.description || '', image: null });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this category?')) {
      deleteCategory.mutate(id, { onSuccess: () => { if (editingId === id) setEditingId(null); } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>

      <form onSubmit={handleSubmit} className={`mb-8 p-4 rounded border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required className={`w-full px-3 py-2 rounded border ${theme==='dark'?'bg-gray-800 border-gray-700':'bg-white border-gray-300'}`} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={`w-full px-3 py-2 rounded border ${theme==='dark'?'bg-gray-800 border-gray-700':'bg-white border-gray-300'}`} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input type="file" onChange={e=>setForm(f=>({...f,image:e.target.files[0]}))} className="w-full text-sm" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" onClick={()=>{setEditingId(null);setForm({name:'',description:'',image:null});}} className="px-4 py-2 rounded text-sm bg-gray-500 text-white hover:bg-gray-600">Cancel</button>
          )}
        </div>
      </form>

      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Failed to load categories</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(cat => (
          <div key={cat._id} className={`p-4 rounded border ${theme==='dark'?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{cat.name}</h3>
                {cat.description && <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>startEdit(cat)} className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Edit</button>
                <button onClick={()=>handleDelete(cat._id)} className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && categories.length === 0 && (
          <p className="text-sm text-gray-500">No categories found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
