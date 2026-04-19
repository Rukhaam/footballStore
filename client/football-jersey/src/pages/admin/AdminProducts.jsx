import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState({ show: false, id: null });
  
  // Pagination & Search states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;
  
  // Ref for AbortController
  const abortControllerRef = useRef(null);

  // Modal Form States
  const [uploadType, setUploadType] = useState('file'); // 'file' | 'url'
  const [formData, setFormData] = useState({
    name: '', price: '', originalPrice: '', stock: '', 
    categoryId: 1, collectionId: 1, productImageUrl: '', description: ''
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Debounce search mechanism with AbortController
    const debounceTimer = setTimeout(() => {
      fetchProducts(page, searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  const fetchProducts = async (currentPage, search) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Cancel previous request
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const res = await api.get(`/store/jerseys`, {
        params: { page: currentPage, limit, search },
        signal: abortControllerRef.current.signal
      });
      
      setProducts(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error(err);
        toast.error('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page
  };

  const confirmDelete = (id) => {
    setShowConfirm({ show: true, id });
  };

  const handleDelete = async () => {
    const id = showConfirm.id;
    try {
      await api.delete(`/store/${id}`);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
      setShowConfirm({ show: false, id: null });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Adding product...');
    let imageUrl = formData.productImageUrl;
    
    if (uploadType === 'file' && file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (error) {
        toast.error('Image upload failed: ' + error.message, { id: loadingToast });
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
        
      imageUrl = publicUrlData.publicUrl;
    } else if (uploadType === 'url' && !imageUrl) {
      toast.error('Please provide an image URL', { id: loadingToast });
      return;
    }

    try {
      await api.post('/store', { ...formData, productImageUrl: imageUrl });
      toast.success('Product added successfully', { id: loadingToast });
      setShowModal(false);
      setFormData({
        name: '', price: '', originalPrice: '', stock: '', 
        categoryId: 1, collectionId: 1, productImageUrl: '', description: ''
      });
      setFile(null);
      fetchProducts(page, searchQuery);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add product', { id: loadingToast });
    }
  };

  return (
    <div className="text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="kinetic-heading text-2xl tracking-widest text-brand-primary">Manage Products</h2>
        
        <div className="flex gap-4 items-center">
          <input 
            type="text" 
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="bg-surface-low text-white border border-white/10 px-4 py-2 rounded focus:outline-none focus:border-brand-primary font-inter w-64"
          />
          <button 
            className="bg-brand-primary text-black font-semibold px-4 py-2 rounded whitespace-nowrap hover:bg-brand-primary/90 transition" 
            onClick={() => setShowModal(true)}>
            + Add Product
          </button>
        </div>
      </div>

      <div className="bg-surface-low rounded border border-white/10 p-4 shadow-lg min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-text-secondary animate-pulse">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-text-secondary">
            No products found matching "{searchQuery}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-inter whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/10 text-text-secondary">
                  <th className="pb-3 text-sm font-medium">Image</th>
                  <th className="pb-3 text-sm font-medium">Name</th>
                  <th className="pb-3 text-sm font-medium">Price</th>
                  <th className="pb-3 text-sm font-medium">Stock</th>
                  <th className="pb-3 text-sm font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-surface-deep transition">
                    <td className="py-3">
                      <img src={product.productImageUrl || 'https://via.placeholder.com/150'} alt={product.productName} className="w-12 h-12 object-cover rounded bg-surface-base" />
                    </td>
                    <td className="py-3 font-semibold">{product.productName}</td>
                    <td className="py-3 text-brand-primary">₹{product.price}</td>
                    <td className="py-3">{product.stock || 0}</td>
                    <td className="py-3 text-right">
                      <button className="text-red-400 hover:text-red-500 text-sm font-semibold px-3 py-1 bg-red-400/10 rounded transition" onClick={() => confirmDelete(product.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 border-t border-white/10 pt-4">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="text-text-secondary hover:text-white disabled:opacity-50 font-inter px-3 py-1 bg-surface-deep rounded"
            >
              Previous
            </button>
            <span className="text-sm text-text-secondary font-inter">
              Page {page} of {totalPages}
            </span>
            <button 
               disabled={page === totalPages}
               onClick={() => setPage(p => p + 1)}
               className="text-text-secondary hover:text-white disabled:opacity-50 font-inter px-3 py-1 bg-surface-deep rounded"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-surface-base p-6 rounded-lg w-full max-w-sm border border-white/10 text-center">
            <h3 className="text-xl mb-2 font-bold kinetic-heading drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]">Confirm Delete</h3>
            <p className="text-text-secondary font-inter mb-6 text-sm">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button className="text-text-secondary font-semibold hover:text-white px-4 py-2" onClick={() => setShowConfirm({ show: false, id: null })}>Cancel</button>
              <button className="bg-red-500 text-white font-semibold px-6 py-2 rounded hover:bg-red-600 transition shadow-[0_0_15px_rgba(255,0,0,0.3)]" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface-base p-6 rounded-lg w-full max-w-lg border border-white/10 my-8">
            <h3 className="kinetic-heading text-xl mb-4 text-brand-primary drop-shadow-[0_0_5px_rgba(0,255,102,0.3)]">Add New Product</h3>
            <form onSubmit={handleSubmit} className="space-y-4 font-inter">
              <input 
                className="w-full bg-surface-deep text-white px-4 py-2 rounded focus:outline-none focus:border-brand-primary border border-white/10"
                type="text" placeholder="Product Name" required
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
              />
              <div className="flex gap-4">
                <input 
                  className="w-full bg-surface-deep text-white px-4 py-2 rounded focus:outline-none focus:border-brand-primary border border-white/10"
                  type="number" placeholder="Price (₹)" required
                  value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                />
                <input 
                  className="w-full bg-surface-deep text-white px-4 py-2 rounded focus:outline-none focus:border-brand-primary border border-white/10"
                  type="number" placeholder="Stock"
                  value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} 
                />
              </div>

              {/* Image Upload Toggle */}
              <div className="bg-surface-low p-4 rounded border border-white/5">
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={uploadType === 'file'} onChange={() => setUploadType('file')} className="accent-brand-primary" />
                    <span>Upload File</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={uploadType === 'url'} onChange={() => setUploadType('url')} className="accent-brand-primary"/>
                    <span>External URL</span>
                  </label>
                </div>
                
                {uploadType === 'file' ? (
                  <input 
                    type="file" accept="image/*"
                    className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 transition cursor-pointer"
                    onChange={handleFileChange} required
                  />
                ) : (
                  <input 
                    type="url" placeholder="https://example.com/image.jpg"
                    className="w-full bg-surface-deep text-white px-4 py-2 rounded focus:outline-none focus:border-brand-primary border border-white/10 text-sm"
                    value={formData.productImageUrl} onChange={e => setFormData({...formData, productImageUrl: e.target.value})} required
                  />
                )}
              </div>

              <textarea 
                className="w-full bg-surface-deep text-white px-4 py-2 rounded focus:outline-none focus:border-brand-primary border border-white/10 text-sm h-24 resize-none"
                placeholder="Product Description..."
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
              ></textarea>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                <button type="button" className="text-text-secondary hover:text-white font-semibold transition" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="bg-brand-primary text-black font-semibold px-6 py-2 rounded hover:shadow-[0_0_15px_rgba(0,255,102,0.4)] transition">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
