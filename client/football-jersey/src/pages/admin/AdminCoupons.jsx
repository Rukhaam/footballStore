import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '', discountType: 'percentage', discountValue: '',
    minOrderAmount: '', maxDiscountAmount: '', maxUses: '', expirationDate: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/promo');
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this promotional code?')) {
      try {
        await api.delete(`/promo/${id}`);
        setCoupons(coupons.filter(c => c.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/promo', {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null
      });
      setShowModal(false);
      setFormData({
        code: '', discountType: 'percentage', discountValue: '',
        minOrderAmount: '', maxDiscountAmount: '', maxUses: '', expirationDate: ''
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="kinetic-heading text-2xl">Manage Coupons</h2>
        <button className="bg-brand-primary text-black font-semibold px-4 py-2 rounded" onClick={() => setShowModal(true)}>
          Add Coupon
        </button>
      </div>

      <div className="bg-surface-low rounded border border-white/10 p-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-left font-inter">
            <thead>
              <tr className="border-b border-white/10 text-text-secondary">
                <th className="pb-3 text-sm font-medium">Code</th>
                <th className="pb-3 text-sm font-medium">Type</th>
                <th className="pb-3 text-sm font-medium">Value</th>
                <th className="pb-3 text-sm font-medium">Uses</th>
                <th className="pb-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.id} className="border-b border-white/5 hover:bg-surface-deep transition">
                  <td className="py-4 font-semibold">{coupon.code}</td>
                  <td className="py-4 capitalize">{coupon.discountType}</td>
                  <td className="py-4 text-brand-primary">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </td>
                  <td className="py-4">{coupon.currentUses} / {coupon.maxUses || '∞'}</td>
                  <td className="py-4">
                    <button className="text-red-400 hover:text-red-500 text-sm font-semibold" onClick={() => handleDelete(coupon.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-surface-base p-6 rounded-lg w-full max-w-md border border-white/10">
            <h3 className="kinetic-heading text-xl mb-4">Add Coupon</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                className="w-full bg-surface-deep text-white px-4 py-2 rounded border border-white/10"
                type="text" placeholder="Promo Code (e.g. KINETIC20)" required
                value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
              />
              <div className="flex gap-4">
                <select className="w-full bg-surface-deep text-white px-4 py-2 rounded border border-white/10"
                  value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input 
                  className="w-full bg-surface-deep text-white px-4 py-2 rounded border border-white/10"
                  type="number" placeholder="Value (e.g. 20)" required
                  value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="text-text-secondary hover:text-white" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="bg-brand-primary text-black font-semibold px-4 py-2 rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
