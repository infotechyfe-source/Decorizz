import React, { useState, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { wishlistEvents } from '../utils/wishlistEvents';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AuthContext } from '../context/AuthContext';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { optimizeImage } from "../utils/optimizeImage";
import { cartEvents } from '../utils/cartEvents';

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  colors?: string[];
  sizes?: string[];
  extraImages?: string[];
  layout?: string;
};

type ProductCardProps = {
  product: Product;
  overridePrice?: number;
  eyeNavigates?: boolean;
  hideCategory?: boolean;
  hideColors?: boolean;
  aspectRatio?: string;
  imageHeight?: number;
  variant?: 'default' | 'mobileFooter';
  categoryOverride?: string; // Override category in URL (e.g., "lighting" when on Lighting page)
};

function ProductCardComponent({
  product,
  overridePrice,
  eyeNavigates,
  hideCategory = false,
  hideColors = false,
  aspectRatio = "aspect-square",
  imageHeight,
  variant = 'default',
  categoryOverride,
}: ProductCardProps) {
  // Use categoryOverride if provided, otherwise fall back to product.category or 'all'
  const effectiveCategory = categoryOverride || product.category || 'all';
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, accessToken } = useContext(AuthContext);
  const truncatedName = (() => {
    const words = (product.name || '').trim().split(/\s+/);
    return words.length <= 3 ? product.name : words.slice(0, 3).join(' ') + '…';
  })();

  const hasExtraImage = product.extraImages && product.extraImages.length > 0;
  const secondaryImage = hasExtraImage ? product.extraImages![0] : null;

  const mainOptimized = useMemo(() => optimizeImage(product.image, 480), [product.image]);
  const mainSrcSet = useMemo(() => (
    `${optimizeImage(product.image, 320)} 320w, ${optimizeImage(product.image, 480)} 480w, ${optimizeImage(product.image, 800)} 800w, ${optimizeImage(product.image, 1200)} 1200w`
  ), [product.image]);
  const secondaryOptimized = useMemo(() => secondaryImage ? optimizeImage(secondaryImage, 480) : null, [secondaryImage]);
  const secondarySrcSet = useMemo(() => (
    secondaryImage ? `${optimizeImage(secondaryImage, 320)} 320w, ${optimizeImage(secondaryImage, 480)} 480w, ${optimizeImage(secondaryImage, 800)} 800w` : undefined
  ), [secondaryImage]);

  // Determine effective price (Landscape fallback: 1880)
  const isLandscape = product.layout?.toLowerCase() === 'landscape';
  const effectivePrice = overridePrice ?? (isLandscape ? 2699 : product.price);

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to add to wishlist");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/wishlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ productId: product.id }),
        }
      );

      if (response.ok) {
        setIsWishlisted(true);
        toast.success("Added to wishlist");
        wishlistEvents.emit();
      } else toast.error("Failed to add to wishlist");
    } catch {
      toast.error("Failed to add to wishlist");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to add to cart");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
            // Send default options if available, or empty strings if required by backend
            frameColor: "Black",
            size: "12x18",
            material: "Wooden",
            format: "Frame"
          }),
        }
      );

      if (response.ok) {
        toast.success("Added to cart");
        cartEvents.emit();
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div
      className="
    bg-white
    curved-lg
    shadow-premium
    overflow-hidden 
    w-full
    h-full
    block
    flex flex-col
    hover-lift
    hover-glow
    transition-all
    duration-500
    group
    relative
  "
    >

      {/* Image (custom aspect) */}
      <div className={`relative w-full overflow-hidden bg-gray-100 group ${imageHeight ? '' : aspectRatio}`} style={imageHeight ? { height: imageHeight } : undefined}>
        <Link
          to={`/product/${effectiveCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(product.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          className="block w-full h-full relative"
        >
          {/* Main Image - Always Visible (behind) */}
          <div className="w-full h-full">
            <ImageWithFallback
              src={mainOptimized}
              srcSet={mainSrcSet}
              alt={product.name}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="w-full h-full object-cover transition-transform duration-1000 ease-in-out group-hover:scale-110"
            />
          </div>

          {/* Secondary/Hover Image - Absolute Top & Fades In */}
          {secondaryImage && (
            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-50 transition-opacity duration-700 flex items-center justify-center">
              <ImageWithFallback
                src={secondaryOptimized || ''}
                srcSet={secondarySrcSet}
                alt={`${product.name} hover`}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="w-2/3 h-auto object-contain"
              />
            </div>
          )}
        </Link>

        {variant === 'mobileFooter' ? (
          <button onClick={handleAddToCart} className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-lime-400 text-teal-900 shadow-md flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </button>
        ) : (
          <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 z-20 pointer-events-none">
            <button
              onClick={handleAddToCart}
              className="w-full bg-white/90 backdrop-blur-sm text-gray-900 font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-teal-500 hover:text-white transition-colors flex items-center justify-center gap-2 pointer-events-auto"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {variant === 'mobileFooter' ? (
        <div className="bg-black text-white px-3 py-2">
          <Link
            to={`/product/${effectiveCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(product.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          >
            <h3 className="text-sm font-semibold mb-1">{product.name}</h3>
          </Link>
          <div className="text-xs flex items-center gap-2">
            <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>₹{Math.round(effectivePrice * 1.15).toLocaleString('en-IN')}</span>
            <span>₹{effectivePrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
      ) : (
        <div className={`${hideCategory ? 'p-3' : 'p-4'} flex flex-col justify-between`} style={{ minHeight: hideCategory ? 'auto' : '110px' }}>
          {!hideCategory && (
            <p className="text-sm text-gray-500 mb-1">{product.category}</p>
          )}

          <Link
            to={`/product/${effectiveCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(product.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          >
            <h3 className={`text-gray-900 mb-2 hover:text-teal-600 transition-colors ${hideCategory ? 'text-sm font-medium' : ''}`}>{truncatedName}</h3>

          </Link>


          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm" style={{ textDecoration: 'line-through' }}>
                ₹{Math.round(effectivePrice * 1.15).toLocaleString('en-IN')}
              </span>
              <span className="text-gray-900 font-semibold">
                ₹{effectivePrice.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-green-600 text-xs font-medium">
              Save ₹{Math.round(effectivePrice * 0.15).toLocaleString('en-IN')} (15% off)
            </span>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {variant !== 'mobileFooter' && !eyeNavigates && open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setOpen(false)}

        >
          <div
            className="bg-white rounded-xl shadow-xl w-[94vw] md:w-[720px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <ImageWithFallback
                  src={mainOptimized}
                  srcSet={mainSrcSet}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-500 mb-1">{product.category}</p>

                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>

                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-base" style={{ textDecoration: 'line-through' }}>
                      ₹{Math.round(effectivePrice * 1.15).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      ₹{effectivePrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">
                    Save ₹{Math.round(effectivePrice * 0.15).toLocaleString('en-IN')} (15% off)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/product/${effectiveCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(product.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="premium-btn-white"
                    onClick={() => setOpen(false)}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const ProductCard = React.memo(ProductCardComponent);