import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  UserRound
} from 'lucide-react';

const getStatusStyles = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'paid':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'processing':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'shipped':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'delivered':
      return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
    case 'cancelled':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-surface-deep text-text-secondary border-white/10';
  }
};

const extractAddressFromSnapshot = (snapshot) => {
  if (!snapshot) return 'N/A';
  return String(snapshot).replace(/\s*Phone:\s*.*$/i, '').trim();
};

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    if (!order) return;

    const loadingToast = toast.loading('Updating status...');
    setUpdatingStatus(true);

    try {
      await api.put(`/orders/${order.id}/status`, { status: newStatus });
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      toast.success('Order status updated!', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status', { id: loadingToast });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const totals = useMemo(() => {
    if (!order?.items?.length) {
      return { subtotal: 0, total: Number(order?.totalAmount || 0) };
    }

    const subtotal = order.items.reduce((acc, item) => {
      const unit = Number(item.priceAtPurchase || 0);
      return acc + unit * Number(item.quantity || 0);
    }, 0);

    return {
      subtotal,
      total: Number(order.totalAmount || 0)
    };
  }, [order]);

  if (loading) {
    return (
      <div className="text-white w-full max-w-7xl mx-auto space-y-8">
        <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl min-h-[420px] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-white w-full max-w-7xl mx-auto space-y-6">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors font-bold text-sm"
        >
          <ArrowLeft size={16} /> Back to orders
        </Link>
        <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 text-center">
          <p className="text-text-secondary">Order not found.</p>
        </div>
      </div>
    );
  }

  const customerName = order.customer?.name || 'N/A';
  const customerEmail = order.customer?.email || 'N/A';
  const customerPhone = order.customer?.phone || 'N/A';
  const addressSnapshot = order.customer?.addressSnapshot || order.addressSnapshot;

  return (
    <div className="text-white w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors font-bold text-sm"
          >
            <ArrowLeft size={16} /> Back to orders
          </Link>
          <h2 className="kinetic-heading text-3xl md:text-4xl tracking-wider text-white uppercase">
            Order <span className="text-brand-primary">#{order.id}</span>
          </h2>
          <p className="text-text-secondary font-inter text-sm flex items-center gap-2">
            <CalendarDays size={14} className="text-brand-primary" />
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs uppercase tracking-widest font-bold px-3 py-2 rounded-full border ${getStatusStyles(order.status)}`}
          >
            {order.status}
          </span>
          <select
            value={order.status}
            disabled={updatingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`appearance-none font-bold text-xs uppercase tracking-widest px-4 py-2 pr-8 rounded-full outline-none cursor-pointer transition-all border ${getStatusStyles(order.status)} disabled:opacity-70`}
          >
            <option value="pending" className="bg-surface-base text-white">Pending</option>
            <option value="paid" className="bg-surface-base text-white">Paid</option>
            <option value="processing" className="bg-surface-base text-white">Processing</option>
            <option value="shipped" className="bg-surface-base text-white">Shipped</option>
            <option value="delivered" className="bg-surface-base text-white">Delivered</option>
            <option value="cancelled" className="bg-surface-base text-white">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5">
            <h3 className="kinetic-heading text-xl uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={18} className="text-brand-primary" /> Items Ordered
            </h3>
          </div>

          {!order.items?.length ? (
            <div className="px-6 py-10 text-text-secondary font-inter text-sm">No items found for this order.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-inter whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5 bg-surface-base/30">
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Qty</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Size</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Unit</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => {
                    const unitPrice = Number(item.priceAtPurchase || 0);
                    const quantity = Number(item.quantity || 0);

                    return (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-16 bg-surface-deep rounded-lg p-1 border border-white/5 overflow-hidden shrink-0">
                              <img
                                src={item.productImageUrl || 'https://via.placeholder.com/120'}
                                alt={item.productName}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="font-semibold text-white text-sm">{item.productName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{quantity}</td>
                        <td className="px-6 py-4 text-text-secondary">{item.size || 'N/A'}</td>
                        <td className="px-6 py-4 text-text-secondary">Rs {unitPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-white font-bold">Rs {(unitPrice * quantity).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="kinetic-heading text-lg uppercase tracking-wider">Customer Details</h3>
            <div className="space-y-3 text-sm font-inter">
              <p className="flex items-start gap-2 text-text-secondary">
                <UserRound size={15} className="mt-0.5 text-brand-primary" />
                <span><span className="text-white font-bold">Name:</span> {customerName}</span>
              </p>
              <p className="flex items-start gap-2 text-text-secondary">
                <Mail size={15} className="mt-0.5 text-brand-primary" />
                <span><span className="text-white font-bold">Email:</span> {customerEmail}</span>
              </p>
              <p className="flex items-start gap-2 text-text-secondary">
                <Phone size={15} className="mt-0.5 text-brand-primary" />
                <span><span className="text-white font-bold">Phone:</span> {customerPhone}</span>
              </p>
              <p className="flex items-start gap-2 text-text-secondary leading-relaxed">
                <MapPin size={15} className="mt-0.5 text-brand-primary" />
                <span><span className="text-white font-bold">Address:</span> {extractAddressFromSnapshot(addressSnapshot)}</span>
              </p>
              <p className="text-xs text-text-secondary leading-relaxed bg-surface-deep/60 border border-white/5 rounded-xl p-3">
                <span className="text-white font-bold">Submitted details:</span> {addressSnapshot || 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-3">
            <h3 className="kinetic-heading text-lg uppercase tracking-wider">Payment Summary</h3>
            <div className="flex justify-between text-sm font-inter text-text-secondary">
              <span>Items Subtotal</span>
              <span>Rs {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-inter text-text-secondary">
              <span>Grand Total</span>
              <span className="text-white font-bold">Rs {totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
