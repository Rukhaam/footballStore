import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { clearLocalCart } from "../features/cartSlice";

// 1. Helper function to load the Razorpay SDK script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "", 
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.priceAtTime) * item.quantity,
    0
  );
  const shipping = subtotal > 100 ? 0 : 15.0; 
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    setIsProcessing(true);

    try {
      const addressSnapshot = `${formData.fullName}, ${formData.address}, ${formData.city}, ${formData.postalCode}. Phone: ${formData.phone}`;

      // Grab size safely from Redux or DB structure
      const cleanCartItems = items.map(item => {
        const itemSize = item.size || item.product?.size;

        return {
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          product: {
            id: item.product.id,
            name: item.product.name,
            size: itemSize 
          }
        };
      });

      const orderPayload = {
        customerDetails: formData,
        addressSnapshot: addressSnapshot,
        cartItems: cleanCartItems, 
        isGuest: !isAuthenticated
      };

      // Step 1: Create DB Order + Razorpay Order
      const { data } = await api.post('/orders/checkout', orderPayload);

      // Step 2: Load the Razorpay Window
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you connected to the internet?");
        setIsProcessing(false);
        return;
      }

      // Step 3: Configure and open the Razorpay Modal
      const options = {
        key: data.keyId,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Kinetic Arena",
        description: "Premium Football Gear",
        order_id: data.razorpayOrder.id,
        // The handler runs automatically when payment is successful
        handler: async function (response) {
          try {
            // Verify the signature on the backend
            await api.post('/orders/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              dbOrderId: data.dbOrderId 
            });
            
            dispatch(clearLocalCart());
            alert("Payment successful! Welcome to the Kinetic Arena.");
            navigate('/');
          } catch (err) {
            console.error("Verification failed:", err);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#00FF00" // Kinetic Arena brand color (adjust to your preference)
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      // Handle user closing the window without paying or failed payment
      paymentObject.on('payment.failed', function (response) {
        alert("Payment failed or was cancelled. Please try again.");
      });

    } catch (error) {
      const backendError = error.response?.data?.error || "Failed to process order.";
      console.error("Checkout failed:", backendError);
      alert(`Checkout Failed: ${backendError}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <h2 className="kinetic-heading text-3xl md:text-4xl text-white mb-4">
          Your Cart is Empty
        </h2>
        <p className="text-text-secondary font-inter mb-8">
          You need some gear before you can check out.
        </p>
        <Link to="/" className="btn-primary px-8 py-3">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 w-full">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-inter text-text-secondary hover:text-white transition-colors mb-8 uppercase tracking-widest font-bold"
      >
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      <h1 className="kinetic-heading text-4xl md:text-5xl text-white uppercase mb-10 border-b border-white/10 pb-6">
        Secure Checkout
      </h1>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <div className="w-full lg:w-3/5">
          <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="flex flex-col gap-8">
            <div className="bg-surface-low border border-white/5 p-6 rounded-2xl">
              <h2 className="kinetic-heading text-xl text-white uppercase tracking-widest mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Full Name</label>
                  <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="Lionel Messi" />
                </div>
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Email Address</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="leo@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Phone Number</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
            </div>

            <div className="bg-surface-low border border-white/5 p-6 rounded-2xl">
              <h2 className="kinetic-heading text-xl text-white uppercase tracking-widest mb-6">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Street Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="100 Pitch Ave, Suite 10" />
                </div>
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="Miami" />
                </div>
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Postal / Zip Code</label>
                  <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="33101" />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="w-full lg:w-2/5 sticky top-28 bg-surface-low border border-white/5 p-6 rounded-2xl">
          <h2 className="kinetic-heading text-xl text-white uppercase tracking-widest mb-6">Order Summary</h2>

          <div className="flex flex-col gap-4 mb-6 max-h-[40vh] overflow-y-auto pr-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div className="w-16 h-20 bg-surface-deep rounded flex items-center justify-center p-2 shrink-0">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-inter text-white font-bold line-clamp-1">{item.product.name}</h4>
                  <p className="text-xs font-inter text-text-secondary mt-1">
                    Qty: {item.quantity} {item.size || item.product?.size ? `| Size: ${item.size || item.product?.size}` : ''}
                  </p>
                </div>
                <div className="text-sm font-inter text-brand-primary font-bold">
                  ${(parseFloat(item.priceAtTime) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4 flex flex-col gap-3 font-inter">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Shipping</span>
              {shipping === 0 ? <span className="text-brand-primary uppercase text-xs font-bold tracking-widest">Free</span> : <span>${shipping.toFixed(2)}</span>}
            </div>
            <div className="flex justify-between text-lg text-white font-bold border-t border-white/10 pt-4 mt-2">
              <span>Total</span>
              <span className="text-brand-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" form="checkout-form" disabled={isProcessing} className="btn-primary w-full py-4 mt-8 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isProcessing ? "Processing Order..." : "Confirm & Pay"}
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs font-inter text-text-secondary uppercase tracking-widest">
            <ShieldCheck size={14} className="text-brand-primary" /> Secure Encrypted Checkout
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;