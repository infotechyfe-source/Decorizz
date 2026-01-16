import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Trash2, Minus, Plus, X } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { optimizeImage } from '../utils/optimizeImage';
import { AuthContext } from '../context/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { cartEvents } from '../utils/cartEvents';
import { supabase } from '../utils/supabase/client';

export default function CartPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);

  const [cart, setCart] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Unauthenticated: show empty cart UI, don't redirect
      setLoading(false);
      setCart({ items: [] });
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const cartRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const cartData = await cartRes.json();
      setCart(cartData.cart);

      const productsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );

      const productsData = await productsRes.json();
      let allProducts = productsData.products || [];

      // For cart items that don't have name/image and aren't in products list, fetch individually
      const cartItems = cartData.cart?.items || [];
      const missingProductIds = cartItems
        .filter((item: any) => !item.name && !allProducts.find((p: any) => p.id === item.productId))
        .map((item: any) => item.productId)
        .filter((id: string) => id); // Filter out undefined/null

      // Fetch missing products in parallel
      if (missingProductIds.length > 0) {
        const fetchPromises = [...new Set(missingProductIds)].map(async (id: string) => {
          try {
            const res = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${id}`,
              { headers: { Authorization: `Bearer ${publicAnonKey}` } }
            );
            const data = await res.json();
            return data.product;
          } catch {
            return null;
          }
        });
        const fetchedProducts = await Promise.all(fetchPromises);
        allProducts = [...allProducts, ...fetchedProducts.filter(Boolean)];
      }

      setProducts(allProducts);

      // Build suggestions based on cart categories
      const catSet = new Set<string>();
      (cartData.cart?.items || []).forEach((item: any) => {
        const prod = allProducts.find((p: any) => p.id === item.productId);
        if (prod?.category) catSet.add(String(prod.category));
      });
      const inCartIds = new Set((cartData.cart?.items || []).map((i: any) => i.productId));
      const byCategory = allProducts.filter((p: any) => catSet.has(String(p.category)) && !inCartIds.has(p.id));
      const popularFallback = allProducts
        .filter((p: any) => !inCartIds.has(p.id))
        .slice()
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      let base = byCategory.length ? byCategory : popularFallback;
      const seen = new Set<string>();
      let final: any[] = [];
      for (const p of base) {
        if (!seen.has(p.id)) { final.push(p); seen.add(p.id); }
      }
      for (const p of popularFallback) {
        if (final.length >= 4) break;
        if (!seen.has(p.id)) { final.push(p); seen.add(p.id); }
      }
      setSuggested(final.slice(0, 8));

    } catch (error) {
      console.error("Fetch cart error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const verifyCoupon = async (code: string, currentCart: any) => {
    if (!code) return;
    try {
      const subtotal = currentCart?.items?.reduce((acc: number, item: any) => {
        const product = products.find(p => p.id === item.productId);
        return acc + (Number(product?.price || 0) * item.quantity);
      }, 0) || 0;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/offers/verify-coupon`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, cartTotal: subtotal }),
        }
      );

      const data = await res.json();

      if (!res.ok || data.error) {
        if (couponCode) toast.error(data.error || 'Invalid or expired coupon code');
        sessionStorage.removeItem('applied_coupon');
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data.offer);
      sessionStorage.setItem('applied_coupon', code);
      if (couponCode) toast.success('Coupon applied successfully!');
    } catch (error) {
      console.error('Coupon error:', error);
      toast.error('Failed to verify coupon');
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    verifyCoupon(couponCode.toUpperCase(), cart);
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    sessionStorage.removeItem('applied_coupon');
    toast.info('Coupon removed');
  };



  const updateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) return;

    const currentItem = cart.items.find((i: any) => i.productId === productId);

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            productId,
            quantity: newQty - currentItem.quantity,
            size: currentItem.size,
            color: currentItem.color,
            format: currentItem.format,
            frameColor: currentItem.frameColor,
            price: currentItem.price,
            subsection: currentItem.subsection,
          })
        }
      );

      setCart({
        ...cart,
        items: cart.items.map((i: any) =>
          i.productId === productId ? { ...i, quantity: newQty } : i
        )
      });
      cartEvents.emit();

    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (productId: string) => {
    // Optimistic update - remove from UI immediately
    const previousCart = cart;
    const itemToRemove = cart.items.find((i: any) => i.productId === productId);

    setCart({
      ...cart,
      items: cart.items.filter((item: any) => item.productId !== productId)
    });
    cartEvents.emit();
    toast.success("Removed from cart");

    try {
      // Method 1: Try standard DELETE
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart/${productId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
        return;
      }

      // Method 2: Fallback to setting quantity to 0 (Soft Delete)
      if (itemToRemove) {
        console.log("DELETE failed, trying soft delete via quantity reduction...");
        const postRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
              productId,
              quantity: -itemToRemove.quantity,
              size: itemToRemove.size,
              color: itemToRemove.color,
              format: itemToRemove.format
            }),
          }
        );

        if (postRes.ok) {
          const data = await postRes.json();
          setCart(data.cart);
          return;
        }
      }

      // If both fail
      throw new Error("Both methods failed");

    } catch (err) {
      console.error("Remove item error:", err);
      // Don't revert optimistic UI for "Unknown Items" to keep them hidden on this session
      // But verify if it was a real product
      if (products.find(p => p.id === productId)) {
        setCart(previousCart);
        toast.error("Failed to remove item");
      }
    }
  };

  // Filter items for display
  // 1. Must have quantity > 0
  // 2. Must have a valid productId (hides corrupt "Unknown Product" items that can't be deleted)
  const displayItems = cart?.items?.filter((item: any) => item.quantity > 0 && item.productId) || [];
  const cartItems = displayItems; // Alias for existing code using cartItems

  // Calculate totals based on displayItems
  const subtotal = displayItems.reduce((sum: number, item: any) => {
    const product = products.find((p: any) => p.id === item.productId);
    const price = item.price ?? product?.price ?? 0;
    return sum + (price * item.quantity);
  }, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  }
  discountAmount = Math.min(discountAmount, subtotal);
  const total = subtotal - discountAmount;

  const isEmpty = displayItems.length === 0;

  // Loading is handled by RouteLoader - no need for individual page spinner

  return (
    <div className="min-h-screen content-offset premium-bg">
      <Navbar />

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        {/* Animated Shapes */}
        <div className="flex gap-2">
          <div className="w-10 h-10 border-2 curved-md animate-float" style={{ borderColor: 'rgba(20, 184, 166, 0.3)' }}></div>
          <div className="w-10 h-10 border-2 curved-md animate-float stagger-2" style={{ borderColor: 'rgba(20, 184, 166, 0.2)' }}></div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="premium-card-glow p-6 sm:p-10 mb-8 animate-fade-scale">
          <h1 className="text-center custom-heading">
            Your <span className="text-gradient-teal">Cart</span>
          </h1>
        </div>

        {isEmpty ? (
          <div className="text-center py-8 premium-card p-12 animate-fade-slide">
            <p className="text-xl mb-6" style={{ color: '#4b5563' }}>Your cart is empty</p>

            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-2 curved-xl text-white glow-btn transition"
              style={{ backgroundColor: "#14b8a6" }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ---------------- LEFT SIDE — CART ITEMS ---------------- */}
            <div className="lg:col-span-2 space-y-4">
              {(() => {
                const invalidItems = cartItems.filter((item: any) => {
                  const product = products.find((p: any) => p.id === item.productId);
                  return !item.productId || (!product && !item.name);
                });

                if (invalidItems.length > 0) {
                  return (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={async () => {
                          const toastId = toast.loading('Removing invalid items...');
                          for (const item of invalidItems) {
                            if (item.productId) {
                              await removeItem(item.productId);
                            }
                          }
                          toast.dismiss(toastId);
                          toast.success('Cart cleaned up');
                          window.location.reload(); // Force reload to ensure fresh state
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-2 px-3 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove {invalidItems.length} Unknown Item{invalidItems.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {cartItems.map((item: any, index: number) => {
                const product = products.find(p => p.id === item.productId);
                // Use product data if found, otherwise use stored cart item data
                const displayName = item.name || product?.name || (item.productId ? `Product ID: ${item.productId.slice(0, 8)}...` : 'Unknown Product');
                const displayImage = item.customImage || item.image || product?.image || '';
                const isBase64Image = displayImage.startsWith('data:');
                const isCustomCanvas = !!item.customImage || displayName.includes('Custom Print -');

                const isLandscape = product?.layout?.toLowerCase() === 'landscape';
                const fallbackPrice = isLandscape ? 1880 : (product?.price ?? 0);
                const displayPrice = item.price ?? fallbackPrice;

                const isInvalidItem = !item.productId || (!product && !item.name);

                return (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}-${index}`}
                    className={`premium-card-glow p-4 hover-lift animate-fade-slide stagger-${Math.min(index + 1, 6)} ${isInvalidItem ? 'border-2 border-red-200' : ''}`}
                    style={{ opacity: 0, animationFillMode: 'forwards' }}
                  >
                    <div className="flex gap-4">

                      {/* Image */}
                      <div className="w-24 h-24 curved-lg overflow-hidden flex-shrink-0 shadow-premium relative" style={{ backgroundColor: '#f9fafb' }}>
                        {displayImage ? (
                          <ImageWithFallback
                            src={isBase64Image ? displayImage : optimizeImage(displayImage, 256)}
                            srcSet={isBase64Image ? undefined : `${optimizeImage(displayImage, 160)} 160w, ${optimizeImage(displayImage, 256)} 256w, ${optimizeImage(displayImage, 400)} 400w`}
                            sizes="96px"
                            width={96}
                            height={96}
                            alt={displayName}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                        {/* Custom Canvas Badge */}
                        {isCustomCanvas && (
                          <div className="absolute top-1 left-1 bg-teal-500 text-white text-[8px] px-1 py-0.5 rounded font-semibold">
                            Custom
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1" style={{ color: '#1f2937' }}>{displayName}</h3>
                        <p className="mb-1" style={{ color: '#4b5563' }}>
                          {item.color ? `${item.color} • ` : ''}{item.size}
                        </p>
                        {/* Show custom instructions if available */}
                        {item.customInstructions && (
                          <p className="text-xs mb-1 italic" style={{ color: '#6b7280' }}>
                            "{item.customInstructions.length > 50 ? item.customInstructions.substring(0, 50) + '...' : item.customInstructions}"
                          </p>
                        )}
                        {item.customArtStyle && (
                          <p className="text-xs mb-1 font-medium" style={{ color: '#14b8a6' }}>
                            Style: {item.customArtStyle}
                          </p>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm" style={{ textDecoration: 'line-through' }}>
                              ₹{Math.round(displayPrice * 1.15).toLocaleString('en-IN')}
                            </span>
                            <span className="text-lg font-semibold text-gradient-teal">
                              ₹{displayPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <span className="text-green-600 text-xs font-medium">
                            Save ₹{Math.round(displayPrice * 0.15).toLocaleString('en-IN')} (15% off)
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col items-end justify-between">

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-red-500 hover:text-red-600 p-2 curved-md hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        <div
                          className="flex items-center gap-2 curved-lg glass"
                          style={{ padding: '4px' }}
                        >
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-2 curved-md hover:bg-gray-100 transition"
                          >
                            <Minus className="w-4 h-4" color="#6b7280" />
                          </button>

                          <span className="px-3 font-medium" style={{ color: '#1f2937' }}>{item.quantity}</span>

                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-2 curved-md hover:bg-gray-100 transition"
                          >
                            <Plus className="w-4 h-4" color="#6b7280" />
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---------------- RIGHT SIDE — ORDER SUMMARY ---------------- */}
            <div className="lg:col-span-1">
              <div
                className="premium-card-glow p-6 sticky top-24 animate-fade-slide-right"
                style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '0.2s' }}
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#1f2937' }}>Order Summary</h2>

                <div className="space-y-3 mb-6" style={{ color: '#4b5563' }}>
                  {/* Coupon Input */}
                  <div className="pb-4 border-b border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Have a coupon?</label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-bold text-green-700">{appliedCoupon.coupon_code}</p>
                          <p className="text-xs text-green-600">
                            {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% Off` : `₹${appliedCoupon.discount_value} Off`}
                          </p>
                        </div>
                        <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter Code"
                          className="flex-1 p-2 border rounded-lg text-sm bg-gray-50 focus:bg-white transition uppercase font-mono"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode}
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span style={{ color: '#1f2937' }}>₹{subtotal.toFixed(0)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-medium animate-in fade-in">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    {subtotal > 1000 ? (
                      <span className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm" style={{ textDecoration: 'line-through' }}>₹49</span>
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
                          Free
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: '#1f2937' }}>₹49</span>
                    )}
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                    {/* Detailed Savings Breakdown */}
                    <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#f0fdf4' }}>
                      <p className="text-xs font-medium mb-2" style={{ color: '#16a34a' }}>Savings Breakdown:</p>
                      <div className="space-y-1 text-xs" style={{ color: '#15803d' }}>
                        <div className="flex justify-between">
                          <span>Product Discount (15%)</span>
                          <span>₹{Math.round(subtotal * 0.15).toLocaleString('en-IN')}</span>
                        </div>
                        {subtotal > 1000 && (
                          <div className="flex justify-between">
                            <span>Free Shipping</span>
                            <span>₹49</span>
                          </div>
                        )}
                        {appliedCoupon && discountAmount > 0 && (
                          <div className="flex justify-between">
                            <span>Coupon ({appliedCoupon.coupon_code})</span>
                            <span>₹{discountAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between text-sm mb-2" style={{ color: '#16a34a' }}>
                      <span className="font-medium">Total Savings</span>
                      <span className="font-bold">
                        ₹{(Math.round(subtotal * 0.15) + (subtotal > 1000 ? 49 : 0) + discountAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xl font-semibold" style={{ color: '#1f2937' }}>
                      <span>Total</span>
                      <span className="text-gradient-teal">
                        ₹{(total + (subtotal > 1000 ? 0 : 49)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigate('/checkout', {
                      state: {
                        coupon: appliedCoupon,
                        discountAmount: discountAmount
                      }
                    });
                  }}
                  className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all hover:-translate-y-0.5"
                >
                  Proceed to Checkout
                </button>


                <button
                  onClick={() => navigate('/shop')}
                  className="w-full curved-xl px-6 py-3 transition glow-btn-white font-medium mt-4"
                  style={{ color: '#1f2937', border: '1px solid rgba(20, 184, 166, 0.2)' }}
                >
                  Continue Shopping
                </button>

              </div>
            </div>

          </div>
        )}

        {/* Suggestions */}
        {suggested.length > 0 && (
          <div className="mt-14">
            <h2 className="custom-heading text-center mb-8">
              You may also <span style={{ color: '#14b8a6' }}>like</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {suggested.map((product) => (
                <div key={product.id} className="premium-card-glow p-2 hover-lift">
                  <div className="aspect-square overflow-hidden curved-lg bg-gray-100">
                    <ImageWithFallback src={product.image} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>
                  <div className="pt-3">
                    <p className="text-sm" style={{ color: '#64748b' }}>{product.category || 'Frame'}</p>
                    <h3 className="text-base font-semibold" style={{ color: '#1f2937' }}>{product.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <Footer />
    </div >
  );
}
