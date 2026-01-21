import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import SkeletonProductCard from '../components/SkeletonProductCard';
import { Filter, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { MobileFilterSheet } from '../components/MobileFilterSheet';


const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" }
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const isDarkTheme = typeof document !== 'undefined' && !!document.querySelector('.dark-theme');

  return (
    <div className="relative sort-dropdown z-40">
      {/* Button */}
      <button
        className="border px-4 py-2 rounded-xl font-medium w-full flex items-center justify-between cursor-pointer"
        style={{
          borderColor: isDarkTheme ? '#334155' : '#d1d5db',
          backgroundColor: isDarkTheme ? '#0f172a' : '#ffffff',
          color: isDarkTheme ? '#e5e7eb' : '#374151'
        }}
        onClick={() => setOpen(!open)}
      >
        {SORT_OPTIONS.find(o => o.value === value)?.label}
        <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-full rounded-xl shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-sm"
          style={{
            backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isDarkTheme ? '#334155' : '#f3f4f6'}`
          }}
        >
          <div className="py-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="flex items-center justify-between w-full px-6 py-2 text-sm text-left transition-colors duration-150"
                style={{
                  backgroundColor: value === opt.value ? (isDarkTheme ? 'rgba(20, 184, 166, 0.1)' : '#f0fdfa') : 'transparent',
                  color: value === opt.value ? '#14b8a6' : (isDarkTheme ? '#e5e7eb' : '#374151'),
                  fontWeight: value === opt.value ? 600 : 400
                }}
                onMouseEnter={(e) => {
                  if (value !== opt.value) {
                    e.currentTarget.style.backgroundColor = isDarkTheme ? '#1e293b' : '#f8fafc';
                    e.currentTarget.style.color = '#14b8a6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== opt.value) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = isDarkTheme ? '#e5e7eb' : '#374151';
                  }
                }}
              >
                <span className="whitespace-nowrap">{opt.label}</span>
                {value === opt.value && (
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



const ROOM_OPTIONS = [
  { name: 'Home Bar' },
  { name: 'Bath Space' },
  { name: 'Bedroom' },
  { name: 'Dining Area' },
  { name: 'Game Zone / Lounge Cave' },
  { name: 'Workshop / Garage Space' },
  { name: 'Fitness Room' },
  { name: 'Entryway / Corridor' },
  { name: 'Kids Space' },
  { name: 'Kitchen' },
  { name: 'Living Area' },
  { name: 'Office / Study Zone' },
  { name: 'Pooja Room' },
];


const LAYOUT_OPTIONS = ['Portrait', 'Square', 'Landscape'];
const SIZE_OPTIONS = ['8×12', '12×18', '18×24', '20×30', '24×36', '30×40', '36×48', '48×66', '18×18', '24×24', '36×36', '20×20', '30×30'];
const COLOR_OPTIONS = ['White', 'Black', 'Brown'];
const MATERIAL_OPTIONS = ['Wood', 'Metal', 'Plastic', 'Glass'];
// Decor categories matching navbar dropdown
const DECOR_CATEGORIES = ['Animals Art', 'Birds Art', 'Natural Art', 'Office Canvas Art', 'Boho Art', 'Wall Art', '3D Wall Art', '3 Set Art', '2 Set Art', 'Mandela Art'];
// CATEGORY_OPTIONS now computed dynamically from products

// Simple Fisher–Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  room?: string;
  roomCategory?: string;
  layout?: string;
  size?: string;
  sizes?: string[];
  colors?: string[];
  material?: string;
  category?: string;
  categories?: string[];
  createdAt?: string;
  subsection?: '2-Set' | '3-Set' | 'Square';
  format?: 'Rolled' | 'Canvas' | 'Frame';
  frameColor?: 'White' | 'Black' | 'Brown';
}

export default function DecorByRoomPage() {
  // ⬇️ Adapted from ShopPage

  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter only Decor/Room products
  const decorProducts = useMemo(() => {
    return products.filter(p => {
      // Check if product belongs to any Decor category
      const productCategories = p.categories && p.categories.length > 0
        ? p.categories
        : (p.category ? [p.category] : []);
      const isDecorCategory = productCategories.some(cat => DECOR_CATEGORIES.includes(cat));

      // Check if product has a room assigned
      const hasRoom = !!(p.room || p.roomCategory);

      return isDecorCategory || hasRoom;
    });
  }, [products]);

  const shuffledProducts = useMemo(() => shuffleArray(decorProducts), [decorProducts]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (showFilters) {
      body.style.overflow = 'hidden';
      body.style.touchAction = 'none';
    } else {
      body.style.overflow = '';
      body.style.touchAction = '';
    }
    return () => {
      body.style.overflow = '';
      body.style.touchAction = '';
    };
  }, [showFilters]);

  const [expandedSections, setExpandedSections] = useState({
    room: true,
    layout: true,
    size: true,
    colors: true,
    materials: true,
    categories: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 12;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState({
    rooms: [] as string[],
    layouts: [] as string[],
    sizes: [] as string[],
    colors: [] as string[],
    materials: [] as string[],
    categories: [] as string[],
    priceMin: 0,
    priceMax: 10000,
    sortBy: 'popular',
  });

  const [activeFilter, setActiveFilter] = useState<string>('All');

  const BASIC_PRICE: Record<string, { Rolled: number | null; Canvas: number | null; Frame: number | null }> = {
    '8X12': { Rolled: 679, Canvas: 800, Frame: 999 },
    '12X18': { Rolled: 879, Canvas: 1100, Frame: 1299 },
    '18X24': { Rolled: 1280, Canvas: 1699, Frame: 1799 },
    '20X30': { Rolled: 1780, Canvas: 2599, Frame: 2799 },
    '24X36': { Rolled: 1999, Canvas: 2999, Frame: 3299 },
    '30X40': { Rolled: 3580, Canvas: 4599, Frame: 5199 },
    '36X48': { Rolled: 3500, Canvas: 5799, Frame: 6499 },
    '48X66': { Rolled: 5879, Canvas: 9430, Frame: null },
    '18X18': { Rolled: 1199, Canvas: 1699, Frame: 1899 },
    '24X24': { Rolled: 1599, Canvas: 2299, Frame: 2499 },
    '36X36': { Rolled: 3199, Canvas: 4599, Frame: 4999 },
    '20X20': { Rolled: 1299, Canvas: 1899, Frame: 1999 },
    '30X30': { Rolled: 2199, Canvas: 3199, Frame: 3499 },
  };

  const TWOSET_PRICE: Record<string, { Rolled: number | null; Canvas: number | null; Frame: number | null }> = {
    '8X12': { Rolled: 1299, Canvas: 1599, Frame: 1999 },
    '12X18': { Rolled: 1899, Canvas: 2199, Frame: 2499 },
    '18X24': { Rolled: 2499, Canvas: 3399, Frame: 3599 },
    '20X30': { Rolled: 3799, Canvas: 5199, Frame: 5599 },
    '24X36': { Rolled: 3999, Canvas: 5999, Frame: 6599 },
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

  const normalizeSize = (s?: string) => {
    if (!s) return '';
    const cleaned = s.replace(/\s+/g, '').toUpperCase().replace('×', 'X');
    const parts = cleaned.split('X');
    if (parts.length !== 2) return cleaned;
    return `${parts[0]}X${parts[1]}`;
  };

  const computePriceFor = (
    size: string,
    format: 'Rolled' | 'Canvas' | 'Frame',
    subsection?: '2-Set' | '3-Set' | 'Square'
  ) => {
    const key = normalizeSize(size);
    let table = null;

    if (['2-Set', '3-Set'].includes(activeFilter)) {
      table = activeFilter === '2-Set' ? TWOSET_PRICE : THREESET_PRICE;
    } else {
      table = BASIC_PRICE;
    }

    const row = table[key];
    if (!row) return undefined;
    const value = row[format];
    return value === null ? undefined : value ?? undefined;
  };

  useEffect(() => {
    fetchProducts();

    // Handle params
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');
    const format = searchParams.get('format');
    const subsection = searchParams.get('subsection');
    const room = searchParams.get('room'); // Added room handling

    setFilters(prev => ({
      ...prev,
      categories: category ? [category] : prev.categories,
      rooms: room ? [room] : prev.rooms,
      sortBy: sort || prev.sortBy
    }));

    if (format && ['Canvas', 'Frame'].includes(format)) {
      setActiveFilter(format);
    } else if (subsection && ['2-Set', '3-Set', 'Square'].includes(subsection)) {
      setActiveFilter(subsection);
    }
  }, [searchParams]);


  const fetchProducts = async () => {
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
      setProducts(data.products || []);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomCounts = () => {
    const counts: { [key: string]: number } = {};
    decorProducts.forEach(p => {
      const room = p.roomCategory || p.room;
      if (room) {
        counts[room] = (counts[room] || 0) + 1;
      }
    });
    return counts;
  };

  const roomCounts = useMemo(() => getRoomCounts(), [decorProducts]);

  const getCategoryCounts = () => {
    const counts: { [key: string]: number } = {};
    decorProducts.forEach(p => {
      const productCategories = p.categories && p.categories.length > 0
        ? p.categories
        : (p.category ? [p.category] : []);

      productCategories.forEach(cat => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return counts;
  };
  const categoryCounts = useMemo(() => getCategoryCounts(), [decorProducts]);
  const categoryNames = Object.keys(categoryCounts).sort();



  const toggleFilter = (filterType: string, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterType as keyof typeof prev] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterType]: newValues };
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
  };

  const clearFilters = () => {
    setFilters({
      rooms: [],
      layouts: [],
      sizes: [],
      colors: [],
      materials: [],
      categories: [],
      priceMin: 0,
      priceMax: 10000,
      sortBy: 'popular',
    });
  };

  const activeFilterCount =
    filters.rooms.length +
    filters.layouts.length +
    filters.sizes.length +
    filters.colors.length +
    filters.materials.length +
    filters.categories.length;



  const filteredProducts = useMemo(() => {
    // 🔹 Start from shuffled list instead of original
    let result = [...shuffledProducts];

    if (filters.rooms.length > 0) {
      result = result.filter(p => filters.rooms.includes(p.roomCategory || p.room || ''));
    }

    if (filters.layouts.length > 0) {
      result = result.filter(p => filters.layouts.includes(p.layout || ''));
    }

    if (filters.sizes.length > 0) {
      result = result.filter(p => {
        if (Array.isArray(p.sizes)) return p.sizes.some(s => filters.sizes.includes(s));
        return filters.sizes.includes(p.size || '');
      });
    }

    if (filters.colors.length > 0) {
      result = result.filter(p => p.colors?.some(c => filters.colors.includes(c)));
    }

    if (filters.materials.length > 0) {
      result = result.filter(p => filters.materials.includes(p.material || ''));
    }

    if (filters.categories.length > 0) {
      result = result.filter(p => {
        // Support both new categories array and old single category field
        const productCategories = p.categories && p.categories.length > 0
          ? p.categories
          : (p.category ? [p.category] : []);
        return productCategories.some(cat => filters.categories.includes(cat));
      });
    }

    result = result.filter(p => p.price >= filters.priceMin && p.price <= filters.priceMax);

    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.createdAt || '').getTime() -
            new Date(a.createdAt || '').getTime()
        );
        break;
      // 'popular' → keep shuffled order
    }

    return result;
  }, [shuffledProducts, filters]);


  const finalFilteredProducts = useMemo(() => {
    return filteredProducts.filter(p => {
      if (activeFilter === 'All') return true;
      if (['Canvas', 'Frame'].includes(activeFilter)) {
        return p.format === activeFilter;
      }
      if (['2-Set', '3-Set', 'Square'].includes(activeFilter)) {
        return p.subsection === activeFilter;
      }
      return true;
    });
  }, [filteredProducts, activeFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(finalFilteredProducts.length / PAGE_SIZE));
  }, [finalFilteredProducts]);

  const paginatedProducts = useMemo(() => {
    return finalFilteredProducts.slice(0, currentPage * PAGE_SIZE);
  }, [finalFilteredProducts, currentPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setCurrentPage((p) => {
          const next = p + 1;
          const maxPages = Math.max(1, Math.ceil(finalFilteredProducts.length / PAGE_SIZE));
          return next <= maxPages ? next : p;
        });
      }
    }, { root: null, rootMargin: '200px', threshold: 0.01 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [finalFilteredProducts.length, PAGE_SIZE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeFilter]);


  return (
    <div className="min-h-screen content-offset premium-bg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        {/* HERO HEADER - CUSTOMIZED FOR DECOR PAGE */}
        <section className=" mx-auto sm:px-6 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="premium-card-glow p-8 sm:p-12 animate-fade-scale">
              <h1 className="text-center custom-heading">
                Decor <span className="text-gradient-teal">Your Space</span>
              </h1>
              <p className="text-center max-w-3xl mx-auto italic text-base sm:text-lg" style={{ color: "#4b5563" }}>
                Find the perfect piece for every corner of your home.
              </p>
            </div>
          </div>
        </section>

        <div className="flex gap-8 items-stretch">
          {/* Filters Sidebar */}
          <div
            className={`${showFilters ? 'block' : 'hidden'}
    lg:block lg:w-64 lg:flex-shrink-0`}
          >
            {/* Mobile Overlay */}
            <div
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowFilters(false)}
            ></div>

            {/* Filter Panel */}
            <div
              className="
    

    max-lg:fixed
    max-lg:inset-0
    max-lg:overflow-y-auto
    max-lg:top-0

    lg:rounded-3xl
    max-lg:rounded-none
    shadow-2xl
    flex flex-col
    z-20
    custom-scrollbar

    lg:bg-white/100
    lg:backdrop-blur-md
    max-lg:bg-white
    max-lg:w-full
    max-lg:h-full
  "
              style={{
                border: '1px solid #e5e7eb',
              }}
            >

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg lg:hidden">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: '#1f2937' }}>
                    Filters
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden p-2 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>


              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                {/* Categories Filter */}
                <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                  <button
                    onClick={() => toggleSection('categories')}
                    className="flex items-center justify-between w-full mb-3 transition px-2 py-1 rounded-lg bg-teal"
                    style={{ fontWeight: 700, color: '#1f2937' }}
                  >
                    <h3 className="text-white">Categories</h3>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expandedSections.categories ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {expandedSections.categories && (
                    <div className="space-y-2">
                      {DECOR_CATEGORIES.map(cat => {
                        const isChecked = filters.categories.includes(cat);
                        return (
                          <label key={cat} className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleFilter('categories', cat)}
                                className="mr-2"
                                style={{ accentColor: '#14b8a6' }}
                              />
                              <span className="text-sm transition" style={{ color: '#4b5563' }}>
                                {cat}
                              </span>
                            </div>
                            <span className="text-xs" style={{ color: '#94a3b8' }}>({categoryCounts[cat] || 0})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                  {/* Price Range */}
                                <div className="mb-6">
                                    <h3 className="mb-3" style={{ fontWeight: 700, color: '#1f2937' }}>
                                        Price Range
                                    </h3>
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="10000"
                                            value={filters.priceMax}
                                            onChange={(e) =>
                                                setFilters(prev => ({ ...prev, priceMax: Number(e.target.value) }))
                                            }
                                            className="w-full"
                                            style={{ accentColor: '#14b8a6' }}
                                        />
                                        <div className="flex items-center justify-between text-sm">
                                            <span style={{ color: '#6b7280' }}>₹{filters.priceMin}</span>
                                            <span style={{ color: '#6b7280' }}>₹{filters.priceMax}</span>
                                        </div>
                                    </div>
                                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-3 px-4 rounded-xl font-semibold transition"
                    style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              {/* Mobile Action Buttons */}
              <div className="lg:hidden p-4 border-t flex gap-3 sticky bottom-0" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 rounded-lg font-semibold transition"
                  style={{ border: '2px solid #e5e7eb', color: '#1f2937', backgroundColor: 'transparent' }}
                >
                  Clear
                </button>

                <button
                  onClick={() => setShowFilters(false)}
                  className="premium-btn-white flex-1"
                >
                  Show {filteredProducts.length} Products
                </button>

              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 w-full lg:order-1 min-w-0">
            {/* Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

              <p style={{ fontWeight: 500, color: '#6b7280' }}>
                <span style={{ color: '#14b8a6', fontWeight: 700 }}>
                  {filteredProducts.length}
                </span>
                {" "}products found
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <SortDropdown
                  value={filters.sortBy}
                  onChange={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}
                />

                {/* Mobile Filter Trigger (top) */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden p-2 rounded-lg border flex items-center gap-2"
                  style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#1f2937' }}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filters</span>
                </button>
              </div>
            </div>
            {/* Unified Filter Chips Row - COMMENTED OUT AS PER USER REQUEST (Only for Shop Page) */}
            {/* <div className="flex flex-wrap items-center gap-3 mb-6">
              {(['All', 'Canvas', '2-Set', '3-Set', 'Square'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setActiveFilter(opt)}
                  className="px-4 py-2 rounded-full border text-sm transition"
                  style={{
                    backgroundColor: activeFilter === opt ? '#14b8a6' : 'white',
                    color: activeFilter === opt ? 'white' : '#374151',
                    borderColor: activeFilter === opt ? '#14b8a6' : '#d1d5db',
                    fontWeight: 600,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div> */}

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonProductCard key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>

                <div className="w-full overflow-hidden pb-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 w-full items-stretch">
                    {paginatedProducts.map(product => {
                      const chosenSize = filters.sizes[0] || "";
                      const overridePrice =
                        (activeFilter === 'Canvas' || activeFilter === 'Frame') && chosenSize
                          ? computePriceFor(
                            chosenSize,
                            activeFilter,
                            undefined
                          )
                          : undefined;

                      return (
                        <div key={product.id} className="w-full h-full">
                          <ProductCard
                            product={product}
                            overridePrice={overridePrice}
                            eyeNavigates
                            hideCategory={true}
                            hideColors={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} style={{ height: '1px' }} />

              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products match your filters</p>
                <button
                  onClick={clearFilters}
                  className="premium-btn-white"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-only Filter Sheet */}
      <MobileFilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={() => setShowFilters(false)}
        sortBy={filters.sortBy}
        onSortChange={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}
        categories={DECOR_CATEGORIES}
        selectedCategories={filters.categories || []}
        onToggleCategory={(cat) => setFilters(prev => ({ ...prev, categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat] }))}
        priceMin={filters.priceMin}
        priceMax={filters.priceMax}
        onPriceRangeChange={(min, max) => setFilters(prev => ({ ...prev, priceMin: min, priceMax: max }))}
        priceBounds={{ min: 0, max: 10000 }}
      />

      <button
        onClick={() => setShowFilters(true)}
        className="fixed bottom-6 right-4 md:hidden rounded-full border w-12 h-12 flex items-center justify-center shadow-lg z-50"
        style={{ borderColor: '#334155', backgroundColor: '#0f172a', color: '#e5e7eb' }}
      >
        <span className="sr-only">Filters</span>
        <Filter className="w-5 h-5" />
      </button>

      <Footer />
    </div >
  );
}
