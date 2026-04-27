import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../services/supabaseClient';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, Plus, Trash2, AlertTriangle, Image as ImageIcon, Pencil,
  Link as LinkIcon, UploadCloud, ChevronLeft, ChevronRight, 
  PackageSearch, ChevronDown, Check
} from 'lucide-react';

const normalizeCsvKey = (key) => String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const CSV_COLUMN_ALIASES = {
  name: ['name', 'productname'],
  price: ['price'],
  originalPrice: ['originalprice'],
  stock: ['stock', 'quantity'],
  categoryId: ['categoryid'],
  categoryName: ['categoryname', 'category'],
  collectionId: ['collectionid'],
  collectionName: ['collectionname', 'collection'],
  productImageUrl: ['productimageurl', 'imageurl', 'image'],
  gallery: ['gallery', 'galleryurls'],
  description: ['description', 'desc']
};

const CSV_SIZE_COLUMN_ALIASES = {
  XS: ['xs', 'sizexs', 'stockxs', 'xssize', 'xsstock'],
  S: ['s', 'sizes', 'stocks', 'ssize', 'sstock'],
  M: ['m', 'sizem', 'stockm', 'msize', 'mstock'],
  L: ['l', 'sizel', 'stockl', 'lsize', 'lstock'],
  XL: ['xl', 'sizexl', 'stockxl', 'xlsize', 'xlstock'],
  XXL: ['xxl', 'sizexxl', 'stockxxl', 'xxlsize', 'xxlstock']
};

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const createInitialSizeStock = () => (
  SIZE_OPTIONS.reduce((acc, size) => {
    acc[size] = '';
    return acc;
  }, {})
);

const getDefaultFormData = ({ categoryId = '', collectionId = '' } = {}) => ({
  name: '',
  price: '',
  originalPrice: '',
  stock: '',
  categoryId,
  collectionId,
  productImageUrl: '',
  galleryUrls: '',
  description: '',
  sizeStock: createInitialSizeStock()
});

