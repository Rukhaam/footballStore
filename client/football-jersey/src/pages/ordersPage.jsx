import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowLeft, Clock } from "lucide-react";
import api from "../services/api";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/my-orders');
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full min-h-[80vh]">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-inter text-text-secondary hover:text-white transition-colors mb-8 uppercase tracking-widest font-bold"
      >
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      <h1 className="kinetic-heading text-4xl md:text-5xl text-white uppercase mb-10 border-b border-white/10 pb-6">
        Order History
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-low border border-white/5 rounded-2xl">
          <Package size={48} className="text-white/20 mb-4" />
          <h2 className="text-2xl text-white font-bold mb-2">No orders yet</h2>
          <p className="text-text-secondary font-inter mb-6">Looks like you haven't bought any gear yet.</p>
          <Link to="/" className="btn-primary px-8 py-3">Start Shopping</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-surface-low border border-white/5 rounded-2xl p-6 transition-all hover:border-white/10">
              
              {/* Order Header */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-4 mb-4">
                <div>
                  <p className="text-xs font-inter text-text-secondary uppercase tracking-widest mb-1">Order #{order.id}</p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Clock size={14} className="text-brand-primary"/>
                    {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col md:items-end">
                  <p className="text-lg font-bold text-brand-primary">₹{order.totalAmount}</p>
                  <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-widest font-bold mt-1 inline-block ${
                    order.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="flex flex-col gap-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-16 h-20 bg-surface-deep rounded flex items-center justify-center p-2 shrink-0">
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="text-sm font-inter text-white font-bold line-clamp-1">{item.productName}</h4>
                      <p className="text-xs font-inter text-text-secondary mt-1">
                        Qty: {item.quantity} {item.size ? `| Size: ${item.size}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;