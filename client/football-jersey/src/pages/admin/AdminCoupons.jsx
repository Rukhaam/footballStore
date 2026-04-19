import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Ticket, Plus, Trash2, AlertTriangle, Percent, IndianRupee } from 'lucide-react';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState({ show: false, id: null, code: '' });
  
  const [formData, setFormData] = useState({
    code: '', discountType: 'percentage', discountValue: '',
    minOrderAmount: '', maxDiscountAmount: '', maxUses: '', expirationDate: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/promo');
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id, code) => {
    setShowConfirm({ show: true, id, code });
  };

  const handleDelete = async () => {
    const id = showConfirm.id;
    const loadingToast = toast.loading('Deleting coupon...');
    try {
      await api.delete(`/promo/${id}`);
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('Coupon deleted successfully!', { id: loadingToast });
      setShowConfirm({ show: false, id: null, code: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete coupon', { id: loadingToast });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Creating coupon...');
    try {
      await api.post('/promo', {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null
      });
      toast.success('Coupon created successfully!', { id: loadingToast });
      setShowModal(false);
      setFormData({
        code: '', discountType: 'percentage', discountValue: '',
        minOrderAmount: '', maxDiscountAmount: '', maxUses: '', expirationDate: ''
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create coupon', { id: loadingToast });
    }
  };

  return (
    <div className="text-white w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="kinetic-heading text-3xl md:text-4xl tracking-wider text-white uppercase mb-1">
            Manage <span className="text-brand-primary">Coupons</span>
          </h2>
          <p className="text-text-secondary font-inter text-sm">Create and manage promotional discount codes.</p>
        </div>
        
        <button 
          className="flex items-center justify-center gap-2 bg-brand-primary text-black font-bold font-inter px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] hover:scale-105 transition-all w-full sm:w-auto" 
          onClick={() => setShowModal(true)}>
          <Plus size={18} strokeWidth={3} /> Add Coupon
        </button>
      </div>

      {/* TABLE CONTAINER - Glassmorphic */}
      <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
            <p className="text-text-secondary font-inter text-sm animate-pulse">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center h-64 gap-4 text-text-secondary">
            <Ticket size={48} className="opacity-50" />
            <p className="font-inter">No promotional codes found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left font-inter whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/5 bg-surface-base/30">
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Promo Code</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Value</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Usage</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                      <Ticket size={16} className="text-brand-primary" />
                      <span className="tracking-widest bg-white/5 px-2 py-1 rounded">{coupon.code}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        {coupon.discountType === 'percentage' ? <Percent size={14} /> : <IndianRupee size={14} />}
                        <span className="capitalize">{coupon.discountType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-primary text-lg">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${coupon.maxUses && coupon.currentUses >= coupon.maxUses ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {coupon.currentUses} / {coupon.maxUses || '∞'} Uses
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors" 
                        onClick={() => confirmDelete(coupon.id, coupon.code)}
                        title="Delete Coupon"
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
      </div>

      {/* CONFIRMATION MODAL - Glassmorphic */}
      {showConfirm.show && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-surface-low/90 backdrop-blur-xl p-8 rounded-3xl w-full max-w-sm border border-white/10 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl mb-2 font-bold kinetic-heading text-white">Delete Coupon?</h3>
            <p className="text-text-secondary font-inter mb-8 text-sm leading-relaxed">
              Are you sure you want to delete the code <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">{showConfirm.code}</span>? Customers will no longer be able to use it.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button className="flex-1 text-text-secondary font-bold font-inter bg-surface-deep hover:bg-white/10 px-4 py-3 rounded-xl transition" onClick={() => setShowConfirm({ show: false, id: null, code: '' })}>
                Cancel
              </button>
              <button className="flex-1 bg-red-500 text-white font-bold font-inter px-4 py-3 rounded-xl hover:bg-red-600 transition shadow-[0_0_15px_rgba(255,0,0,0.3)]" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD COUPON MODAL - Glassmorphic */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-surface-low/95 backdrop-blur-2xl p-8 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl my-8 animate-in zoom-in-95 duration-300 relative">
            
            {/* Ambient Background Glow inside modal */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

            <div className="relative z-10">
              <h3 className="kinetic-heading text-2xl mb-6 text-white tracking-wider flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
                  <Ticket size={24} />
                </div>
                New Coupon
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5 font-inter">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Promo Code</label>
                  <input 
                    className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all uppercase tracking-widest font-bold"
                    type="text" placeholder="e.g. KINETIC20" required
                    value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Type</label>
                    <select 
                      className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary border border-white/5 transition-all cursor-pointer appearance-none"
                      value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}
                    >
                      <option value="percentage">Percentage %</option>
                      <option value="fixed">Fixed Flat ₹</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Discount Value</label>
                    <input 
                      className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all"
                      type="number" placeholder={formData.discountType === 'percentage' ? "20" : "500"} required min="1"
                      value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="bg-surface-deep/30 p-4 rounded-2xl border border-white/5 space-y-4">
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Optional Restrictions</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input 
                        className="w-full bg-surface-deep text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-primary border border-white/5 text-sm transition-all"
                        type="number" placeholder="Min Order (₹)" min="0"
                        value={formData.minOrderAmount} onChange={e => setFormData({...formData, minOrderAmount: e.target.value})} 
                      />
                    </div>
                    <div>
                      <input 
                        className="w-full bg-surface-deep text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-primary border border-white/5 text-sm transition-all"
                        type="number" placeholder="Max Uses (Qty)" min="1"
                        value={formData.maxUses} onChange={e => setFormData({...formData, maxUses: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                  <button type="button" className="w-full sm:w-auto font-bold text-text-secondary hover:text-white px-6 py-3 rounded-xl bg-surface-deep hover:bg-white/10 transition-colors" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="w-full sm:w-auto bg-brand-primary text-black font-bold px-8 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-[1.02] transition-all">
                    Create Code
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

export default AdminCoupons;
