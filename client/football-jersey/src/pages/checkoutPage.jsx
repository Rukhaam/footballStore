import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, ShieldAlert } from "lucide-react";
import api from "../services/api";
import { clearLocalCart } from "../features/cartSlice";
import { useToast } from "../context/contextHook";

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

// --- THE SMART PARSER ---
const parseSize = (rawSize) => {
  if (!rawSize) return null;
  if (typeof rawSize === "object" && rawSize !== null) {
    return rawSize.size;
  }
  if (typeof rawSize === "string" && rawSize.startsWith("{")) {
    try {
      return JSON.parse(rawSize).size;
    } catch (e) {
      return rawSize; // fallback
    }
  }
  return rawSize;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();
  
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
  const [formError, setFormError] = useState(null); 

  // --- PROMO CODE STATE ---
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); 
  const [promoError, setPromoError] = useState(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // --- MATH & CALCULATIONS ---
  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.priceAtTime) * item.quantity,
    0
  );
  // CheckoutPage.jsx
const shipping = subtotal > 100 ? 0 : 99.0; // Changed 15.0 to 99.0
  // Calculate Discount
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      discountAmount = subtotal * (appliedPromo.discountValue / 100);
    } else if (appliedPromo.discountType === 'fixed') {
      discountAmount = parseFloat(appliedPromo.discountValue);
    }
  }

  // Ensure total never drops below 0
  const total = Math.max(0, subtotal - discountAmount + shipping);

  // --- NEW: AUTO-EJECT INVALID PROMOS ---
  // If the user removes items and the subtotal drops too low, kick out the fixed promo code!
  useEffect(() => {
    if (appliedPromo && appliedPromo.discountType === 'fixed') {
      if (subtotal <= parseFloat(appliedPromo.discountValue)) {
        setAppliedPromo(null);
        setPromoError(`Code ${appliedPromo.code} removed: Cart subtotal must be strictly over ₹${appliedPromo.discountValue}.`);
      }
    }
  }, [subtotal, appliedPromo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError(null); 
  };

  // --- PROMO CODE HANDLERS ---
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError(null);

    try {
      // THE FIX: Pass the subtotal to the backend for secure validation
      const { data } = await api.post('/orders/validate-promo', { 
        code: promoInput,
        subtotal: subtotal 
      });
      setAppliedPromo(data);
      setPromoInput(""); 
      addToast(`Promo code ${data.code} applied!`, "success");
    } catch (error) {
      setPromoError(error.response?.data?.error || "Invalid promo code");
      setAppliedPromo(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
    addToast("Promo code removed", "success");
  };

  // --- FRONTEND VALIDATION & SANITIZATION ---
  const validateForm = () => {
    const { fullName, email, phone, address, city, postalCode } = formData;

    if (fullName.trim().length <= 5) return "Full Name must be longer than 5 characters.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "Please enter a valid email address.";

    if (phone.trim().length < 7) return "Please enter a valid phone number.";

    if (address.trim().length < 5) return "Address must be at least 5 characters long.";
    if (address.trim().length > 100) return "Address cannot exceed 100 characters."; 

    if (city.trim().length < 2) return "Please enter a valid city name.";

    if (postalCode.trim().length < 3) return "Please enter a valid postal/zip code.";

    return null; // Passes all checks
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      setFormError("Your cart is empty!");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsProcessing(true);
    setFormError(null);

    const sanitizedData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      postalCode: formData.postalCode.trim(),
    };

    try {
      const addressSnapshot = `${sanitizedData.fullName}, ${sanitizedData.address}, ${sanitizedData.city}, ${sanitizedData.postalCode}. Phone: ${sanitizedData.phone}`;

      const cleanCartItems = items.map((item) => {
        const rawSize = item.size || item.product?.size;
        const cleanSize = parseSize(rawSize);

        return {
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          product: {
            id: item.product.id,
            name: item.product.name,
            size: cleanSize,
          },
        };
      });

      const orderPayload = {
        customerDetails: sanitizedData, 
        addressSnapshot: addressSnapshot,
        cartItems: cleanCartItems,
        isGuest: !isAuthenticated,
        promoCode: appliedPromo ? appliedPromo.code : null // SEND PROMO CODE TO BACKEND
      };

      // Step 1: Create DB Order + Razorpay Order
      const { data } = await api.post("/orders/checkout", orderPayload);

      // Step 2: Load the Razorpay Window
      const res = await loadRazorpayScript();
      if (!res) {
        setFormError("Razorpay SDK failed to load. Are you connected to the internet?");
        setIsProcessing(false);
        return;
      }

  const options = {
        key: data.keyId,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Kinetic Arena",
        description: "Premium Football Gear",
        order_id: data.razorpayOrder.id,
        
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setFormError("Payment window was closed. You can try again when you're ready.");
          }
        },
        handler: async function (response) {
          try {
            await api.post("/orders/verify-payment", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              dbOrderId: data.dbOrderId,
            });

            dispatch(clearLocalCart());
            addToast("Payment successful! Welcome to the Kinetic Arena.");
            navigate("/");
          } catch (err) {
            console.error("Verification failed:", err);
            addToast("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: sanitizedData.fullName,
          email: sanitizedData.email,
          contact: sanitizedData.phone,
        },
        theme: {
          color: "#00FF00",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on("payment.failed", function (response) {
        setFormError("Payment failed or was cancelled. Please try again.");
      });
    } catch (error) {
      const backendError = error.response?.data?.error || "Failed to process order.";
      console.error("Checkout failed:", backendError);
      setFormError(`Checkout Failed: ${backendError}`);
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

      {formError && (
        <div className="mb-8 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-inter animate-in fade-in slide-in-from-top-2">
          <ShieldAlert size={18} className="shrink-0" />
          {formError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <div className="w-full lg:w-3/5">
          <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="flex flex-col gap-8">
            <div className="bg-surface-low border border-white/5 p-6 rounded-2xl">
              <h2 className="kinetic-heading text-xl text-white uppercase tracking-widest mb-6">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Full Name</label>
                  <input required type="text" name="fullName" maxLength={50} value={formData.fullName} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="Lionel Messi" />
                </div>
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Email Address</label>
                  <input required type="email" name="email" maxLength={100} value={formData.email} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="leo@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Phone Number</label>
                  <input required type="tel" name="phone" maxLength={20} value={formData.phone} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
            </div>

            <div className="bg-surface-low border border-white/5 p-6 rounded-2xl">
              <h2 className="kinetic-heading text-xl text-white uppercase tracking-widest mb-6">
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Street Address</label>
                  <input required type="text" name="address" maxLength={100} value={formData.address} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="100 Pitch Ave, Suite 10" />
                </div>
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">City</label>
                  <input required type="text" name="city" maxLength={50} value={formData.city} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="Miami" />
                </div>
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Postal / Zip Code</label>
                  <input required type="text" name="postalCode" maxLength={20} value={formData.postalCode} onChange={handleChange} className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter" placeholder="33101" />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="w-full lg:w-2/5 sticky top-28 bg-surface-low border border-white/5 p-6 rounded-2xl">
          <h2 className="kinetic-heading text-xl text-white uppercase tracking-widest mb-6">
            Order Summary
          </h2>

          <div
            className="flex flex-col gap-4 mb-6 max-h-[40vh] overflow-y-auto pr-2"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}
          >
            {items.map((item, index) => {
              const displaySize = parseSize(item.size || item.product?.size);

              return (
                <div key={index} className="flex items-center gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="w-16 h-20 bg-surface-deep rounded flex items-center justify-center p-2 shrink-0">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-sm font-inter text-white font-bold line-clamp-1">{item.product.name}</h4>
                    <p className="text-xs font-inter text-text-secondary mt-1">
                      Qty: {item.quantity} {displaySize ? `| Size: ${displaySize}` : ""}
                    </p>
                  </div>
                  <div className="text-sm font-inter text-brand-primary font-bold">
                    ₹{(parseFloat(item.priceAtTime) * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PROMO CODE SECTION */}
          <div className="border-t border-white/10 pt-4 mt-4 font-inter">
            {!appliedPromo ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoError(null);
                    }}
                    placeholder="ENTER PROMO CODE" 
                    className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-primary uppercase text-sm"
                  />
                  <button 
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoInput.trim()}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold tracking-widest transition-colors disabled:opacity-50"
                  >
                    {isApplyingPromo ? "..." : "APPLY"}
                  </button>
                </div>
                {promoError && <p className="text-red-400 text-xs">{promoError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-brand-primary/10 border border-brand-primary/20 p-3 rounded-lg">
                <div>
                  <p className="text-brand-primary text-sm font-bold uppercase tracking-widest">{appliedPromo.code} APPLIED</p>
                  <p className="text-white text-xs mt-0.5">
                    {appliedPromo.discountType === 'percentage' 
                      ? `${appliedPromo.discountValue}% OFF` 
                      : `₹${appliedPromo.discountValue} OFF`}
                  </p>
                </div>
                <button type="button" onClick={removePromo} className="text-text-secondary hover:text-white transition-colors text-xs underline">
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-4 mt-4 flex flex-col gap-3 font-inter">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Show Discount Row if active */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-brand-primary font-bold">
                <span>Discount ({appliedPromo.code})</span>
                <span>- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-text-secondary">
              <span>Shipping</span>
              {shipping === 0 ? (
                <span className="text-brand-primary uppercase text-xs font-bold tracking-widest">Free</span>
              ) : (
                <span>₹{shipping.toFixed(2)}</span>
              )}
            </div>
            <div className="flex justify-between text-lg text-white font-bold border-t border-white/10 pt-4 mt-2">
              <span>Total</span>
              <span className="text-brand-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={isProcessing}
            className="btn-primary w-full py-4 mt-8 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
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