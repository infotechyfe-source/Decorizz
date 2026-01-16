import React, { useContext, useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AuthContext } from '../context/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import SkeletonProductCard from '../components/SkeletonProductCard';
import { ProductCard } from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { optimizeImage } from '../utils/optimizeImage';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { wishlistEvents } from '../utils/wishlistEvents';

export default function WishlistPage() {
  const { user, accessToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);

  const fetchWishlist = async () => {
    try {
      if (!user) { setProducts([]); setLoading(false); return; }
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/wishlist`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      const ids: string[] = data.wishlist?.items || [];
      const details = await Promise.all(ids.map(async (id) => {
        const r = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${id}`, { headers: { Authorization: `Bearer ${publicAnonKey}` } });
        const d = await r.json();
        return d.product;
      }));
      setProducts(details.filter(Boolean));
      // Fetch full product list for suggestions
      const listRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`, { headers: { Authorization: `Bearer ${publicAnonKey}` } });
      const listData = await listRes.json();
      const all = listData.products || [];
      const wishIds = new Set(ids);
      const catSet = new Set<string>();
      details.filter(Boolean).forEach((p: any) => { if (p?.category) catSet.add(String(p.category)); });
      const byCategory = all.filter((p: any) => catSet.has(String(p.category)) && !wishIds.has(p.id));
      const popularFallback = all
        .filter((p: any) => !wishIds.has(p.id))
        .slice()
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      let base = byCategory.length ? byCategory : popularFallback;
      const seen = new Set<string>();
      let final: any[] = [];
      for (const p of base) { if (!seen.has(p.id)) { final.push(p); seen.add(p.id); } }
      for (const p of popularFallback) {
        if (final.length >= 4) break;
        if (!seen.has(p.id)) { final.push(p); seen.add(p.id); }
      }
      setSuggested(final.slice(0, 8));
    } finally { setLoading(false); }
  };

  const removeFromWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking delete
    e.stopPropagation();

    // Immediately remove from UI for instant feedback
    setProducts(products.filter(p => p.id !== productId));
    wishlistEvents.emit();
    toast.success('Removed from wishlist');

    try {
      // Try DELETE endpoint first (if deployed)
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/wishlist/${productId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // If DELETE fails, try toggling with POST (which may remove if item exists)
      if (!res.ok) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/wishlist`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ productId, remove: true })
          }
        );
      }
    } catch {
      // Even if API fails, we've already removed from UI
      console.log('Wishlist sync may be needed on next page load');
    }
  };

  useEffect(() => { fetchWishlist(); }, [user]);

  return (
    <div className="min-h-screen content-offset premium-bg">
      <Navbar />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="premium-card-glow p-8 mb-6 animate-fade-scale">
          <h1 className="text-center custom-heading">
            <span className="text-gray-900">Your</span> <span className="text-gradient-teal">Wishlist</span>
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (<SkeletonProductCard key={i} />))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, index) => (
              <div
                key={p.id}
                className={`group premium-card-glow curved-lg hover-lift overflow-hidden animate-fade-slide stagger-${Math.min(index + 1, 6)} relative`}
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => removeFromWishlist(p.id, e)}
                  className="absolute top-4 right-2 z-40 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <Link to={`/product/${p.id}`}>
                  <div className="aspect-square overflow-hidden curved-lg" style={{ backgroundColor: '#f3f4f6' }}>
                    <ImageWithFallback
                      src={optimizeImage(p.image, 480)}
                      srcSet={`${optimizeImage(p.image, 320)} 320w, ${optimizeImage(p.image, 480)} 480w, ${optimizeImage(p.image, 800)} 800w`}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm mb-1" style={{ color: '#64748b' }}>{p.category || 'Frame'}</p>
                    <h3 className="mb-1 font-medium" style={{ color: '#1f2937' }}>{p.name}</h3>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm" style={{ textDecoration: 'line-through' }}>
                          ₹{Math.round((p.layout?.toLowerCase() === 'landscape' ? 1880 : Number(p.price)) * 1.15).toLocaleString('en-IN')}
                        </span>
                        <span className="font-semibold text-gradient-teal">
                          ₹{(p.layout?.toLowerCase() === 'landscape' ? 1880 : Number(p.price)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-green-600 text-xs font-medium">
                        Save ₹{Math.round((p.layout?.toLowerCase() === 'landscape' ? 1880 : Number(p.price)) * 0.15).toLocaleString('en-IN')} (15% off)
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card p-12 text-center animate-fade-slide">
            <p className="text-gray-500 text-lg">Your wishlist is empty.</p>
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
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
