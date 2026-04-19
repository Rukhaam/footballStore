import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, Trash2, AlertTriangle, Image as ImageIcon, Link as LinkIcon, UploadCloud, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState({ show: false, id: null, name: '' });
  
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
    categoryId: 1, collectionId: 1, productImageUrl: '', galleryUrls: '', description: ''
  });
  const [files, setFiles] = useState([]); // Upgraded to array

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts(page, searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  const fetchProducts = async (currentPage, search) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
    setPage(1);
  };

  const confirmDelete = (id, name) => {
    setShowConfirm({ show: true, id, name });
  };

  const handleDelete = async () => {
    const id = showConfirm.id;
    try {
      await api.delete(`/store/${id}`);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
      setShowConfirm({ show: false, id: null, name: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  const handleFileChange = (e) => {
    // Convert FileList to an array
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Adding product...');
    
    let mainImageUrl = formData.productImageUrl;
    let gallery = [];
    
    // --- FILE UPLOAD LOGIC ---
    if (uploadType === 'file' && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (error) {
          toast.error(`Image upload failed for ${file.name}: ` + error.message, { id: loadingToast });
          return;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
          
        // First image is the main thumbnail, the rest go to the gallery
        if (i === 0) {
          mainImageUrl = publicUrlData.publicUrl;
        } else {
          gallery.push(publicUrlData.publicUrl);
        }
      }
    } 
    // --- URL UPLOAD LOGIC ---
    else if (uploadType === 'url') {
      if (!mainImageUrl) {
        toast.error('Please provide a main image URL', { id: loadingToast });
        return;
      }
      if (formData.galleryUrls) {
        gallery = formData.galleryUrls.split(',').map(url => url.trim()).filter(url => url);
      }
    } else {
      toast.error('Please provide an image', { id: loadingToast });
      return;
    }

    try {
      // Send the payload including the new gallery array
      await api.post('/store', { 
        ...formData, 
        productImageUrl: mainImageUrl,
        gallery: gallery 
      });
      
      toast.success('Product added successfully', { id: loadingToast });
      setShowModal(false);
      setFormData({
        name: '', price: '', originalPrice: '', stock: '', 
        categoryId: 1, collectionId: 1, productImageUrl: '', galleryUrls: '', description: ''
      });
      setFiles([]);
      fetchProducts(page, searchQuery);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add product', { id: loadingToast });
    }
  };

  return (
    <div className="text-white w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="kinetic-heading text-3xl md:text-4xl tracking-wider text-white uppercase mb-1">
            Manage <span className="text-brand-primary">Products</span>
          </h2>
          <p className="text-text-secondary font-inter text-sm">Add, update, or remove your store's inventory.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search gear..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-surface-low/50 text-white border border-white/10 pl-11 pr-4 py-2.5 rounded-full focus:outline-none focus:border-brand-primary focus:bg-surface-low font-inter transition-all shadow-inner"
            />
          </div>
          <button 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-primary text-black font-bold font-inter px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] hover:scale-105 transition-all" 
            onClick={() => setShowModal(true)}>
            <Plus size={18} strokeWidth={3} /> Add Product
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER - Glassmorphic */}
      <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
            <p className="text-text-secondary font-inter text-sm animate-pulse">Loading inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center h-64 gap-4 text-text-secondary">
            <PackageSearch size={48} className="opacity-50" />
            <p className="font-inter">No products found matching "{searchQuery}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left font-inter whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/5 bg-surface-base/30">
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Image</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-12 h-16 bg-surface-deep rounded-lg p-1 border border-white/5 overflow-hidden shadow-inner">
                        <img src={product.productImageUrl || 'https://via.placeholder.com/150'} alt={product.productName} className="w-full h-full object-contain hover:scale-110 transition-transform" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white text-sm">{product.productName}</p>
                      <p className="text-xs text-text-secondary truncate w-48">{product.description || 'No description'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-brand-primary font-bold">₹{product.price}</span>
                        {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                          <span className="text-xs text-text-secondary line-through">₹{product.originalPrice}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {product.stock || 0} Units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors" 
                        onClick={() => confirmDelete(product.id, product.productName)}
                        title="Delete Product"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-surface-base/30">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 text-sm font-bold text-text-secondary hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-text-secondary font-inter font-bold bg-surface-deep px-4 py-1.5 rounded-full border border-white/5">
              <span className="text-white">{page}</span> / {totalPages}
            </span>
            <button 
               disabled={page === totalPages}
               onClick={() => setPage(p => p + 1)}
               className="flex items-center gap-1 text-sm font-bold text-text-secondary hover:text-white disabled:opacity-30 transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirm.show && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-surface-low/90 backdrop-blur-xl p-8 rounded-3xl w-full max-w-sm border border-white/10 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl mb-2 font-bold kinetic-heading text-white">Delete Product?</h3>
            <p className="text-text-secondary font-inter mb-8 text-sm leading-relaxed">
              Are you sure you want to delete <span className="text-white font-bold">{showConfirm.name}</span>? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button className="flex-1 text-text-secondary font-bold font-inter bg-surface-deep hover:bg-white/10 px-4 py-3 rounded-xl transition" onClick={() => setShowConfirm({ show: false, id: null, name: '' })}>
                Cancel
              </button>
              <button className="flex-1 bg-red-500 text-white font-bold font-inter px-4 py-3 rounded-xl hover:bg-red-600 transition shadow-[0_0_15px_rgba(255,0,0,0.3)]" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-surface-low/95 backdrop-blur-2xl p-8 rounded-3xl w-full max-w-xl border border-white/10 shadow-2xl my-8 animate-in zoom-in-95 duration-300 relative">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

            <div className="relative z-10">
              <h3 className="kinetic-heading text-2xl mb-6 text-white tracking-wider flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
                  <PackageSearch size={24} />
                </div>
                Add New Gear
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5 font-inter">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Product Name</label>
                  <input 
                    className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all"
                    type="text" placeholder="e.g. Real Madrid 23/24 Home Kit" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Price (₹)</label>
                    <input 
                      className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all"
                      type="number" placeholder="4999" required min="0" step="0.01"
                      value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Initial Stock</label>
                    <input 
                      className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all"
                      type="number" placeholder="50" min="0" required
                      value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} 
                    />
                  </div>
                </div>

                {/* Image Upload Toggle */}
                <div className="bg-surface-deep/30 p-5 rounded-2xl border border-white/5">
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Product Images</label>
                  <div className="flex p-1 bg-surface-deep rounded-xl mb-4">
                    <button 
                      type="button"
                      onClick={() => setUploadType('file')} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${uploadType === 'file' ? 'bg-surface-low text-white shadow-md' : 'text-text-secondary hover:text-white'}`}
                    >
                      <UploadCloud size={16} /> File Upload
                    </button>
                    <button 
                      type="button"
                      onClick={() => setUploadType('url')} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${uploadType === 'url' ? 'bg-surface-low text-white shadow-md' : 'text-text-secondary hover:text-white'}`}
                    >
                      <LinkIcon size={16} /> Image URL
                    </button>
                  </div>
                  
                  {uploadType === 'file' ? (
                    <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-brand-primary/50 transition-colors group">
                      {/* ADDED 'multiple' attribute here */}
                      <input 
                        type="file" accept="image/*" multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange} required
                      />
                      <ImageIcon className="text-white/20 group-hover:text-brand-primary transition-colors mb-2" size={32} />
                      <p className="text-sm font-bold text-white mb-1">
                        {files.length > 0 ? `${files.length} file(s) selected` : 'Drag & drop or click to browse'}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {files.length > 0 ? 'First image will be the main cover' : 'Select multiple images for gallery'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input 
                        type="url" placeholder="Main Cover Image URL (https://...)"
                        className="w-full bg-surface-deep text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary border border-white/5 transition-all text-sm"
                        value={formData.productImageUrl} onChange={e => setFormData({...formData, productImageUrl: e.target.value})} required
                      />
                      <textarea 
                        placeholder="Additional Gallery URLs (comma separated)"
                        className="w-full bg-surface-deep text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary border border-white/5 transition-all text-sm h-20 resize-none"
                        value={formData.galleryUrls} onChange={e => setFormData({...formData, galleryUrls: e.target.value})} 
                      ></textarea>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <textarea 
                    className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all text-sm h-24 resize-none"
                    placeholder="Enter product details, materials, fit..."
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                  ></textarea>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                  <button type="button" className="w-full sm:w-auto font-bold text-text-secondary hover:text-white px-6 py-3 rounded-xl bg-surface-deep hover:bg-white/10 transition-colors" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="w-full sm:w-auto bg-brand-primary text-black font-bold px-8 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-[1.02] transition-all">
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;