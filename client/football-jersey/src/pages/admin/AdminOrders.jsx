import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Package, RefreshCw, ShoppingBag } from 'lucide-react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const loadingToast = toast.loading('Updating status...');
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
      toast.success('Order status updated!', { id: loadingToast });
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Failed to update status', { id: loadingToast });
    }
  };

  // Helper for dynamic status pill colors
  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'shipped': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'delivered': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-surface-deep text-text-secondary border-white/10';
    }
  };

  return (
    <div className="text-white w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="kinetic-heading text-3xl md:text-4xl tracking-wider text-white uppercase mb-1">
            Manage <span className="text-brand-primary">Orders</span>
          </h2>
          <p className="text-text-secondary font-inter text-sm">Track, update, and fulfill customer purchases.</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-2 bg-surface-low border border-white/10 hover:border-brand-primary/50 hover:text-brand-primary text-text-secondary font-inter font-bold px-4 py-2.5 rounded-full transition-all w-max"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* TABLE CONTAINER - Glassmorphic */}
      <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
            <p className="text-text-secondary font-inter text-sm animate-pulse">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center h-64 gap-4 text-text-secondary">
            <Package size={48} className="opacity-50" />
            <p className="font-inter">No orders have been placed yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left font-inter whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/5 bg-surface-base/30">
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Order ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                      <ShoppingBag size={16} className="text-brand-primary" />
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-secondary group-hover:text-white transition-colors">
                      {order.customerName || 'Guest User'}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      ₹{parseFloat(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {/* Styled Dropdown Pill */}
                      <div className="relative w-max">
                        <select
                          className={`appearance-none font-bold text-xs uppercase tracking-widest px-4 py-2 pr-8 rounded-full outline-none cursor-pointer transition-all border ${getStatusStyles(order.status)} hover:brightness-125`}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="pending" className="bg-surface-base text-white">Pending</option>
                          <option value="processing" className="bg-surface-base text-white">Processing</option>
                          <option value="shipped" className="bg-surface-base text-white">Shipped</option>
                          <option value="delivered" className="bg-surface-base text-white">Delivered</option>
                          <option value="cancelled" className="bg-surface-base text-white">Cancelled</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-70">
                          ▼
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;