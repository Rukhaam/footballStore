import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="text-white">
      <h2 className="kinetic-heading text-2xl mb-6">Manage Orders</h2>
      <div className="bg-surface-low rounded border border-white/10 p-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-left font-inter">
            <thead>
              <tr className="border-b border-white/10 text-text-secondary">
                <th className="pb-3 text-sm font-medium">Order ID</th>
                <th className="pb-3 text-sm font-medium">Customer</th>
                <th className="pb-3 text-sm font-medium">Amount</th>
                <th className="pb-3 text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-surface-deep transition">
                  <td className="py-4 font-semibold text-brand-primary">#{order.id}</td>
                  <td className="py-4">{order.customerName || 'User'}</td>
                  <td className="py-4">₹{order.totalAmount}</td>
                  <td className="py-4">
                    <select
                      className="bg-surface-base text-white border border-white/10 rounded px-2 py-1 outline-none font-inter text-sm"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
