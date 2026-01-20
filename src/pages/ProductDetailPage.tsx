import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingCart, Truck, Package, Lock, CheckSquare, CircleHelp, RotateCcw, FileText, ChevronDown, CheckCircle, Star, Share2, Copy, Home, ChevronRight, ChevronLeft } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ProductReviews } from '../components/ProductReviews';
import { AuthContext } from '../context/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { cartEvents } from '../utils/cartEvents';
import { wishlistEvents } from '../utils/wishlistEvents';
import { optimizeImage } from "../utils/optimizeImage";
import LazyShow from "../components/LazyShow";
import CardBoard from "../assets/7th.jpeg";
import Frame from "../assets/8th.jpeg";
import Bubble from "../assets/9th.jpeg";
import LandscapeImg from "../assets/landscape.jpeg";
import SquareImg from "../assets/squre.jpeg";
import VerticalImg from "../assets/verticalsize.jpg";
import CircleImg from "../assets/circle.jpeg";
import BackImage from "../assets/back.jpg";
import { FloatingProductVideo } from '../components/FloatingProductVideo';
import logo from '../assets/logo-r.png';

export default function ProductDetailPage() {
  const { id, category: categoryParam, name: nameParam } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'Rolled' | 'Canvas' | 'Frame'>('Rolled');
  const [selectedFrameColor, setSelectedFrameColor] = useState<'White' | 'Black' | 'Brown'>('Black');
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState<string>('50% 50%');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [customFile, setCustomFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>('Fantasy Painting');

  const isNeon = (nameParam === 'custom-name-neon-signs-lights') || String(product?.layout || '').toLowerCase() === 'neon';

  const islighting = categoryParam === 'lighting' || (nameParam === 'custom-name-neon-signs-lights') || String(product?.layout || '').toLowerCase() === 'lighting';

  const [neonOn, setNeonOn] = useState(true);
  const [neonText, setNeonText] = useState('Text');
  const [neonSize, setNeonSize] = useState<'12' | '18' | '24' | '30' | '36' | '48'>('24');
  const [neonFont, setNeonFont] = useState('Signature');
  const [neonColor, setNeonColor] = useState('#ffffff');
  const [neonBackboard, setNeonBackboard] = useState('Rectangle');
  const [neonFontOpen, setNeonFontOpen] = useState(true);
  const [neonSizeOpen, setNeonSizeOpen] = useState(false);
  const [neonBackboardOpen, setNeonBackboardOpen] = useState(false);
  const NEON_PRICE: Record<'12' | '18' | '24' | '30' | '36' | '48', number> = { '12': 1999, '18': 2565, '24': 3499, '30': 4499, '36': 5599, '48': 7999 };
  const neonPrice = NEON_PRICE[neonSize];

  const FONTS_META: { label: string; family: string; uppercase?: boolean; letterSpacing?: string; outline?: boolean }[] = [
    { label: 'Signature', family: '"Great Vibes", cursive' },
    { label: 'Barcelona', family: '"Pacifico", cursive' },
    { label: 'Sorrento', family: '"Lobster", cursive' },
    { label: 'MONACO', family: '"Bebas Neue", sans-serif', uppercase: true },
    { label: 'Melbourne', family: '"Montserrat", sans-serif' },
    { label: 'NeoTokyo', family: '"Poppins", sans-serif' },
    { label: 'NEON', family: '"Bebas Neue", sans-serif', uppercase: true, letterSpacing: '0.12em' },
    { label: 'WAIKIKI', family: '"Montserrat", sans-serif', uppercase: true, letterSpacing: '0.08em' },
    { label: 'Typewriter', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
    { label: 'NEONTRACE', family: '"Bebas Neue", sans-serif', uppercase: true, outline: true },
    { label: 'NeonGlow', family: '"Montserrat", sans-serif' },
    { label: 'LOVENEON', family: '"Bebas Neue", sans-serif', uppercase: true, outline: true },
    { label: 'OUTLINE', family: '"Bebas Neue", sans-serif', uppercase: true, outline: true },
    { label: 'Beachfront', family: '"Sacramento", cursive' },
    { label: 'Vintage', family: '"Playfair Display", serif' },
    { label: 'Brighter', family: '"Dancing Script", cursive' },
    { label: 'Capetown', family: '"Kaushan Script", cursive' },
    { label: 'Demetors', family: '"Caveat", cursive' },
    { label: 'Paul Grotesk', family: '"Montserrat", sans-serif' },
    { label: 'Retroslogy', family: '"Lobster", cursive' },
  ];

  const generateNeonPreview = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 520;
    const ctx = canvas.getContext('2d')!;
    const bg = new Image();
    bg.src = BackImage as any;
    await new Promise<void>((resolve) => { bg.onload = () => resolve(); });
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rectW = Math.floor(canvas.width * 0.6);
    const rectH = 120;
    const rectX = Math.floor((canvas.width - rectW) / 2);
    const rectY = Math.floor((canvas.height - rectH) / 2);
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 3;
    ctx.setLineDash(neonBackboard === 'Cut to shape' ? [8, 6] : []);
    ctx.strokeRect(rectX, rectY, rectW, rectH);
    ctx.setLineDash([]);
    const meta = FONTS_META.find(m => m.label === neonFont);
    const fam = (meta?.family || 'cursive').replace(/"/g, '')
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `64px ${fam}`;
    if (meta?.outline) {
      ctx.strokeStyle = neonColor;
      ctx.lineWidth = 2;
      ctx.strokeText(neonText, canvas.width / 2, canvas.height / 2);
      if (neonOn) { ctx.shadowColor = neonColor; ctx.shadowBlur = 18; }
      ctx.fillStyle = neonOn ? 'transparent' : '#9ca3af';
      ctx.fillText(neonText, canvas.width / 2, canvas.height / 2);
    } else {
      if (neonOn) { ctx.shadowColor = neonColor; ctx.shadowBlur = 18; }
      ctx.fillStyle = neonOn ? neonColor : '#9ca3af';
      ctx.fillText(neonText, canvas.width / 2, canvas.height / 2);
    }
    return canvas.toDataURL('image/png');
  };

  const imageContainerRef = useRef(null);
  const thumbStripRef = useRef<HTMLDivElement | null>(null);
  const touchXRef = useRef<number | null>(null);
  const mainImageTouchRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Main image swipe handlers for mobile
  const handleMainImageTouchStart = (e: React.TouchEvent) => {
    mainImageTouchRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleMainImageTouchEnd = (e: React.TouchEvent) => {
    const startX = mainImageTouchRef.current;
    const endX = e.changedTouches[0]?.clientX ?? null;
    mainImageTouchRef.current = null;

    if (startX !== null && endX !== null) {
      const diff = startX - endX;
      // Swipe threshold of 50px
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swiped left -> next image
          handleArrow('right');
        } else {
          // Swiped right -> previous image
          handleArrow('left');
        }
      }
    }
  };
  const scrollThumbs = (dir: 'left' | 'right') => {
    const el = thumbStripRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement | null;
    const itemWidth = firstChild?.offsetWidth ?? 80;
    const gap = parseFloat(getComputedStyle(el).gap || '12') || 12;
    const step = itemWidth + gap;
    const perPage = Math.max(1, Math.floor(el.clientWidth / step));
    const pageAmount = perPage * step - gap;
    el.scrollBy({ left: dir === 'right' ? pageAmount : -pageAmount, behavior: 'smooth' });
  };
  // Thumb wheel scroll handled via native event listener (see useEffect below)
  const updateThumbScrollState = () => {
    const el = thumbStripRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    if (hasOverflow) {
      setCanScrollLeft(left > 2);
      setCanScrollRight(left < maxScroll - 2);
    } else {
      const idx = selectedIndex;
      setCanScrollLeft(idx > 0);
      setCanScrollRight(idx < Math.max(0, thumbItems.length - 1));
    }
  };
  const handleThumbTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchXRef.current = e.touches[0]?.clientX ?? null;
  };
  const handleThumbTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = thumbStripRef.current;
    if (!el) return;
    const prev = touchXRef.current;
    const cur = e.touches[0]?.clientX ?? null;
    if (prev != null && cur != null) {
      const dx = prev - cur;
      el.scrollBy({ left: dx, behavior: 'instant' as ScrollBehavior });
      touchXRef.current = cur;
    }
  };
  const handleThumbTouchEnd = () => {
    touchXRef.current = null;
  };
  const handleThumbClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = thumbStripRef.current;
    if (!el) return;
    const target = (e.target as HTMLElement).closest('.thumb-item') as HTMLElement | null;
    if (!target || !el.contains(target)) return;
    const idx = Array.prototype.indexOf.call(el.children, target);
    const child = el.children[idx] as HTMLElement | undefined;
    if (child) {
      const centerLeft = child.offsetLeft - el.clientWidth / 2 + child.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, centerLeft), behavior: 'smooth' });
    }
  };
  const handleThumbKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleArrow('right');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleArrow('left');
    }
  };

  useEffect(() => {
    const el = thumbStripRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'smooth' });
    updateThumbScrollState();
  }, [selectedFormat, selectedColor]);

  const thumbItems = useMemo(() => {
    const items: Array<{ src: string; alt: string; onClick: () => void; selected: boolean; label?: string }> = [];
    if (!product) return items;
    items.push({
      src: product.image,
      alt: product?.name || 'Product',
      onClick: () => setSelectedImage(product.image),
      selected: selectedImage === product.image,
    });
    if (product.imagesByColor) {
      const orderedColors = ['White', 'Black', 'Brown'];
      orderedColors.forEach((color) => {
        const url = product.imagesByColor[color];
        if (url) {
          items.push({
            src: url,
            alt: color,
            onClick: () => {
              setSelectedFormat('Frame');
              setSelectedImage(url);
              setSelectedColor(color.toLowerCase());
            },
            selected: selectedImage === url,
          });
        }
      });
    }
    if (product.extraImages?.length) {
      product.extraImages.forEach((img: string, index: number) => {
        items.push({
          src: img,
          alt: `Product image ${index + 1} `,
          onClick: () => setSelectedImage(img),
          selected: selectedImage === img,
        });
      });
    }


    let layoutImage = VerticalImg; // Default to vertical image
    if (product.layout) {
      const lower = product.layout.toLowerCase();
      if (lower === "landscape") layoutImage = LandscapeImg;
      else if (lower === "square") layoutImage = SquareImg;
      else if (lower === "circle") layoutImage = CircleImg;
      else if (lower === "portrait") layoutImage = VerticalImg;
    }

    // Skip layout image and material images for custom canvas products (they already use layout image as main)
    if (!product.isCustomCanvas) {
      items.push({
        src: layoutImage,
        alt: 'Frame Size Guide',
        onClick: () => setSelectedImage(layoutImage),
        selected: selectedImage === layoutImage,
      });
      const materialLabel =
        selectedFormat === 'Canvas'
          ? 'Canvas Material'
          : selectedFormat === 'Rolled'
            ? 'Rolled Material'
            : 'Frame Material';
      if (product.layout?.toLowerCase() !== 'circle') {
        [Frame, CardBoard, Bubble].forEach((src, i) => {
          items.push({
            src,
            alt: materialLabel,
            onClick: () => setSelectedImage(src),
            selected: selectedImage === src,
          });
        });
      }
    }

    else if (product.isCustomCanvas) {
      const materialLabel =
        selectedFormat === 'Canvas'
          ? 'Canvas Material'
          : selectedFormat === 'Rolled'
            ? 'Rolled Material'
            : 'Frame Material';
      if (product.layout?.toLowerCase() !== 'circle') {
        [Frame, CardBoard, Bubble].forEach((src, i) => {
          items.push({
            src,
            alt: materialLabel,
            onClick: () => setSelectedImage(src),
            selected: selectedImage === src,
          });
        });
      }
    }


    return items;
  }, [product, selectedImage, selectedFormat, selectedColor]);

  const optimizedThumbItems = useMemo(() => {
    return thumbItems.map((i) => ({ ...i, src: optimizeImage(i.src, 160) }));
  }, [thumbItems]);

  const selectedIndex = useMemo(() => {
    const idx = thumbItems.findIndex((i) => i.selected);
    return idx >= 0 ? idx : 0;
  }, [thumbItems]);

  const selectByIndex = (idx: number) => {
    if (!thumbItems.length) return;
    const safeIdx = ((idx % thumbItems.length) + thumbItems.length) % thumbItems.length;
    const item = thumbItems[safeIdx];
    if (item) {
      item.onClick();
    }
  };

  const handleArrow = (dir: 'left' | 'right') => {
    if (!thumbItems.length) return;
    let nextIdx = dir === 'left' ? selectedIndex - 1 : selectedIndex + 1;
    // Loop around
    if (nextIdx < 0) nextIdx = thumbItems.length - 1;
    if (nextIdx >= thumbItems.length) nextIdx = 0;
    selectByIndex(nextIdx);
  };

  useEffect(() => {
    updateThumbScrollState();
  }, [selectedIndex, thumbItems.length]);

  // Native wheel listener for thumbs (non-passive to allow preventDefault)
  useEffect(() => {
    const el = thumbStripRef.current;
    if (!el) return;
    const handleThumbWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: 'smooth' });
      }
    };
    el.addEventListener('wheel', handleThumbWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleThumbWheel);
  }, []);

  const toggleZoom = () => {
    setZoom((prev) => (prev > 1 ? 1 : 2.5));
  };

  const updateOriginFromPoint = (clientX: number, clientY: number) => {
    const el = imageContainerRef.current as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setOrigin(`${xPct}% ${yPct}% `);
  };

  useEffect(() => {
    fetchProduct();
  }, [id, categoryParam, nameParam]);

  useEffect(() => {
    const handler = () => {
      document.querySelectorAll(".protect-image").forEach(el => {
        el.classList.add("screenshot");
        setTimeout(() => el.classList.remove("screenshot"), 1500);
      });
    };

    window.addEventListener("keyup", (e) => {
      if (e.key === "PrintScreen") handler();
    });

    return () => window.removeEventListener("keyup", () => { });
  }, []);

  useEffect(() => {
    if (!product) return;

    // For custom canvas products, don't change image on frame selection - just store the color for vendor
    if (product.isCustomCanvas) return;

    if (selectedFormat === 'Frame') {
      // Only use imagesByColor if available from backend
      const srcByColor = product.imagesByColor?.[selectedColor];
      if (srcByColor && selectedImage !== srcByColor) {
        setSelectedImage(srcByColor);
      }
    } else {
      if (product.image && selectedImage !== product.image) {
        setSelectedImage(product.image);
      }
    }
  }, [selectedFormat, selectedColor, product]);

  const fetchRelatedProducts = async (category: string, currentId?: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      const related = data.products
        .filter((p: any) => p.category === category && p.id !== (currentId || id))
        .slice(0, 4);
      setRelatedProducts(related);
    } catch (error) {
      console.error('Fetch related products error:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      let p;

      if (id) {
        // Fetch by ID
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${id}`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        p = data.product;
      } else if (nameParam) {
        // Fetch list and find by slug
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        const all = data.products || [];

        p = all.find((item: any) => {
          const itemSlug = (item.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return itemSlug === nameParam;
        });
      }

      if (!p && nameParam === 'custom-print-round-canvas-wall-art') {
        p = {
          id: 'custom-round-canvas',
          name: 'Custom Print - Round Canvas',
          category: 'Custom Designs',
          layout: 'Circle',
          material: '380 GSM Canvas',
          price: 1250,
          sizes: ['12 inches', '18 inches', '24 inches', '30 inches', '36 inches'],
          colors: [],
          format: 'Canvas',
          image: CircleImg,
          description: 'Upload your file, add instructions, we share a mockup, then print once approved. Extra detailed work may add cost. Free delivery in 7-10 days.',
          reviewsCount: 2,
          rating: 4.8,
          isCustomCanvas: true,
        };
      }

      // Custom Square Canvas
      if (!p && nameParam === 'custom-print-square-canvas-wall-art') {
        p = {
          id: 'custom-square-canvas',
          name: 'Custom Print - Square Canvas',
          category: 'Custom Designs',
          layout: 'Square',
          material: '380 GSM Canvas',
          price: 1250,
          sizes: ['12 inches', '18 inches', '24 inches', '30 inches', '36 inches'],
          colors: [],
          format: 'Canvas',
          image: SquareImg,
          description: 'Upload your file, add instructions, we share a mockup, then print once approved. Extra detailed work may add cost. Free delivery in 7-10 days.',
          reviewsCount: 2,
          rating: 4.8,
          isCustomCanvas: true,
        };
      }

      // Custom Portrait Canvas
      if (!p && nameParam === 'custom-print-portrait-canvas-wall-art') {
        p = {
          id: 'custom-portrait-canvas',
          name: 'Custom Print - Portrait Canvas',
          category: 'Custom Designs',
          layout: 'Portrait',
          material: '380 GSM Canvas',
          price: 1250,
          sizes: ['8X12', '12X18', '18X24', '20X30', '24X36'],
          colors: [],
          format: 'Canvas',
          image: VerticalImg,
          description: 'Upload your file, add instructions, we share a mockup, then print once approved. Extra detailed work may add cost. Free delivery in 7-10 days.',
          reviewsCount: 2,
          rating: 4.8,
          isCustomCanvas: true,
        };
      }

      // Custom Landscape Canvas
      if (!p && nameParam === 'custom-print-landscape-canvas-wall-art') {
        p = {
          id: 'custom-landscape-canvas',
          name: 'Custom Print - Landscape Canvas',
          category: 'Custom Designs',
          layout: 'Landscape',
          material: '380 GSM Canvas',
          price: 1250,
          sizes: ['36X18', '48X24', '20X30', '30X40'],
          colors: [],
          format: 'Canvas',
          image: LandscapeImg,
          description: 'Upload your file, add instructions, we share a mockup, then print once approved. Extra detailed work may add cost. Free delivery in 7-10 days.',
          reviewsCount: 2,
          rating: 4.8,
          isCustomCanvas: true,
        };
      }

      if (!p && nameParam === 'custom-name-neon-signs-lights') {
        p = {
          id: 'custom-neon-sign',
          name: 'Custom Name Neon Sign',
          category: 'Custom Neon Sign',
          layout: 'Neon',
          material: 'LED Neon Flex Strip + 6mm A‑Cast Acrylic',
          price: 4999,
          sizes: ['24in', '30in', '36in'],
          colors: ['Warm White', 'Cool White', 'Teal', 'Pink', 'Yellow'],
          format: 'Canvas',
          image: LandscapeImg,
          description: 'Design your personalized neon sign: write your text, pick font, size and colors. Safe LED, eco‑friendly, free delivery 7‑10 days, secure packaging.',
          reviewsCount: 0,
          rating: 4.9,
        } as any;
      }

      if (p) {
        const data = { product: p }; // Mimic old structure for consistency if needed, or just use p

        if (data.product) {
          const p = data.product;

          const effectiveSizes = p.layout?.toLowerCase() === 'landscape' ? ['36X18', '48X24', '20X30', '30X40'] : p.sizes || [];
          const autoSize = effectiveSizes.length > 0 ? effectiveSizes[0] : "";
          const autoColor = p.colors?.[0] || "";
          const autoFormat = p.format || "Rolled";

          setProduct({
            ...p,
            selectedColor: autoColor,
            selectedSize: autoSize,
            selectedFormat: autoFormat,
            selectedFrameColor: p.frameColor || "Black",
          });

          // Update states too
          setSelectedSize(autoSize);
          setSelectedColor(autoColor);
          setSelectedFormat(autoFormat);



          fetchRelatedProducts(p.category, p.id);
        }
      }
    } catch (error) {
      console.error('Fetch product error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if product is in wishlist
  const fetchWishlistStatus = async () => {
    if (!user || !product?.id) return;
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/wishlist`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      const ids: string[] = data.wishlist?.items || [];
      setIsInWishlist(ids.includes(product.id));
    } catch {
      // Ignore errors
    }
  };

  useEffect(() => {
    if (product?.id && user) {
      fetchWishlistStatus();
    }
  }, [product?.id, user]);

  const normalizeSize = (s?: string) => {
    if (!s) return '';
    const cleaned = s.replace(/\s+/g, '').toUpperCase().replace('×', 'X');
    const parts = cleaned.split('X');
    if (parts.length !== 2) return cleaned;
    return `${parts[0]}X${parts[1]}`;
  };

  const BASIC_PRICE: Record<string, { Rolled: number | null; Canvas: number | null; Frame: number | null }> = {
    '8X12': { Rolled: 679, Canvas: 800, Frame: 999 },
    '12X18': { Rolled: 879, Canvas: 1100, Frame: 1299 },
    '18X24': { Rolled: 1280, Canvas: 1699, Frame: 1799 },
    '20X30': { Rolled: 1780, Canvas: 2599, Frame: 2799 },
    '24X36': { Rolled: 1999, Canvas: 2999, Frame: 3299 },
    '30X40': { Rolled: 2899, Canvas: 4699, Frame: 5199 },
    '36X48': { Rolled: 3500, Canvas: 5799, Frame: 6499 },
    '48X66': { Rolled: 5879, Canvas: 9430, Frame: null },
    '18X18': { Rolled: 1999, Canvas: 1999, Frame: 1999 },
    '24X24': { Rolled: 2499, Canvas: 2499, Frame: 2499 },
    '36X36': { Rolled: 4999, Canvas: 4999, Frame: 4999 },
    '20X20': { Rolled: 2199, Canvas: 2199, Frame: 2199 },
    '30X30': { Rolled: 3599, Canvas: 3599, Frame: 3599 },
    '36X18': { Rolled: 1880, Canvas: 2699, Frame: 2899 },
    '48X24': { Rolled: 2799, Canvas: 3299, Frame: 3599 },
  };

  const TWOSET_PRICE: Record<string, { Rolled: number | null; Canvas: number | null; Frame: number | null }> = {
    '8X12': { Rolled: 1299, Canvas: 1599, Frame: 1999 },
    '12X18': { Rolled: 1699, Canvas: 2199, Frame: 2499 },
    '18X24': { Rolled: 2499, Canvas: 3399, Frame: 3599 },
    '20X30': { Rolled: 3499, Canvas: 5199, Frame: 5599 },
    '24X36': { Rolled: 3899, Canvas: 5999, Frame: 6599 },
    '30X40': { Rolled: 5799, Canvas: 9399, Frame: 10399 },
    '36X48': { Rolled: 6999, Canvas: 11599, Frame: 12999 },
    '48X66': { Rolled: 11799, Canvas: 18899, Frame: null },
  };

  const THREESET_PRICE: Record<string, { Rolled: number | null; Canvas: number | null; Frame: number | null }> = {
    '8X12': { Rolled: 2099, Canvas: 2499, Frame: 2999 },
    '12X18': { Rolled: 2699, Canvas: 3399, Frame: 3899 },
    '18X24': { Rolled: 3899, Canvas: 5099, Frame: 5399 },
    '20X30': { Rolled: 5399, Canvas: 7799, Frame: 8399 },
    '24X36': { Rolled: 6999, Canvas: 8899, Frame: 9599 },
    '30X40': { Rolled: 8699, Canvas: 14099, Frame: 15559 },
    '36X48': { Rolled: 10599, Canvas: 17399, Frame: 19499 },
    '48X66': { Rolled: 17699, Canvas: 28299, Frame: null },
  };

  const computePriceFor = (
    size: string,
    format: 'Rolled' | 'Canvas' | 'Frame',
    subsection?: 'Basic' | '2-Set' | '3-Set' | 'Square'
  ) => {
    const key = normalizeSize(size);
    const table = subsection === '2-Set' ? TWOSET_PRICE : subsection === '3-Set' ? THREESET_PRICE : BASIC_PRICE;
    const row = table[key];
    if (!row) return undefined;
    const value = row[format];
    return value === null ? undefined : value ?? undefined;
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add to cart');
      return;
    }

    if (!isNeon && !selectedSize) {
      toast.error('Please select size');
      return;
    }
    if (!isNeon && selectedFormat === 'Frame' && !selectedColor) {
      toast.error('Please select color');
      return;
    }
    // Require image upload for custom canvas products
    if (product.isCustomCanvas && !customFile?.dataUrl) {
      toast.error('Please upload an image for your custom canvas');
      return;
    }

    setIsAddingToCart(true);
    try {
      const overridePrice = isNeon ? NEON_PRICE[neonSize] : (computePriceFor(selectedSize, selectedFormat, product.subsection) ?? product.price);
      const previewURL = isNeon ? await generateNeonPreview() : (product?.image || '');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: product?.id || id,
            quantity,
            size: isNeon ? `${neonSize}in` : selectedSize,
            color: selectedFormat === 'Frame' ? selectedColor : undefined,
            format: selectedFormat,
            frameColor: selectedFormat === 'Frame' ? selectedColor : undefined,
            price: overridePrice,
            subsection: product.subsection,
            name: isNeon ? `Custom Neon - ${neonText}` : product?.name,
            image: product.isCustomCanvas && customFile?.dataUrl ? customFile.dataUrl : previewURL,
            customInstructions: customInstructions || undefined,
            customImage: product.isCustomCanvas ? customFile?.dataUrl : undefined,
            customArtStyle: product.isCustomCanvas ? selectedArtStyle : undefined,
            customNeon: isNeon ? { text: neonText, size: neonSize, color: neonColor, font: neonFont, backboard: neonBackboard, on: neonOn, previewURL } : undefined,
          }),
        }
      );

      if (response.ok) {
        cartEvents.emit();
        toast.success('Added to cart');
      } else {
        toast.error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to buy');
      return;
    }

    if (!isNeon && !selectedSize) {
      toast.error('Please select size');
      return;
    }
    if (!isNeon && selectedFormat === 'Frame' && !selectedColor) {
      toast.error('Please select color');
      return;
    }
    // Require image upload for custom canvas products
    if (product.isCustomCanvas && !customFile?.dataUrl) {
      toast.error('Please upload an image for your custom canvas');
      return;
    }

    try {
      const overridePrice = isNeon ? NEON_PRICE[neonSize] : (computePriceFor(selectedSize, selectedFormat, product.subsection) ?? product.price);
      const previewURL = isNeon ? await generateNeonPreview() : (product?.image || '');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: product?.id || id,
            quantity,
            size: isNeon ? `${neonSize}in` : selectedSize,
            color: selectedFormat === 'Frame' ? selectedColor : undefined,
            format: selectedFormat,
            frameColor: selectedFormat === 'Frame' ? selectedColor : undefined,
            price: overridePrice,
            subsection: product.subsection,
            name: isNeon ? `Custom Neon - ${neonText}` : product?.name,
            image: product.isCustomCanvas && customFile?.dataUrl ? customFile.dataUrl : previewURL,
            customInstructions: customInstructions || undefined,
            customImage: product.isCustomCanvas ? customFile?.dataUrl : undefined,
            customArtStyle: product.isCustomCanvas ? selectedArtStyle : undefined,
            customNeon: isNeon ? { text: neonText, size: neonSize, color: neonColor, font: neonFont, backboard: neonBackboard, on: neonOn, previewURL } : undefined,
          }),
        }
      );

      if (response.ok) {
        cartEvents.emit();
        navigate('/checkout');
      } else {
        toast.error('Failed to proceed to checkout');
      }
    } catch (error) {
      console.error('Buy now error:', error);
      toast.error('Failed to proceed to checkout');
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    const productId = product?.id || id;
    const wasInWishlist = isInWishlist;

    // Optimistic UI update
    setIsInWishlist(!wasInWishlist);
    wishlistEvents.emit();
    toast.success(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/wishlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ productId }),
        }
      );

      if (!response.ok) {
        // Revert on failure
        setIsInWishlist(wasInWishlist);
        toast.error('Failed to update wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      // Revert on error
      setIsInWishlist(wasInWishlist);
      toast.error('Failed to update wishlist');
    }
  };

  const mainImage = useMemo(() => {
    if (!product) return "";

    // If user clicked a thumbnail → always priority
    if (selectedImage) {
      return optimizeImage(selectedImage, 800);
    }

    // If Frame selected → use frame color images (only if available)
    if (selectedFormat === "Frame" && product.imagesByColor?.[selectedColor]) {
      return optimizeImage(product.imagesByColor[selectedColor], 800);
    }

    // Default → main product image
    return optimizeImage(product.image, 800);
  }, [product, selectedImage, selectedColor, selectedFormat]);

  const mainSrcSet = useMemo(() => {
    // For Frame format, only use imagesByColor if it exists
    const frameColorImg = selectedFormat === 'Frame' ? product?.imagesByColor?.[selectedColor] : null;
    const base = selectedImage || frameColorImg || product?.image;
    if (!base) return undefined;
    return `${optimizeImage(base, 400)} 400w, ${optimizeImage(base, 800)} 800w, ${optimizeImage(base, 1200)} 1200w`;
  }, [product, selectedImage, selectedColor, selectedFormat]);

  const price = useMemo(() => {
    if (!product) return 0;
    return computePriceFor(selectedSize, selectedFormat, product.subsection) ?? product.price;
  }, [selectedSize, selectedFormat, product]);

  const neonImageMap = useMemo(() => {
    const map: Record<string, string> = {};

    if (!product || !product.neon_images_by_color) return map;

    Object.entries(product.neon_images_by_color).forEach(([hex, url]) => {
      map[hex.toLowerCase().trim()] = url as string;
    });

    return map;
  }, [product]);


  const activeImage =
    islighting &&
      selectedColor &&
      neonImageMap[selectedColor?.toLowerCase()]
      ? neonImageMap[selectedColor.toLowerCase()]
      : product?.image || "";


  // Loading is handled by RouteLoader - no need for individual page spinner

  if (!product && !isNeon) {
    return (
      <div className="min-h-screen content-offset">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold mb-4" style={{ color: '#1f2937' }}>Product Not Found</h1>
          <button
            onClick={() => navigate('/shop')}
            className="px-6 py-2 rounded-md text-white"
            style={{ backgroundColor: '#14b8a6' }}
          >
            Back to Shop
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isNeon) {
    const fontMap: Record<string, string> = {
      Signature: 'cursive',
      Script: 'cursive',
      Sans: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans',
      Monospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      'Great Vibes': '"Great Vibes", cursive',
      Pacifico: '"Pacifico", cursive',
      Lobster: '"Lobster", cursive',
      Caveat: '"Caveat", cursive',
      'Bebas Neue': '"Bebas Neue", sans-serif',
      Montserrat: '"Montserrat", sans-serif',
      Poppins: '"Poppins", sans-serif',
      'Playfair Display': '"Playfair Display", serif',
      'Dancing Script': '"Dancing Script", cursive',
      Satisfy: '"Satisfy", cursive',
      'Kaushan Script': '"Kaushan Script", cursive',
      Sacramento: '"Sacramento", cursive',
    };
    const swatches = ['#ffffff', '#FF2ec4', '#39ff14', '#00e5ff', '#1e4bff', '#fff700', '#ff9f00', '#ff1a1a', '#9v5cff', '#b3f5ff'];
    const fontsMeta = [
      { label: 'Signature', family: '"Great Vibes", cursive' },
      { label: 'Barcelona', family: '"Pacifico", cursive' },
      { label: 'Sorrento', family: '"Lobster", cursive' },
      { label: 'MONACO', family: '"Bebas Neue", sans-serif', uppercase: true },
      { label: 'Melbourne', family: '"Montserrat", sans-serif' },
      { label: 'NeoTokyo', family: '"Poppins", sans-serif' },
      { label: 'NEON', family: '"Bebas Neue", sans-serif', uppercase: true, letterSpacing: '0.12em' },
      { label: 'WAIKIKI', family: '"Montserrat", sans-serif', uppercase: true, letterSpacing: '0.08em' },
      { label: 'Typewriter', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
      { label: 'NEONTRACE', family: '"Bebas Neue", sans-serif', uppercase: true, outline: true },
      { label: 'NeonGlow', family: '"Montserrat", sans-serif' },
      { label: 'LOVENEON', family: '"Bebas Neue", sans-serif', uppercase: true, outline: true },
      { label: 'OUTLINE', family: '"Bebas Neue", sans-serif', uppercase: true, outline: true },
      { label: 'Beachfront', family: '"Sacramento", cursive' },
      { label: 'Vintage', family: '"Playfair Display", serif' },
      { label: 'Brighter', family: '"Dancing Script", cursive' },
      { label: 'Capetown', family: '"Kaushan Script", cursive' },
      { label: 'Demetors', family: '"Caveat", cursive' },
      { label: 'Paul Grotesk', family: '"Montserrat", sans-serif' },
      { label: 'Retroslogy', family: '"Lobster", cursive' },
    ] as const;
    const original = Math.round(neonPrice * 1.05);
    const widthInches = parseInt(neonSize, 10);
    const heightInches = Math.max(6, Math.round(widthInches * 0.3));
    const widthCm = Math.round(widthInches * 2.54);
    const heightCm = Math.round(heightInches * 2.54);
    const backboardStyle = (() => {
      const base = { border: `2px solid ${neonOn ? neonColor : '#9ca3af'}`, boxShadow: neonOn ? `0 0 12px ${neonColor}66` : 'none', background: 'rgba(0,0,0,0.25)' } as React.CSSProperties;
      switch (neonBackboard) {
        case 'Rectangle':
          return { ...base, borderRadius: 8 };
        case 'Rounded Rectangle':
          return { ...base, borderRadius: 16 };
        case 'Pill shape':
          return { ...base, borderRadius: 9999 };
        case 'Circle':
          return { ...base, borderRadius: '50%', padding: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
        case 'Ornate':
          return { ...base, borderRadius: 12, borderStyle: 'double', borderWidth: 4, borderColor: neonOn ? neonColor : '#9ca3af' };
        case 'Cut to shape':
        default:
          return { ...base, borderStyle: 'dashed', borderRadius: 6 };
      }
    })();

    return (
      <div className="min-h-screen content-offset" style={{ background: 'linear-gradient(135deg, #f0fdf9 0%, #fdf9efff 100%)' }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="relative rounded-xl overflow-hidden" style={{ background: `url(${BackImage}) center/cover`, minHeight: 620 }}>
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 0 }} />
            <div className="absolute top-4 left-4 flex items-center gap-2" style={{ zIndex: 10 }}>
              <button onClick={() => setNeonOn(true)} className={`px-3 py-1 rounded text-white ${neonOn ? 'bg-green-500' : 'bg-gray-700'}`}>On</button>
              <button onClick={() => setNeonOn(false)} className={`px-3 py-1 rounded text-white ${!neonOn ? 'bg-red-500' : 'bg-gray-700'}`}>Off</button>
            </div>
            <div className="absolute top-4 right-4 text-right" style={{ zIndex: 10 }}>
              <div className="flex items-center justify-end gap-2">
                <span className="text-red-500 text-lg" style={{ textDecoration: 'line-through' }}>Rs. {original.toLocaleString('en-IN')}.00</span>
                <span className="text-white text-lg">Rs.</span>
              </div>
              <div className="text-white text-3xl font-bold">{neonPrice.toLocaleString('en-IN')}.00</div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
              <div>
                <div style={{ position: 'relative', display: 'inline-block', padding: '12px 24px', ...backboardStyle }}>
                  {neonOn && (
                    <div style={{ position: 'absolute', inset: -16, borderRadius: 16, background: neonColor, filter: 'blur(24px)', opacity: 0.25, pointerEvents: 'none' }}></div>
                  )}
                  {(() => {
                    const meta = fontsMeta.find(m => m.label === neonFont);
                    const fam = meta?.family || 'cursive';
                    const outline = !!meta?.outline;
                    const style: React.CSSProperties = neonOn ? {
                      fontFamily: fam,
                      fontSize: '64px',
                      color: outline ? 'transparent' : neonColor,
                      textShadow: `0 0 6px ${neonColor}, 0 0 14px ${neonColor}, 0 0 28px ${neonColor}`,
                      WebkitTextStroke: outline ? `2px ${neonColor}` : undefined,
                      textTransform: meta?.uppercase ? 'uppercase' : 'none',
                      letterSpacing: meta?.letterSpacing || 'normal',
                      transition: 'color 200ms ease, text-shadow 200ms ease, -webkit-text-stroke 200ms ease',
                    } : {
                      fontFamily: fam,
                      fontSize: '64px',
                      color: '#ffffff',
                      textShadow: 'none',
                      WebkitTextStroke: undefined,
                      textTransform: meta?.uppercase ? 'uppercase' : 'none',
                      letterSpacing: meta?.letterSpacing || 'normal',
                      transition: 'color 200ms ease, text-shadow 200ms ease, -webkit-text-stroke 200ms ease',
                    };
                    return (
                      <div style={style}>{neonText}</div>
                    );
                  })()}
                  {/* Vertical measurement anchored to frame */}
                  <div style={{ position: 'absolute', left: -40, top: 8, color: '#ffffff', textAlign: 'left' }}>
                    <div style={{ position: 'relative', height: 140 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderLeft: '2px solid #ffffff' }}></div>
                      <div style={{ position: 'absolute', left: -6, top: 0, width: 12, borderTop: '2px solid #ffffff' }}></div>
                      <div style={{ position: 'absolute', left: -6, bottom: 0, width: 12, borderBottom: '2px solid #ffffff' }}></div>


                    </div>
                    <div className="text-xs" style={{ position: 'absolute', left: -40, top: 50, bottom: 0 }}>{heightCm}cm</div>
                    <div className="text-xs" style={{ position: 'absolute', left: -35, top: 70, bottom: 0 }}>{heightInches}in</div>

                  </div>

                  {/* Horizontal measurement under frame */}
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: -50, color: '#ffffff' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ borderTop: '2px solid #ffffff' }}></div>
                      <div style={{ position: 'absolute', left: 0, top: -6, height: 12, borderLeft: '2px solid #ffffff' }}></div>
                      <div style={{ position: 'absolute', right: 0, top: -6, height: 12, borderRight: '2px solid #ffffff' }}></div>
                    </div>
                    <div className="text-center text-xs" style={{ marginTop: 6 }}>{widthCm}cm / {widthInches}in</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="soft-card rounded-2xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1f2937' }}>Create your Neon Sign</h2>
              <a href="#" className="section-cta-text uppercase text-xs">WANT TO GET A CUSTOM LOGO/DESIGN? CLICK HERE.</a>
              <div className="mt-6 space-y-6">
                <div>
                  <div className="mb-2" style={{ color: '#374151' }}>Write your Text:</div>
                  <input value={neonText} onChange={(e) => setNeonText(e.target.value.slice(0, 12))} className="w-full rounded-lg border-2 px-3 py-2" style={{ borderColor: '#14b8a6', backgroundColor: '#ffffff', color: '#1f2937' }} />
                </div>
                <div>
                  <div className="mb-2" style={{ color: '#374151' }}>Choose Your Size:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ backgroundColor: '#ffffff', padding: 8, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    {([
                      { key: '12' as const, title: '12 inch (Extra Small)', sub: 'Maximum 1 line (3-5 letters)' },
                      { key: '18' as const, title: '18 inch (Small)', sub: 'Maximum 2 lines (5-8 letters each)' },
                      { key: '24' as const, title: '24 inch (Medium)', sub: 'Maximum 3 lines (5-11 letters per line)' },
                      { key: '30' as const, title: '30 inch (Large)', sub: 'Maximum 3 lines (12-15 letters per line)' },
                      { key: '36' as const, title: '36 inch (Extra Large)', sub: 'Maximum 3 lines (10-17 letters per line)' },
                      { key: '48' as const, title: '48 inch (Max)', sub: 'Maximum 4 lines (12-20 letters per line)' },
                    ]).map(opt => {
                      const selected = neonSize === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setNeonSize(opt.key)}
                          className="text-left rounded-lg px-3 py-3"
                          style={{
                            border: `1px solid ${selected ? '#14b8a6' : '#d1d5db'}`,
                            backgroundColor: '#ffffff',
                            color: '#1f2937'
                          }}
                        >
                          <div className="font-semibold">{opt.title}</div>
                          <div className="text-xs" style={{ color: '#6b7280' }}>{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="mb-2" style={{ color: '#1f2937' }}>Choose Your Font:</div>
                  <div className="relative w-full rounded-lg border-2 px-3 py-2 mb-3" onClick={() => setNeonFontOpen(!neonFontOpen)} style={{ borderColor: '#14b8a6', backgroundColor: '#ffffff', color: '#1f2937', cursor: 'pointer' }}>
                    <span>{neonFont}</span>
                    <span style={{ position: 'absolute', right: 16, top: 6, color: '#14b8a6' }}>{neonFontOpen ? '∧' : '∨'}</span>
                    {/* <span style={{ position: 'absolute', right: 8, top: -6, width: 12, height: 12, borderRadius: 9999, background: '#14b8a6' }}></span> */}
                  </div>
                  {neonFontOpen && (
                    <div className="dropdown-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, backgroundColor: '#ffffff', padding: 8, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                      {fontsMeta.map(f => {
                        const selected = neonFont === f.label;
                        const tileStyle: React.CSSProperties = {
                          border: `1px solid ${selected ? '#14b8a6' : '#d1d5db'}`,
                          backgroundColor: '#ffffff',
                          color: selected ? '#14b8a6' : '#1f2937',
                          fontFamily: f.family,
                          borderRadius: 12,
                          padding: '14px 12px',
                          textAlign: 'center',
                          textTransform: f.uppercase ? 'uppercase' as const : 'none' as const,
                          letterSpacing: f.letterSpacing || 'normal',
                          WebkitTextStroke: f.outline ? (selected ? '1.2px #14b8a6' : '1px #1f2937') : undefined,
                          color: f.outline ? 'transparent' : (selected ? '#14b8a6' : '#1f2937'),
                          boxShadow: selected ? '0 0 14px #14b8a655' : 'none',
                        };
                        return (
                          <button key={f.label} onClick={() => { setNeonFont(f.label); setNeonFontOpen(false); }} style={tileStyle}>{f.label}</button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-2" style={{ color: '#374151' }}>Select Your Colour</div>
                  <div className="flex flex-wrap gap-2">
                    {swatches.map(c => (
                      <button key={c} onClick={() => setNeonColor(c)} className="neon-swatch" style={{ backgroundColor: c, outline: neonColor === c ? '2px solid #14b8a6' : 'none' }} />
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">Selected: <span style={{ color: neonColor, fontWeight: 'bold', backgroundColor: "#000", borderRadius: 4, }}>{neonColor}</span></div>
                </div>
                <div>
                  <div className="mb-2" style={{ color: '#374151' }}>Pick the Backboard shape for your Neon sign</div>
                  <div className="relative w-full rounded-lg border-2 px-3 py-2 mb-3" onClick={() => setNeonBackboardOpen(!neonBackboardOpen)} style={{ borderColor: '#14b8a6', backgroundColor: '#ffffff', color: '#1f2937', cursor: 'pointer' }}>
                    <span>{neonBackboard}</span>
                    <span style={{ position: 'absolute', right: 16, top: 6, color: '#14b8a6' }}>{neonBackboardOpen ? '∧' : '∨'}</span>
                  </div>
                  {neonBackboardOpen && (
                    <div className="dropdown-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, backgroundColor: '#ffffff', padding: 8, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                      {['Rectangle', 'Cut to shape', 'Pill shape', 'Circle', 'Ornate', 'Rounded Rectangle'].map(b => {
                        const selected = neonBackboard === b;
                        const tileStyle: React.CSSProperties = {
                          border: `1px solid ${selected ? '#14b8a6' : '#d1d5db'}`,
                          backgroundColor: '#ffffff',
                          color: selected ? '#14b8a6' : '#1f2937',
                          borderRadius: 12,
                          padding: '12px 10px',
                          textAlign: 'center',
                          boxShadow: selected ? '0 0 12px #14b8a655' : 'none',
                        };
                        return (
                          <button key={b} onClick={() => { setNeonBackboard(b); setNeonBackboardOpen(false); }} style={tileStyle}>{b}</button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAddToCart} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#14b8a6' }}>Add to Cart</button>
                  <button onClick={handleBuyNow} className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#ffffff', color: '#1f2937', border: '1px solid #d1d5db' }}>Buy Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen content-offset" style={{ background: 'linear-gradient(135deg, #f0fdf9 0%, #fdf9efff 100%)' }}>
      <Navbar />

      {/* Decorative Squares (top) */}
      <div className="flex justify-between max-w-7xl mx-auto px-4 pt-12">
        <div className="flex gap-2">
          <div className="w-10 h-10 border-2 border-gray-200 rounded"></div>
          <div className="w-10 h-10 border-2 border-gray-200 rounded"></div>
        </div>

        <div className="flex gap-2">
          <div className="w-10 h-10 border-2 border-gray-200 rounded "></div>
          <div className="w-10 h-10 border-2 border-gray-200 rounded" ></div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6 text-sm flex items-center gap-2 text-gray-600">
        <Home className="w-4 h-4" color="#6b7280" />
        <Link to="/" className="hover:underline" style={{ color: '#1f2937' }}>Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/shop" className="hover:underline" style={{ color: '#1f2937' }}>Shop</Link>
        <ChevronRight className="w-4 h-4" />
        <span style={{ color: '#1f2937' }}>{product?.name || 'Product'}</span>
      </div>

      {/* Product Detail Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-h-none lg:max-h-[90vh]">

          {/* Image Box */}
          <div className="soft-card rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', color: '#4b5563' }}>

            <div
              ref={imageContainerRef}
              className="rounded-lg overflow-hidden"
              style={{ height: '50vh', minHeight: '400px', maxHeight: '500px', cursor: zoom > 1 ? "zoom-in" : "default", backgroundColor: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(5px)' }}
              onMouseMove={(e) => updateOriginFromPoint(e.clientX, e.clientY)}
              onTouchStart={handleMainImageTouchStart}
              onTouchEnd={handleMainImageTouchEnd}
              onClick={toggleZoom}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: origin,
                  width: "100%",
                  height: "100%",
                  transition: "transform 0.2s ease-out",
                  willChange: "transform",
                }}
              >

                {/* 🔥 Image + Watermark Added Here */}
                <div
                  className="relative w-full h-full image-protected"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    return false;
                  }}
                >

                  {/* Main Product Image */}
                  <ImageWithFallback
                    src={optimizeImage(activeImage, 800)}
                    srcSet={
                      activeImage
                        ? `${optimizeImage(activeImage, 400)} 400w,
         ${optimizeImage(activeImage, 800)} 800w,
         ${optimizeImage(activeImage, 1200)} 1200w`
                        : undefined
                    }
                    alt={product?.name || "Product image"}
                    loading="eager"
                    fetchPriority="high"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    decoding="async"
                    className="w-full h-full object-contain select-none"
                    onContextMenu={(e) => e.preventDefault()}
                  />



                  {/* Watermark Logo */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      width: '60px',
                      height: '60px',
                      opacity: 0.35,
                      pointerEvents: 'none',
                      zIndex: 20,
                    }}
                  >
                    <img
                      src={logo}
                      alt="Watermark"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                      }}
                      draggable={false}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* --- THUMBNAIL STRIP – RESPONSIVE CAROUSEL --- */}
            {!islighting && (

              <div className="relative overflow-hidden px-2 sm:px-12">
                {/* Left Arrow - Hidden on mobile */}
                <button
                  onClick={() => handleArrow("left")}
                  className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full border hover:bg-gray-100 transition-colors items-center justify-center"
                  style={{ borderColor: "#e5e7eb", backgroundColor: "rgba(255,255,255,0.9)", color: "#1f2937" }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div
                  ref={thumbStripRef}
                  className="thumbs-strip pb-3 pt-3 sm:pb-4 sm:pt-4 overflow-hidden"
                  // wheel handled via native event listener
                  onKeyDown={handleThumbKeyDown}
                  onTouchStart={handleThumbTouchStart}
                  onTouchMove={handleThumbTouchMove}
                  onTouchEnd={handleThumbTouchEnd}
                >
                  {/* Static thumbnails - centered, no sliding */}
                  <div
                    className="thumb-slider flex gap-2 sm:gap-3 justify-center"
                  >
                    {/* All thumbnails - responsive sizing */}
                    {optimizedThumbItems.map((item, index) => (
                      <div
                        key={index}
                        className={`thumb-item w-12 h-12 sm:w-20 sm:h-20 rounded-md sm:rounded-lg border-2 cursor-pointer overflow-hidden shrink-0 transition-all duration-300
            ${item.selected ? "border-teal-600 shadow-lg scale-105 sm:scale-110 ring-2 ring-teal-600" : "border-gray-300 opacity-70 hover:opacity-100 active:opacity-100"}`}
                        onClick={() => selectByIndex(index)}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        <ImageWithFallback src={item.src} alt={item.alt} loading="lazy" className="w-full h-full object-cover" />
                        {item.label && (
                          <span className="hidden sm:block absolute bottom-1 left-1 text-[10px] px-2 py-0.5 rounded bg-black/60 text-white">
                            {item.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Arrow - Hidden on mobile */}
                <button
                  onClick={() => handleArrow("right")}
                  className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full border hover:bg-gray-100 transition-colors items-center justify-center"
                  style={{ borderColor: "#e5e7eb", backgroundColor: "rgba(255,255,255,0.9)", color: "#1f2937" }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Quick Specs to avoid empty space on left */}
            {!product.isCustomCanvas && (
              <div className="hidden lg:block mt-4 rounded-2xl p-4 soft-card" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#1f2937' }}>Quick Specs</h3>
                <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: '#4b5563' }}>
                  {product.material && (
                    <div>
                      <span style={{ color: '#6b7280' }}>Material:</span> <span>{product.material}</span>
                    </div>
                  )}
                  {product.layout && (
                    <div>
                      <span style={{ color: '#6b7280' }}>Layout:</span> <span>{product.layout}</span>
                    </div>
                  )}
                  {product.colors?.length > 0 && (
                    <div className="col-span-2">
                      <span style={{ color: '#6b7280' }}>Available Colors:</span> <span>{product.colors.join(', ')}</span>
                    </div>
                  )}
                  {product.sizes?.length > 0 && (
                    <div className="col-span-2">
                      <span style={{ color: '#6b7280' }}>Sizes:</span> <span>{product.sizes.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Canvas - Instructions & Photo Upload - Below How it works */}
            {product.isCustomCanvas && (
              <div className="mt-4 rounded-xl border border-gray-200 p-4 bg-white/80 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: '#1f2937' }}>Enter instructions for your order here</h3>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Describe changes..."
                    className="w-full h-12 p-2 rounded-lg border-2 focus:border-teal-500 focus:outline-none transition resize-none"
                    style={{ borderColor: '#d1d5db' }}
                    rows={3}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: '#1f2937' }}> Upload Photo <span className="text-red-500">*</span></h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="cursor-pointer px-4 py-2 rounded-lg border-2 hover:bg-gray-50 transition flex items-center gap-2" style={{ borderColor: customFile ? '#14b8a6' : '#d1d5db', color: '#374151' }}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setCustomFile({ name: file.name, dataUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {customFile ? 'Change file' : 'Choose file'}
                    </label>
                    <span className="text-sm" style={{ color: '#6b7280' }}>
                      {customFile?.name || 'No file chosen'}
                    </span>
                    {customFile && (
                      <button
                        type="button"
                        onClick={() => setCustomFile(null)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {/* Image Preview */}
                  {customFile?.dataUrl && (
                    <div className="mt-3">
                      <p className="text-sm mb-2" style={{ color: '#6b7280' }}>Preview:</p>
                      <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-teal-200 shadow-md">
                        <img
                          src={customFile.dataUrl}
                          alt="Upload preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Canvas - How it works section - Below specs */}
            {product.isCustomCanvas && (
              <div className="mt-4 rounded-xl border border-gray-200 p-4 bg-white/80">
                <h3 className="text-lg font-bold mb-3" style={{ color: '#1f2937' }}>How it works:</h3>
                <ol className="space-y-2 text-sm" style={{ color: '#374151' }}>
                  <li><strong>1. Upload Your File:</strong> Ensure you provide a high-resolution image for optimal print clarity. We will enhance it on our end as well.</li>
                  <li><strong>2. Add Your Instructions:</strong> Let us know how you want the design to look, including any special details or changes.</li>
                  <li><strong>3. Review & Finalize:</strong> We'll create your unique design and show it to you. Once you're happy with it, we'll get ready to print.</li>
                  <li><strong>4. Paying for Extra Work:</strong> If your design needs a lot of detailed work, there will be an extra cost. But, if your picture doesn't need much change or you provide your design, there's no extra charge.</li>
                </ol>
              </div>
            )}

          </div>

          {/* Product Info */}
          <div
            className="max-h-[80vh] overflow-y-auto pr-2"
            style={{ overscrollBehavior: 'contain' }}
            onWheel={(e) => {
              const element = e.currentTarget;
              const isAtTop = element.scrollTop === 0;
              const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight;

              // Allow page scroll when at boundaries
              if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                return; // Let the event propagate to page scroll
              }

              // Prevent page scroll when scrolling within container
              e.stopPropagation();
            }}
          >

            <div className="flex items-center gap-2 mb-2 text-sm" style={{ color: '#6b7280' }}>
              {Boolean(product.category && String(product.category).trim()) && (
                <span className="px-6 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: '#374151', backgroundColor: 'white' }}>{String(product.category).trim()}</span>
              )}
              {Boolean(product.layout && String(product.layout).trim()) && (
                <span className="px-6 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: '#374151', backgroundColor: 'white' }}>{String(product.layout).trim()}</span>
              )}
              {Boolean(product.material && String(product.material).trim()) && (
                <span className="px-6 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: '#374151', backgroundColor: 'white' }}>{String(product.material).trim()}</span>
              )}
            </div>

            <h1 className="custom-heading"><span>{product.name}</span></h1>

            <div className="mt-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-lg" style={{ textDecoration: 'line-through' }}>
                    ₹{Math.round(price * 1.15).toLocaleString('en-IN')}
                  </span>
                  <span className="text-2xl font-bold" style={{ color: '#14b8a6' }}>
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-green-600 text-sm font-medium">
                  Save ₹{Math.round(price * 0.15).toLocaleString('en-IN')} (15% off)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  Tax included. <Link to="/terms" className="underline" style={{ color: '#4b5563' }}>Shipping</Link> calculated at checkout.
                </p>
                <button className="p-2 rounded-lg border cursor-pointer" style={{ borderColor: '#d1d5db', backgroundColor: 'white' }} onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }} title="Copy Link">
                  <Copy className="w-5 h-5" color="#6b7280" />
                </button>
                <button className="p-2 rounded-lg border cursor-pointer" style={{ borderColor: '#d1d5db', backgroundColor: 'white' }} onClick={() => { if (navigator.share) { navigator.share({ title: product.name, url: window.location.href }).catch(() => { }); } else { toast.info('Use copy to share'); } }} title="Share">
                  <Share2 className="w-5 h-5" color="#6b7280" />
                </button>
              </div>
            </div>

            {(product.rating || product.reviewsCount) && (
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5" color={i < Math.round(Number(product.rating || 0)) ? '#22c55e' : '#475569'} />
                ))}
                <span className="text-sm" style={{ color: '#6b7280' }}>{Number(product.rating || 0).toFixed(1)} {product.reviewsCount ? `(${product.reviewsCount} reviews)` : ''}</span>
              </div>
            )}

            {/* Format (Rolled / Canvas / Frame) + Layout */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6">

              {/* Material (Format) - Hide for Neon Signs */}
              {!product.categories?.some((cat: string) => cat.toLowerCase().includes('neon')) && (
                <div>

                  <h3 className="font-semibold mb-2" style={{ color: '#1f2937' }}>Material</h3>
                  <div className="flex flex-wrap gap-3 rounded-lg ">
                    {(['Canvas'] as const)
                      .map((fmt) => {
                        const available = computePriceFor(selectedSize, fmt, product.subsection) !== undefined;
                        return (
                          <button
                            key={fmt}
                            onClick={() => available && setSelectedFormat(fmt)}
                            className={`px-4 py-1 rounded-lg border-2 transition ${selectedFormat === fmt ? 'border-teal-500 bg-teal text-white cursor-pointer'
                              : ''
                              } ${available ? '' : 'opacity-50 cursor-not-allowed'}`}
                            style={{ borderColor: selectedFormat === fmt ? undefined : '#d1d5db', color: selectedFormat === fmt ? undefined : '#374151' }}
                            title={available ? '' : 'Not available for this size'}
                            disabled={!available}
                          >
                            {fmt}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2" style={{ color: '#1f2937' }}>Size (in inches)</h3>
                <div className="flex flex-wrap gap-3">
                  {(product.layout?.toLowerCase() === 'landscape'
                    ? ['36X18', '48X24', '20X30', '30X40']
                    : product.sizes
                  ).map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-1 rounded-lg border-2 cursor-pointer transition ${selectedSize === size
                        ? 'border-teal-500 bg-teal text-white'
                        : ''
                        }`}
                      style={{ borderColor: selectedSize === size ? undefined : '#d1d5db', color: selectedSize === size ? undefined : '#374151' }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Frame Options - Hide for Neon Signs and Lighting products, show appropriate options for Circle/Custom Canvas */}
            {!islighting && !product.categories?.some((cat: string) => cat.toLowerCase().includes('neon')) && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2" style={{ color: '#1f2937' }}>Frame</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Without Frame (Rolled)', fmt: 'Rolled' as const, color: '' },
                    { label: 'Stretched Canvas', fmt: 'Canvas' as const, color: '' },
                    { label: 'Black Frame', fmt: 'Frame' as const, color: 'Black' },
                    { label: 'White Frame', fmt: 'Frame' as const, color: 'White' },
                    { label: 'Dark Wood Frame', fmt: 'Frame' as const, color: 'Brown' },
                  ]
                    .filter(opt => {
                      // For circle/round canvas, only show Rolled and Canvas options
                      if (product.layout?.toLowerCase() === 'circle') {
                        return opt.fmt === 'Rolled' || opt.fmt === 'Canvas';
                      }
                      return true;
                    })
                    .map((opt) => {
                      const available = product.isCustomCanvas || computePriceFor(selectedSize, opt.fmt, product.subsection) !== undefined;
                      const isActive =
                        selectedFormat === opt.fmt &&
                        (opt.fmt !== 'Frame' || selectedColor === opt.color || !opt.color);
                      return (
                        <button
                          key={opt.label}
                          onClick={() => {
                            if (!available) return;
                            setSelectedFormat(opt.fmt);
                            if (opt.fmt === 'Frame') {
                              setSelectedColor(opt.color);
                            } else {
                              setSelectedColor('');
                            }
                          }}
                          className={`px-4 py-1 rounded-lg border-2 transition cursor-pointer ${isActive ? 'border-teal-500 bg-teal text-white' : ''
                            } ${available ? '' : 'opacity-50 cursor-not-allowed'}`}
                          style={{ borderColor: isActive ? undefined : '#d1d5db', color: isActive ? undefined : '#374151' }}
                          disabled={!available}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
            
            {/* Lighting Color Selector - Rounded LG */}
            {islighting && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-800">
                  Select Light Colour
                </h3>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 ">
                  {[
                    { name: 'White', hex: '#ffffff' },
                    { name: 'Pink', hex: '#FF2ec4' },
                    { name: 'Green', hex: '#39ff14' },
                    { name: 'Cyan', hex: '#00e5ff' },
                    { name: 'Blue', hex: '#1e4bff' },
                    { name: 'Yellow', hex: '#fff700' },
                    { name: 'Orange', hex: '#ff9f00' },
                    { name: 'Red', hex: '#ff1a1a' },
                    { name: 'Purple', hex: '#9b5cff' },
                    { name: 'Ice', hex: '#b3f5ff' },
                 
                  ].map(({ name, hex }) => {
                    const selected = selectedColor === hex.toLowerCase().trim();

                    return (
                      <button
                        key={hex}
                        onClick={() => setSelectedColor(hex.toLowerCase().trim())}
                        title={name}
                        className={`
              relative cursor-pointer w-10 h-10  rounded-lg shrink-0 transition-all duration-200 
              ${selected
                            ? 'border-2 border-teal-500 scale-105'
                            : 'border border-gray-300 hover:scale-105'}
            `}
                        style={{
                          backgroundColor: hex,
                          boxShadow: selected
                            ? `0 0 10px ${hex}, 0 0 16px rgba(20,184,166,0.35)`
                            : 'none',
                        }}
                      >
                        {selected && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Art Style - Custom Canvas Only */}
            {product.isCustomCanvas && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2" style={{ color: '#1f2937' }}>ART STYLE</h3>
                <div className="flex flex-wrap gap-3">
                  {['Royal Portrait', 'Gangster Style', 'Cartoon Style', 'Oil Painting', 'Fantasy Painting'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedArtStyle(style)}
                      className={`px-4 py-2 rounded-lg border-2 transition ${selectedArtStyle === style ? 'border-teal-500 bg-teal text-white' : ''
                        }`}
                      style={{
                        borderColor: selectedArtStyle === style ? undefined : '#d1d5db',
                        color: selectedArtStyle === style ? undefined : '#374151',
                        backgroundColor: selectedArtStyle === style ? '#14b8a6' : 'transparent' // Light teal bg for selected
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-3">
              <h3 className="mb-2" style={{ color: '#1f2937' }}>Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  style={{ borderColor: '#d1d5db', color: '#374151' }}
                >
                  -
                </button>
                <span className="text-lg font-semibold" style={{ color: '#1f2937' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  style={{ borderColor: '#d1d5db', color: '#374151' }}>
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mb-8">

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="flex-1 px-10 py-3 rounded-xl transition-all duration-200 tracking-widest hover:bg-gray-50 cursor-pointer"
                style={{ border: '1px solid #d1d5db', backgroundColor: 'transparent', color: '#374151', fontWeight: 700 }}
              >
                <div className="flex gap-2 items-center justify-center">
                  <ShoppingCart className="w-5 h-5" color="#374151" />
                  ADD TO CART
                </div>
              </button>

              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                className="flex-1 px-10 py-3 rounded-xl text-black font-semibold transition-all duration-200 tracking-widest cursor-pointer"
                style={{ backgroundColor: '#14b8a6', color: '#0b1220', fontWeight: 700 }}
              >
                BUY NOW
              </button>

              {/* Wishlist */}
              <button
                onClick={handleAddToWishlist}
                className={`
                        w-12 h-12 rounded-xl border-2
                        flex items-center justify-center
                        transition-all duration-200 cursor-pointer
                        ${isInWishlist
                    ? 'border-red-400 bg-red-50 hover:bg-red-100'
                    : 'border-gray-300 hover:border-teal-500 hover:bg-teal-50'
                  }
    `}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  className={`w-5 h-5 transition-all ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-teal-600'}`}
                />
              </button>

            </div>


            <div className="mt-6 rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 uppercase tracking-wider text-sm text-gray-900">
                <div className="flex items-center gap-3 "><Truck className="w-5 h-5" color="#14b8a6" /><span>Free Delivery in 7–10 Days</span></div>
                <div className="flex items-center gap-3"><Package className="w-5 h-5" color="#14b8a6" /><span>4‑Layer Secure Packaging</span></div>
                <div className="flex items-center gap-3"><Lock className="w-5 h-5" color="#14b8a6" /><span>Secure Payments</span></div>
                <div className="flex items-center gap-3"><CheckSquare className="w-5 h-5" color="#14b8a6" /><span>Partial Cash on Delivery</span></div>
              </div>
              <div className="border-t border-gray-200" />

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" color="#14b8a6" />
                    <span className="uppercase tracking-wider text-sm text-gray-900">Top Quality, Check</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition" />
                </summary>
                <div className="mt-3 space-y-2 text-gray-800">
                  <div className="flex items-start gap-2"><CheckCircle className="w-5 h-5" color="#14b8a6" /><span className="mt-3 text-sm text-gray-700">Colors that stay bright, printed on 400 GSM premium canvas.</span></div>
                  <div className="flex items-start gap-2"><CheckCircle className="w-5 h-5" color="#14b8a6" /><span className="mt-3 text-sm text-gray-700">Built by hand with pinewood frames that last for years.</span></div>
                  <div className="flex items-start gap-2"><CheckCircle className="w-5 h-5" color="#14b8a6" /><span className="mt-3 text-sm text-gray-700">Soft matte look that feels calm, elegant, and glare‑free.</span></div>
                </div>
              </details>

              <div className="border-t border-gray-200" />

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <CircleHelp className="w-4 h-4" color="#14b8a6" />
                    <span className="uppercase tracking-wider text-sm text-gray-900">How Will I Hang It?</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition" />
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  Simply hammer in the included nails at your chosen spot. Then, carefully unbox and unwrap the frame. Hang it on the nails using the pre‑attached hooks. For our Stretched Canvas, no hooks are needed — just rest the top edge directly on the nails for a sleek, seamless look.
                </p>
              </details>

              <div className="border-t border-gray-200" />

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" color="#14b8a6" />
                    <span className="uppercase tracking-wider text-sm text-gray-900">Can I Return My Order?</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition" />
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  At Decorizz, we want you to love your purchase. If needed, you can return items within 48 hours for easy replacements or store credit. Our hassle‑free return process ensures quick resolution for any issues.
                </p>
              </details>

              <div className="border-t border-gray-200" />

              <details className="group" open>
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" color="#14b8a6" />
                    <span className="uppercase tracking-wider text-sm text-gray-900">About This Artwork</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition" />
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  {product.description}
                </p>
              </details>
            </div>

            {/* Specifications */}
            {/* {product.material && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-2xl font-semibold mb-4">Specifications</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <span>{product.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Colors:</span>
                    <span>{product.colors.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sizes:</span>
                    <span>{product.sizes.join(', ')}</span>
                </div>

        </div>

     
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/90 backdrop-blur border-t border-gray-200 p-3 z-40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">₹{price.toFixed(0)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddToCart} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800">Add</button>
              <button onClick={handleBuyNow} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#14b8a6' }}>Buy Now</button>
            </div>
          </div>
        </div>

      </div>
            )} */}
          </div>

        </div>

        {/* Reviews Section */}


        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-6 rounded-2xl p-6" style={{
            background: "linear-gradient(135deg, #f5f2e9 0%)",
            backdropFilter: "blur(2px)",
          }}>
            <h2 className="custom-heading font-bold text-center mb-12">
              Related <span style={{ color: "#14b8a6" }}>Frames</span>
            </h2>


            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => {
                let overridePrice = undefined;
                if (product.layout?.toLowerCase() === 'landscape') {
                  // Default to 36X18 price (2999) for Landscape related cards
                  overridePrice = computePriceFor('36X18', 'Rolled', product.subsection);
                }

                return (
                  <LazyShow key={product.id}>
                    <ProductCard product={product} overridePrice={overridePrice} />
                  </LazyShow>
                );
              })}
            </div>
          </div>

        )}

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
          <ProductReviews productId={product?.id || id || ''} />
        </div>
      </div>

      {/* Floating Product Video */}
      {(product?.id || id) && (
        <FloatingProductVideo productId={product?.id || id || ''} />
      )}

      <Footer />
    </div >
  );
}