const getCsvFieldValue = (row, aliases) => {
  for (const alias of aliases) {
    const value = row[alias];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return undefined;
};

const normalizeCsvRow = (rawRow, rowIndex) => {
  const normalizedRawRow = {};
  Object.entries(rawRow || {}).forEach(([key, value]) => {
    const normalizedKey = normalizeCsvKey(key);
    if (!normalizedKey) return;
    normalizedRawRow[normalizedKey] = value;
  });

  const normalizedRow = { rowNumber: rowIndex + 2 };

  Object.entries(CSV_COLUMN_ALIASES).forEach(([field, aliases]) => {
    const fieldValue = getCsvFieldValue(normalizedRawRow, aliases);
    if (fieldValue !== undefined) {
      normalizedRow[field] = fieldValue;
    }
  });

  const sizeStock = {};
  Object.entries(CSV_SIZE_COLUMN_ALIASES).forEach(([sizeLabel, aliases]) => {
    const sizeValue = getCsvFieldValue(normalizedRawRow, aliases);
    if (sizeValue !== undefined) {
      sizeStock[sizeLabel] = sizeValue;
    }
  });

  if (Object.keys(sizeStock).length) {
    normalizedRow.sizeStock = sizeStock;
  }

  return normalizedRow;
};

const hasCsvRowContent = (row) => (
  Object.keys(row).some((key) => key !== 'rowNumber' && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '')
);

const normalizeSizeStockPayload = (sizeStock = {}) => (
  SIZE_OPTIONS.reduce((acc, size) => {
    const rawValue = sizeStock[size];
    const parsed = Number.parseInt(String(rawValue ?? '').trim(), 10);
    acc[size] = Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
    return acc;
  }, {})
);

const getSizeStockTotal = (sizeStock = {}) => (
  Object.values(normalizeSizeStockPayload(sizeStock)).reduce((sum, value) => sum + value, 0)
);

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showConfirm, setShowConfirm] = useState({ show: false, id: null, name: '' });
  
  // Custom Dropdown States
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);

  // Pagination & Search states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const limit = 10;
  
  // Refs
  const abortControllerRef = useRef(null);
  const csvInputRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const collectionDropdownRef = useRef(null);

  // Modal Form States
  const [uploadType, setUploadType] = useState('file'); 
  const [formData, setFormData] = useState(getDefaultFormData());
  const [files, setFiles] = useState([]); 

  const resetFormForCreate = () => {
    setFormData(getDefaultFormData({
      categoryId: categories[0] ? String(categories[0].id) : '',
      collectionId: collections[0] ? String(collections[0].id) : ''
    }));
    setUploadType('file');
    setFiles([]);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setIsCategoryOpen(false);
    setIsCollectionOpen(false);
    resetFormForCreate();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsCategoryOpen(false);
    setIsCollectionOpen(false);
    resetFormForCreate();
    setShowModal(true);
  };

  useEffect(() => {
    fetchFormOptions();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts(page, searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  // --- NEW: Bulletproof Click-Outside Listener ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      if (collectionDropdownRef.current && !collectionDropdownRef.current.contains(event.target)) {
        setIsCollectionOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // ----------------------------------------------

  const fetchFormOptions = async () => {
    try {
      setMetaLoading(true);
      const [categoriesRes, collectionsRes] = await Promise.all([
        api.get('/store/categories', { params: { page: 1, limit: 100 } }),
        api.get('/store/collections')
      ]);

      const categoryList = categoriesRes.data?.data || [];
      const collectionList = collectionsRes.data || [];

      setCategories(categoryList);
      setCollections(collectionList);

      setFormData((prev) => ({
        ...prev,
        categoryId: prev.categoryId || (categoryList[0] ? String(categoryList[0].id) : ''),
        collectionId: prev.collectionId || (collectionList[0] ? String(collectionList[0].id) : '')
      }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load category and collection lists');
    } finally {
      setMetaLoading(false);
    }
  };

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
    setFiles(Array.from(e.target.files));
  };

  const handleEditProduct = async (product) => {
    const loadingToast = toast.loading('Loading product details...');

    try {
      const response = await api.get(`/store/${product.id}`);
      const productDetail = response.data;

      const mappedSizeStock = createInitialSizeStock();
      (productDetail.sizes || []).forEach((sizeRow) => {
        const sizeLabel = String(sizeRow?.size || '').trim().toUpperCase();
        if (SIZE_OPTIONS.includes(sizeLabel)) {
          mappedSizeStock[sizeLabel] = String(sizeRow.stock ?? 0);
        }
      });

      setFormData({
        name: productDetail.productName || '',
        price: productDetail.price ?? '',
        originalPrice: productDetail.originalPrice ?? '',
        stock: productDetail.stock ?? '',
        categoryId: productDetail.categoryId ? String(productDetail.categoryId) : '',
        collectionId: productDetail.collectionId ? String(productDetail.collectionId) : '',
        productImageUrl: productDetail.productImageUrl || '',
        galleryUrls: Array.isArray(productDetail.gallery) ? productDetail.gallery.join(', ') : '',
        description: productDetail.description || '',
        sizeStock: mappedSizeStock
      });

      setUploadType('url');
      setFiles([]);
      setEditingProduct(productDetail);
      setIsCategoryOpen(false);
      setIsCollectionOpen(false);
      setShowModal(true);
      toast.success('Product loaded for editing', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load product details', { id: loadingToast });
    }
  };

  const triggerCsvFilePicker = () => {
    if (!csvImporting) {
      csvInputRef.current?.click();
    }
  };

  const handleCsvImport = (e) => {
    const file = e.target.files?.[0];
    const inputElement = e.target;

    if (!file) return;

    const loadingToast = toast.loading('Importing products from CSV...');
    setCsvImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        try {
          if (results.errors?.length) {
            const firstError = results.errors[0];
            const row = Number.isInteger(firstError.row) ? firstError.row + 1 : 'unknown';
            toast.error(`CSV parse error near row ${row}: ${firstError.message}`, { id: loadingToast });
            return;
          }

          const normalizedRows = (results.data || [])
            .map((row, index) => normalizeCsvRow(row, index))
            .filter(hasCsvRowContent);

          if (normalizedRows.length === 0) {
            toast.error('CSV has no usable rows to import', { id: loadingToast });
            return;
          }

          const csvValidationFailures = [];
          const rowsForUpload = normalizedRows.map((row) => {
            const normalizedStock = Number.parseInt(String(row.stock ?? '').trim(), 10);

            if (!Number.isInteger(normalizedStock) || normalizedStock < 0) {
              csvValidationFailures.push(`Row ${row.rowNumber}: stock must be a valid non-negative integer`);
              return row;
            }

            const rawSizeStock = row.sizeStock || {};
            if (!Object.keys(rawSizeStock).length) {
              csvValidationFailures.push(`Row ${row.rowNumber}: size columns are required (XS, S, M, L, XL, XXL)`);
              return row;
            }

            const normalizedSizeStock = normalizeSizeStockPayload(rawSizeStock);
            const sizeStockTotal = Object.values(normalizedSizeStock).reduce((sum, value) => sum + value, 0);

            if (normalizedStock !== sizeStockTotal) {
              csvValidationFailures.push(`Row ${row.rowNumber}: stock (${normalizedStock}) must equal size total (${sizeStockTotal})`);
              return row;
            }

            return {
              ...row,
              stock: normalizedStock,
              sizeStock: normalizedSizeStock
            };
          });

          if (csvValidationFailures.length > 0) {
            toast.error(csvValidationFailures.slice(0, 3).join(' | '), { id: loadingToast });
            return;
          }

          const response = await api.post('/store/bulk', { products: rowsForUpload });
          const insertedCount = response.data?.insertedCount || 0;
          const failedCount = response.data?.failedCount || 0;
          const failures = response.data?.failures || [];

          if (insertedCount > 0) {
            toast.success(`Imported ${insertedCount} product(s)`, { id: loadingToast });
          } else {
            toast.error('No products were imported', { id: loadingToast });
          }

          if (failedCount > 0) {
            const sampleMessage = failures
              .slice(0, 3)
              .map((failure) => `Row ${failure.row}: ${failure.error}`)
              .join(' | ');

            toast.error(`${failedCount} row(s) were skipped. ${sampleMessage}`);
          }

          setPage(1);
          fetchProducts(1, searchQuery);
        } catch (err) {
          console.error(err);
          const errorMessage = err.response?.data?.error || 'Failed to import CSV products';
          toast.error(errorMessage, { id: loadingToast });
        } finally {
          setCsvImporting(false);
          inputElement.value = '';
        }
      },
      error: (error) => {
        console.error(error);
        toast.error('Failed to parse CSV file', { id: loadingToast });
        setCsvImporting(false);
        inputElement.value = '';
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditing = Boolean(editingProduct?.id);
    const loadingToast = toast.loading(isEditing ? 'Updating product...' : 'Adding product...');

    const normalizedSizeStock = normalizeSizeStockPayload(formData.sizeStock);
    const sizeStockTotal = Object.values(normalizedSizeStock).reduce((sum, value) => sum + value, 0);
    const normalizedStock = Number.parseInt(String(formData.stock).trim(), 10);

    if (!Number.isInteger(normalizedStock) || normalizedStock < 0) {
      toast.error('Initial stock must be a valid non-negative integer', { id: loadingToast });
      return;
    }

    if (normalizedStock !== sizeStockTotal) {
      toast.error(`Initial stock (${normalizedStock}) must equal size total (${sizeStockTotal})`, { id: loadingToast });
      return;
    }
    
    let mainImageUrl = formData.productImageUrl;
    let gallery = [];
    
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
          
        if (i === 0) {
          mainImageUrl = publicUrlData.publicUrl;
        } else {
          gallery.push(publicUrlData.publicUrl);
        }
      }
    } 
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
      const payload = { 
        ...formData, 
        stock: normalizedStock,
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        collectionId: formData.collectionId ? Number(formData.collectionId) : null,
        productImageUrl: mainImageUrl,
        gallery: gallery,
        sizeStock: normalizedSizeStock
      };

      if (isEditing) {
        await api.put(`/store/${editingProduct.id}`, payload);
      } else {
        await api.post('/store', payload);
      }
      
      toast.success(isEditing ? 'Product updated successfully' : 'Product added successfully', { id: loadingToast });
      closeModal();
      fetchProducts(page, searchQuery);
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || (isEditing ? 'Failed to update product' : 'Failed to add product');
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const selectedCategoryName = categories.find(c => String(c.id) === formData.categoryId)?.categoryName || 'Select category';
  const selectedCollectionName = collections.find(c => String(c.id) === formData.collectionId)?.collectionName || 'Select collection';
  const sizeStockTotal = getSizeStockTotal(formData.sizeStock);
  const normalizedFormStock = Number.parseInt(String(formData.stock).trim(), 10);
  const stockMismatch = Number.isInteger(normalizedFormStock) && normalizedFormStock !== sizeStockTotal;

  return (
    <div className="text-white w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="kinetic-heading text-3xl md:text-4xl tracking-wider text-white uppercase mb-1">
            Manage <span className="text-brand-primary">Products</span>
          </h2>
          <p className="text-text-secondary font-inter text-sm">Add, update, or remove your store's inventory.</p>
          <p className="text-text-secondary/80 font-inter text-xs mt-2">
            Bulk CSV headers: name, price, stock, XS, S, M, L, XL, XXL, categoryName or categoryId, collectionName or collectionId, productImageUrl, gallery (use | between URLs), description.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
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
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <button
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface-deep text-white font-bold font-inter px-6 py-2.5 rounded-full border border-white/10 hover:border-brand-primary/50 hover:bg-surface-low transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={triggerCsvFilePicker}
            disabled={csvImporting}
          >
            <UploadCloud size={16} /> {csvImporting ? 'Importing...' : 'Import CSV'}
          </button>
          <button 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-primary text-black font-bold font-inter px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] hover:scale-105 transition-all" 
            onClick={openCreateModal}>
            <Plus size={18} strokeWidth={3} /> Add Product
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden min-h-[400px] flex flex-col relative z-0">
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
                        className="p-2 mr-1 text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                        onClick={() => handleEditProduct(product)}
                        title="Edit Product"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors relative z-10" 
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] backdrop-blur-md p-4 animate-in fade-in duration-200">
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

      {/* ADD/EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-surface-low/95 backdrop-blur-2xl p-8 rounded-3xl w-full max-w-xl border border-white/10 shadow-2xl my-8 animate-in zoom-in-95 duration-300 relative z-[102]">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

            <div className="relative z-10">
              <h3 className="kinetic-heading text-2xl mb-6 text-white tracking-wider flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
                  <PackageSearch size={24} />
                </div>
                {editingProduct ? 'Edit Gear' : 'Add New Gear'}
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
                      value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="bg-surface-deep/30 p-5 rounded-2xl border border-white/5">
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Size-wise Stock</label>
                  <p className="text-xs text-text-secondary mb-4">Enter stock for each size. The sum must match Initial Stock.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SIZE_OPTIONS.map((size) => (
                      <div key={size} className="bg-surface-deep/60 border border-white/5 rounded-xl px-3 py-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">{size}</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.sizeStock[size]}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              sizeStock: {
                                ...prev.sizeStock,
                                [size]: value
                              }
                            }));
                          }}
                          className="w-full bg-transparent text-white text-sm font-bold focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-text-secondary">Size total: <span className="text-white">{sizeStockTotal}</span></span>
                    <span className="text-text-secondary">Initial stock: <span className="text-white">{Number.isInteger(normalizedFormStock) ? normalizedFormStock : 0}</span></span>
                  </div>

                  {stockMismatch && (
                    <p className="text-xs text-red-400 mt-2">Initial stock does not match the sum of sizes.</p>
                  )}
                </div>

                {/* Custom Category & Collection Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Category Dropdown with Ref */}
                  <div className="relative" ref={categoryDropdownRef}>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Category</label>
                    <button
                      type="button"
                      onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsCollectionOpen(false); }}
                      disabled={metaLoading || categories.length === 0}
                      className="w-full flex items-center justify-between bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all disabled:opacity-50"
                    >
                      <span className="truncate pr-2">{metaLoading ? 'Loading...' : selectedCategoryName}</span>
                      <ChevronDown size={16} className={`text-text-secondary transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isCategoryOpen && (
                      <ul className="absolute z-[105] w-full mt-2 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 custom-scrollbar">
                        {categories.map((category) => (
                          <li
                            key={category.id}
                            onClick={() => {
                              setFormData({ ...formData, categoryId: String(category.id) });
                              setIsCategoryOpen(false);
                            }}
                            className={`px-4 py-3 cursor-pointer transition-all flex items-center justify-between text-sm ${
                              formData.categoryId === String(category.id)
                                ? 'bg-brand-primary/10 text-brand-primary font-bold border-l-2 border-brand-primary'
                                : 'text-text-secondary hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                            }`}
                          >
                            <span className="truncate">{category.categoryName}</span>
                            {formData.categoryId === String(category.id) && <Check size={16} />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Collection Dropdown with Ref */}
                  <div className="relative" ref={collectionDropdownRef}>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Collection</label>
                    <button
                      type="button"
                      onClick={() => { setIsCollectionOpen(!isCollectionOpen); setIsCategoryOpen(false); }}
                      disabled={metaLoading || collections.length === 0}
                      className="w-full flex items-center justify-between bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all disabled:opacity-50"
                    >
                      <span className="truncate pr-2">{metaLoading ? 'Loading...' : selectedCollectionName}</span>
                      <ChevronDown size={16} className={`text-text-secondary transition-transform duration-300 ${isCollectionOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isCollectionOpen && (
                      <ul className="absolute z-[105] w-full mt-2 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 custom-scrollbar">
                        {collections.map((collection) => (
                          <li
                            key={collection.id}
                            onClick={() => {
                              setFormData({ ...formData, collectionId: String(collection.id) });
                              setIsCollectionOpen(false);
                            }}
                            className={`px-4 py-3 cursor-pointer transition-all flex items-center justify-between text-sm ${
                              formData.collectionId === String(collection.id)
                                ? 'bg-brand-primary/10 text-brand-primary font-bold border-l-2 border-brand-primary'
                                : 'text-text-secondary hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                            }`}
                          >
                            <span className="truncate">{collection.collectionName}</span>
                            {formData.collectionId === String(collection.id) && <Check size={16} />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {!metaLoading && (categories.length === 0 || collections.length === 0) && (
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wider bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
                    <AlertTriangle size={14} className="inline mr-2 -mt-0.5" />
                    Add at least one category and one collection before creating products.
                  </p>
                )}

                {/* Image Upload Toggle */}
                <div className="bg-surface-deep/30 p-5 rounded-2xl border border-white/5">
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Product Images</label>
                  <div className="flex p-1 bg-surface-deep rounded-xl mb-4">
                    <button 
                      type="button"
                      onClick={() => setUploadType('file')} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${uploadType === 'file' ? 'bg-surface-low text-white shadow-md border border-white/5' : 'text-text-secondary hover:text-white'}`}
                    >
                      <UploadCloud size={16} /> File Upload
                    </button>
                    <button 
                      type="button"
                      onClick={() => setUploadType('url')} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${uploadType === 'url' ? 'bg-surface-low text-white shadow-md border border-white/5' : 'text-text-secondary hover:text-white'}`}
                    >
                      <LinkIcon size={16} /> Image URL
                    </button>
                  </div>
                  
                  {uploadType === 'file' ? (
                    <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group">
                      <input 
                        type="file" accept="image/*" multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange} required
                      />
                      <ImageIcon className="text-white/20 group-hover:text-brand-primary transition-colors mb-3" size={36} strokeWidth={1.5} />
                      <p className="text-sm font-bold text-white mb-1">
                        {files.length > 0 ? <span className="text-brand-primary">{files.length} file(s) selected</span> : 'Drag & drop or click to browse'}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {files.length > 0 ? 'Ready to upload' : 'Select multiple images for the gallery'}
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
                        className="w-full bg-surface-deep text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary border border-white/5 transition-all text-sm h-20 resize-none custom-scrollbar"
                        value={formData.galleryUrls} onChange={e => setFormData({...formData, galleryUrls: e.target.value})} 
                      ></textarea>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <textarea 
                    className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all text-sm h-24 resize-none custom-scrollbar"
                    placeholder="Enter product details, materials, fit..."
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                  ></textarea>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                  <button type="button" className="w-full sm:w-auto font-bold text-text-secondary hover:text-white px-6 py-3 rounded-xl bg-surface-deep hover:bg-white/10 transition-colors" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={metaLoading || categories.length === 0 || collections.length === 0 || stockMismatch}
                    className="w-full sm:w-auto bg-brand-primary text-black font-bold px-8 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    {editingProduct ? 'Update Product' : 'Save Product'}
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