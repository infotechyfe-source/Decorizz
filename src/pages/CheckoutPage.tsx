import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CreditCard, Smartphone, Wallet } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { optimizeImage } from '../utils/optimizeImage';
import { AuthContext } from '../context/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { RAZORPAY_CONFIG } from '../config/razorpay';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { coupon, discountAmount: passedDiscount } = location.state || {};

  const { user, accessToken } = useContext(AuthContext);

  const [cart, setCart] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'razorpay',
    couponCode: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const cartRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const cartData = await cartRes.json();

      // Filter out invalid items (no productId or quantity <= 0) to ensure clean checkout
      if (cartData.cart && cartData.cart.items) {
        cartData.cart.items = cartData.cart.items.filter((item: any) => item.productId && item.quantity > 0);
      }

      setCart(cartData.cart);

      const productsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const productsData = await productsRes.json();
      setProducts(productsData.products || []);
    } catch (error) {
      console.error('Fetch cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCartTotal = () => {
    if (!cart || !cart.items) return 0;

    return cart.items.reduce((total: number, item: any) => {
      const price = item.price ?? (products.find(p => p.id === item.productId)?.price || 0);
      return total + price * item.quantity;
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (orderData: any, totalAmount: number) => {
    const res = await loadRazorpayScript();

    if (!res) {
      toast.error('Razorpay SDK failed to load');
      return false;
    }

    const options = {
      key: RAZORPAY_CONFIG.KEY_ID,
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      name: RAZORPAY_CONFIG.COMPANY_NAME,
      description: 'Photo Frame Purchase',
      image: RAZORPAY_CONFIG.COMPANY_LOGO,
      handler: async function (response: any) {
        // Payment successful - Show loader
        setProcessing(true);
        toast.loading('Processing your order...');
        console.log('Payment successful:', response);

        try {
          // Create order with payment details
          const finalOrderData = {
            ...orderData,
            paymentStatus: 'completed',
            paymentId: response.razorpay_payment_id,
            paymentSignature: response.razorpay_signature,
          };

          const orderResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/orders`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(finalOrderData),
            }
          );

          if (orderResponse.ok) {
            const data = await orderResponse.json();

            // Create payment record
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/payments`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  orderId: data.order.id,
                  amount: totalAmount,
                  paymentMethod: 'razorpay',
                  paymentId: response.razorpay_payment_id,
                  paymentSignature: response.razorpay_signature,
                  status: 'completed',
                }),
              }
            );

            // Show success and navigate after delay
            toast.dismiss();
            toast.success('Payment successful! Redirecting...');

            setTimeout(() => {
              setProcessing(false);
              navigate(`/order-success/${data.order.id}`);
            }, 1500);
          } else {
            toast.dismiss();
            toast.error('Failed to create order');
            setProcessing(false);
          }
        } catch (error) {
          toast.dismiss();
          toast.error('Something went wrong');
          setProcessing(false);
        }
      },
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone,
      },
      theme: {
        // 🔹 match site teal theme
        color: RAZORPAY_CONFIG.THEME_COLOR,
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
          toast.error("Payment cancelled");
        },
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
    return true;
  };

  const handleCodAdvancePayment = async (orderData: any, totalAmount: number) => {
    const res = await loadRazorpayScript();

    if (!res) {
      toast.error('Razorpay SDK failed to load');
      return false;
    }

    const advanceAmount = Number((totalAmount * 0.10).toFixed(0));

    const options = {
      key: RAZORPAY_CONFIG.KEY_ID,
      amount: advanceAmount * 100,
      currency: 'INR',
      name: RAZORPAY_CONFIG.COMPANY_NAME,
      description: 'COD Advance (10%)',
      image: RAZORPAY_CONFIG.COMPANY_LOGO,
      handler: async function (response: any) {
        setProcessing(true);
        toast.loading('Recording advance payment...');

        try {
          const finalOrderData = {
            ...orderData,
            paymentStatus: 'partial',
            paymentMethod: 'cod',
            paymentId: response.razorpay_payment_id,
            paymentSignature: response.razorpay_signature,
          };

          const orderResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/orders`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(finalOrderData),
            }
          );

          if (orderResponse.ok) {
            const data = await orderResponse.json();

            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/payments`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  orderId: data.order.id,
                  amount: advanceAmount,
                  paymentMethod: 'razorpay_cod_advance',
                  paymentId: response.razorpay_payment_id,
                  paymentSignature: response.razorpay_signature,
                  status: 'completed',
                }),
              }
            );

            toast.dismiss();
            toast.success('Advance paid. Remaining payable at delivery.');

            setTimeout(() => {
              setProcessing(false);
              navigate(`/order-success/${data.order.id}`);
            }, 1500);
          } else {
            toast.dismiss();
            toast.error('Failed to create order');
            setProcessing(false);
          }
        } catch (error) {
          toast.dismiss();
          toast.error('Something went wrong');
          setProcessing(false);
        }
      },
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone,
      },
      theme: { color: RAZORPAY_CONFIG.THEME_COLOR },
      modal: {
        ondismiss: function () {
          setProcessing(false);
          toast.error("Payment cancelled");
        },
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.zipCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    setProcessing(true);

    try {
      const subtotal = getCartTotal();
      const shipping = subtotal > 1000 ? 0 : 49;
      const discount = passedDiscount || 0;
      const total = subtotal + shipping - discount;

      const orderData = {
        items: cart.items.map((item: any) => {
          const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            productName: item.name || product?.name,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            format: item.format,
            frameColor: item.frameColor,
            subsection: item.subsection,
            price: item.price ?? product?.price,
            // Include custom canvas data for vendor
            customImage: item.customImage || undefined,
            customInstructions: item.customInstructions || undefined,
            customArtStyle: item.customArtStyle || undefined,
          };
        }),
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        paymentMethod: formData.paymentMethod,

        subtotal,
        shipping,
        discount,
        couponCode: coupon?.coupon_code,
        total,
      };

      // Handle different payment methods
      if (formData.paymentMethod === 'razorpay') {
        await handleRazorpayPayment(orderData, total);
      } else if (formData.paymentMethod === 'cod') {
        await handleCodAdvancePayment(orderData, total);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order');
    } finally {
      if (formData.paymentMethod !== 'razorpay' && formData.paymentMethod !== 'cod') {
        setProcessing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen content-offset">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: '#14b8a6' }}
          ></div>
        </div>
        <Footer />
      </div>
    );
  }


  const subtotal = getCartTotal();
  const shippingCost = 49;
  const shipping = subtotal > 1000 ? 0 : shippingCost;
  const discount = passedDiscount || 0;
  const total = subtotal + shipping - discount;
  const productSavings = Math.round(subtotal * 0.15);
  const shippingSavings = subtotal > 1000 ? shippingCost : 0;
  const totalSavings = productSavings + shippingSavings + discount;

  return (
    <div className="min-h-screen content-offset">
      <Navbar />

      {/* Professional Processing Loader */}
      {processing && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[1000] flex items-center justify-center animate-fadeIn">
          <div className="relative">
            {/* Animated Background Circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-teal-500/30 rounded-full animate-ping"></div>
              <div className="absolute w-24 h-24 bg-teal-400/30 rounded-full animate-pulse"></div>
            </div>

            {/* Main Card */}
            <div className="relative bg-white rounded-3xl p-10 shadow-2xl text-center max-w-md mx-4 transform animate-slideUp">
              {/* Success Icon Animation */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent mb-3">
                Processing Payment
              </h3>
              <p className="text-gray-600 mb-6">
                Please wait while we confirm your order...
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-teal-300 rounded-full animate-progress"></div>
              </div>

              {/* Loading Dots */}
              <div className="flex justify-center gap-2 mt-6">
                <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative squares like HomePage */}
      <div className="flex justify-between max-w-7xl mx-auto px-4 pt-10">
        <div className="flex gap-2">
          <div
            className="w-10 h-10 rounded border-2"
            style={{ borderColor: '#e5e7eb' }}
          ></div>
          <div
            className="w-10 h-10 rounded border-2"
            style={{ borderColor: '#e5e7eb' }}
          ></div>
        </div>
        <div className="flex gap-2">
          <div
            className="w-10 h-10 rounded border-2"
            style={{ borderColor: '#e5e7eb' }}
          ></div>
          <div
            className="w-10 h-10 rounded border-2"
            style={{ borderColor: '#e5e7eb' }}
          ></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Heading with teal accent like HomePage */}
        <h1 className="section-title text-center mb-6 mt-6" style={{ color: '#1f2937' }}>
          Secure <span style={{ color: '#14b8a6' }}>Checkout</span>
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping & Payment Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <div
                className="rounded-xl p-6 shadow-md border soft-card"
                style={{ borderColor: '#e5e7eb' }}
              >
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#1f2937' }}>
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2" style={{ color: '#4b5563' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#1f2937' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: '#4b5563' }}>
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#1f2937' }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2" style={{ color: '#4b5563' }}>
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#1f2937' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: '#4b5563' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#1f2937' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: '#4b5563' }}>
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#1f2937' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: '#4b5563' }}>
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#1f2937' }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div
                className="rounded-xl p-6 shadow-md border soft-card"
                style={{ borderColor: '#e5e7eb' }}
              >
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#1f2937' }}>
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label
                    className="flex items-center p-4 border rounded-lg cursor-pointer transition"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={formData.paymentMethod === 'razorpay'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <CreditCard className="w-6 h-6 mr-3" color="#6b7280" />
                    <span style={{ color: '#1f2937' }}>
                      Razorpay (Card/UPI/Netbanking)
                    </span>
                  </label>



                  <label
                    className="flex items-center p-4 border rounded-lg cursor-pointer transition"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <Wallet className="w-6 h-6 mr-3" color="#6b7280" />
                    <span style={{ color: '#1f2937' }}>Cash on Delivery (10% advance)</span>
                  </label>
                  {formData.paymentMethod === 'cod' && (
                    <p className="text-sm pl-1" style={{ color: '#4b5563' }}>
                      Pay 10% online now, and the remaining on delivery.
                    </p>
                  )}
                </div>
              </div>

              {/* Coupon Code */}
              {/* <div
                className="rounded-xl p-6 shadow-md border soft-card"
                style={{ borderColor: '#e5e7eb' }}
              >
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#1f2937' }}>
                  Coupon Code
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleInputChange}
                    placeholder="Enter coupon code"
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#1f2937' }}
                  />
                  <button
                    type="button"
                    className="px-6 py-2 rounded-lg shadow-md transition"
                    style={{
                      backgroundColor: '#14b8a6',
                      color: 'white',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#14b8a6')}
                  >
                    Apply
                  </button>
                </div>
              </div> */}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div
                className="rounded-xl p-6 shadow-md border sticky top-24 soft-card"
                style={{ borderColor: '#e5e7eb' }}
              >
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#1f2937' }}>
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  {cart?.items?.map((item: any) => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product && !item.name) return null;
                    const itemPrice = item.price ?? product?.price ?? 0;
                    const displayImage = item.customImage || item.image || product?.image || '';
                    const displayName = item.name || product?.name || 'Product';
                    const isCustomCanvas = !!item.customImage || displayName.includes('Custom Print -');

                    return (
                      <div
                        key={`${item.productId}-${item.size}-${item.color}`}
                        className="flex items-start gap-3 pb-3 border-b last:border-b-0" style={{ borderColor: '#f3f4f6' }}
                      >
                        {/* Product Image - larger like cart page */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                          {displayImage ? (
                            <ImageWithFallback
                              src={displayImage.startsWith('data:') ? displayImage : optimizeImage(displayImage, 256)}
                              alt={displayName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                          )}
                          {/* Custom Canvas Badge */}
                          {isCustomCanvas && (
                            <div className="absolute top-1 left-1 bg-teal-500 text-white text-[8px] px-1 py-0.5 rounded font-semibold">
                              Custom
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold mb-1" style={{ color: '#1f2937' }}>{displayName}</h3>
                          <p className="text-xs mb-1" style={{ color: '#6b7280' }}>
                            {item.color ? `${item.color} • ` : ''}{item.size} • Qty: {item.quantity}
                          </p>
                          {/* Show custom instructions if available */}
                          {item.customInstructions && (
                            <p className="text-[10px] mb-1 italic" style={{ color: '#6b7280' }}>
                              "{item.customInstructions.length > 30 ? item.customInstructions.substring(0, 30) + '...' : item.customInstructions}"
                            </p>
                          )}
                          {item.customArtStyle && (
                            <p className="text-[10px] mb-1 font-medium" style={{ color: '#14b8a6' }}>
                              Style: {item.customArtStyle}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400" style={{ textDecoration: 'line-through' }}>
                              ₹{Math.round(itemPrice * 1.15 * item.quantity).toLocaleString('en-IN')}
                            </span>
                            <span className="text-sm font-semibold" style={{ color: '#14b8a6' }}>
                              ₹{(itemPrice * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="border-t pt-3" style={{ borderColor: '#e5e7eb' }}>
                    <div className="flex justify-between">
                      <span style={{ color: '#4b5563' }}>Subtotal</span>
                      <span style={{ color: '#4b5563' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#4b5563', marginBottom: '10px' }}>Shipping</span>
                      {subtotal > 1000 ? (
                        <span className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm" style={{ textDecoration: 'line-through' }}>₹{shippingCost}</span>
                          <span className="text-green-600 font-semibold">Free</span>
                        </span>
                      ) : (
                        <span style={{ color: '#4b5563' }}>₹{shippingCost}</span>
                      )}
                    </div>

                    {/* Applied Coupon Display */}
                    {coupon && discount > 0 && (
                      <div className="mt-3 p-3 rounded-lg border border-green-200 bg-green-50">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                              {coupon.coupon_code}
                            </span>
                            <span className="text-xs text-green-600">
                              {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% Off` : `₹${coupon.discount_value} Off`}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-green-600">
                            -₹{discount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: '#e5e7eb' }}>
                    {/* Detailed Savings Breakdown */}
                    <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#f0fdf4' }}>
                      <p className="text-xs font-medium mb-2" style={{ color: '#16a34a' }}>Savings Breakdown:</p>
                      <div className="space-y-1 text-xs" style={{ color: '#15803d' }}>
                        <div className="flex justify-between">
                          <span>Product Discount (15%)</span>
                          <span>₹{productSavings.toLocaleString('en-IN')}</span>
                        </div>
                        {shippingSavings > 0 && (
                          <div className="flex justify-between">
                            <span>Free Shipping</span>
                            <span>₹{shippingSavings.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {coupon && discount > 0 && (
                          <div className="flex justify-between">
                            <span>Coupon ({coupon.coupon_code})</span>
                            <span>₹{discount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between text-sm mb-2" style={{ color: '#16a34a' }}>
                      <span className="font-medium">Total Savings</span>
                      <span className="font-bold">₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xl font-semibold" style={{ color: '#1f2937' }}>
                      <span>Total</span>
                      <span style={{ color: '#14b8a6' }}>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    {formData.paymentMethod === 'cod' && (
                      <div className="flex justify-between text-sm mt-2">
                        <span style={{ color: '#4b5563' }}>Advance (10%) due now</span>
                        <span style={{ color: '#4b5563' }}>₹{Math.round(total * 0.10).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {formData.paymentMethod === 'cod' && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: '#4b5563' }}>Remaining on delivery</span>
                        <span style={{ color: '#4b5563' }}>₹{(total - Math.round(total * 0.10)).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-3 rounded-xl shadow-lg transition disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: processing ? '#9ca3af' : '#14b8a6',
                    color: 'white',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => {
                    if (!processing) e.currentTarget.style.backgroundColor = '#0d9488';
                  }}
                  onMouseLeave={(e) => {
                    if (!processing) e.currentTarget.style.backgroundColor = '#14b8a6';
                  }}
                >
                  {processing ? 'Processing...' : (formData.paymentMethod === 'cod' ? 'Pay 10% & Place COD Order' : 'Place Order')}
                </button
                >
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
