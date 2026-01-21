import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import SkeletonProductCard from '../components/SkeletonProductCard';
import { Filter, X, ChevronDown } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { MobileFilterSheet } from '../components/MobileFilterSheet';

const SORT_OPTIONS = [
    { value: "popular", label: "Most Popular" },
    { value: "newest", label: "Newest" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" }
];

function SortDropdown({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative sort-dropdown z-40">
            <button
                className="border px-4 py-2 rounded-xl font-medium w-full flex items-center justify-between cursor-pointer"
                style={{
                    borderColor: '#d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#374151'
                }}
                onClick={() => setOpen(!open)}
            >
                {SORT_OPTIONS.find(o => o.value === value)?.label}
                <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className="absolute left-0 top-full mt-2 w-full rounded-xl shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-sm"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #f3f4f6'
                    }}
                >
                    <div className="py-1">
                        {SORT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className="flex items-center justify-between w-full px-6 py-2 text-sm text-left transition-colors duration-150"
                                style={{
                                    backgroundColor: value === opt.value ? '#f0fdfa' : 'transparent',
                                    color: value === opt.value ? '#14b8a6' : '#374151',
                                    fontWeight: value === opt.value ? 600 : 400
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== opt.value) {
                                        e.currentTarget.style.backgroundColor = '#f8fafc';
                                        e.currentTarget.style.color = '#14b8a6';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== opt.value) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#374151';
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

const LAYOUT_OPTIONS = ['Portrait', 'Square', 'Landscape'];

// Spiritual Art categories only
const SPIRITUAL_CATEGORIES = [
    'Vastu Yatra Painting',
    'Ganesh Wall Art',
    'Radha Krishna Art',
    'Vishnu Art',
    'Buddha Painting',
    'Shiva Mahdev Art',
    'Ma Durga Art',
    'Jesus Art',
    'Islamic Art'
];

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

export default function SpiritualArtGalleryPage() {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter only spiritual products - check both categories array and legacy category field
    const spiritualProducts = useMemo(() => {
        return products.filter(p => {
            const productCategories = p.categories && p.categories.length > 0
                ? p.categories
                : (p.category ? [p.category] : []);
            return productCategories.some(cat => SPIRITUAL_CATEGORIES.includes(cat));
        });
    }, [products]);

    const shuffledProducts = useMemo(() => shuffleArray(spiritualProducts), [spiritualProducts]);

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
        layout: true,
        categories: true,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 12;
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const [filters, setFilters] = useState({
        layouts: [] as string[],
        categories: [] as string[],
        priceMin: 0,
        priceMax: 10000,
        sortBy: 'popular',
    });

    const [activeFilter, setActiveFilter] = useState<string>('All');

    useEffect(() => {
        fetchProducts();

        const category = searchParams.get('category');
        const sort = searchParams.get('sort');

        setFilters(prev => ({
            ...prev,
            categories: category ? [category] : prev.categories,
            sortBy: sort || prev.sortBy
        }));
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

    const getCategoryCounts = () => {
        const counts: { [key: string]: number } = {};
        spiritualProducts.forEach(p => {
            const productCategories = p.categories && p.categories.length > 0
                ? p.categories
                : (p.category ? [p.category] : []);

            productCategories.forEach(cat => {
                counts[cat] = (counts[cat] || 0) + 1;
            });
        });
        return counts;
    };
    const categoryCounts = useMemo(() => getCategoryCounts(), [spiritualProducts]);

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
            layouts: [],
            categories: [],
            priceMin: 0,
            priceMax: 10000,
            sortBy: 'popular',
        });
    };

    const activeFilterCount = filters.layouts.length + filters.categories.length;

    const filteredProducts = useMemo(() => {
        let result = [...shuffledProducts];

        if (filters.layouts.length > 0) {
            result = result.filter(p => filters.layouts.includes(p.layout || ''));
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
                {/* HERO HEADER */}
                <section className="mx-auto sm:px-6 mb-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="premium-card-glow p-8 sm:p-12 animate-fade-scale">
                            <h1 className="text-center custom-heading">
                                Spiritual <span className="text-gradient-teal">Art Gallery</span>
                            </h1>
                            <p className="text-center max-w-3xl mx-auto italic text-base sm:text-lg" style={{ color: "#4b5563" }}>
                                Sacred art to bring divine energy and peace to your space.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="flex gap-8 items-stretch">
                    {/* Filters Sidebar */}
                    <div className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-64 lg:flex-shrink-0`}>
                        {/* Mobile Overlay */}
                        <div
                            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => setShowFilters(false)}
                        ></div>

                        {/* Filter Panel */}
                        <div
                            className=" max-lg:fixed max-lg:inset-0 max-lg:overflow-y-auto max-lg:top-0 lg:rounded-3xl max-lg:rounded-none shadow-2xl flex flex-col z-20 custom-scrollbar lg:bg-white/100 lg:backdrop-blur-md max-lg:bg-white max-lg:w-full max-lg:h-full"
                            style={{ border: '1px solid #e5e7eb' }}
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
                                {/* Category Filter - Spiritual Categories Only */}
                                <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                                    <button
                                        onClick={() => toggleSection('categories')}
                                        className="flex items-center justify-between w-full mb-3 transition px-2 py-1 bg-teal rounded-lg"
                                        style={{ fontWeight: 700, color: '#1f2937' }}
                                    >
                                        <h3 className="text-white">Categories</h3>
                                        <ChevronDown
                                            className={`w-4 h-4 transition-transform ${expandedSections.categories ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {expandedSections.categories && (
                                        <div className="space-y-2">
                                            {SPIRITUAL_CATEGORIES.map(name => (
                                                <label key={name} className="flex items-center justify-between cursor-pointer group">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={filters.categories.includes(name)}
                                                            onChange={() => toggleFilter('categories', name)}
                                                            className="mr-2"
                                                            style={{ accentColor: '#14b8a6' }}
                                                        />
                                                        <span className="text-sm transition" style={{ color: '#4b5563' }}>
                                                            {name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs" style={{ color: '#94a3b8' }}>({categoryCounts[name] || 0})</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Layout Filter */}
                                <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                                    <button
                                        onClick={() => toggleSection('layout')}
                                        className="flex items-center justify-between w-full mb-3 transition px-2 py-1 bg-teal rounded-lg"
                                        style={{ fontWeight: 700, color: '#1f2937' }}
                                    >
                                        <h3 className="text-white">Layout</h3>
                                        <ChevronDown
                                            className={`w-4 h-4 transition-transform ${expandedSections.layout ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {expandedSections.layout && (
                                        <div className="flex flex-wrap gap-2">
                                            {LAYOUT_OPTIONS.map(layout => (
                                                <button
                                                    key={layout}
                                                    onClick={() => toggleFilter('layouts', layout)}
                                                    className="px-4 py-2 rounded-lg border-2 text-sm transition-all transform active:scale-95"
                                                    style={{
                                                        backgroundColor: filters.layouts.includes(layout) ? '#14b8a6' : 'white',
                                                        color: filters.layouts.includes(layout) ? 'white' : '#374151',
                                                        borderColor: filters.layouts.includes(layout) ? '#14b8a6' : '#d1d5db',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    {layout}
                                                </button>
                                            ))}
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
                                        className="w-full py-3 rounded-lg transition font-semibold"
                                        style={{ backgroundColor: '#ffffff', color: '#1f2937', border: '1px solid #e5e7eb' }}
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
                                    {finalFilteredProducts.length}
                                </span>
                                {" "}products found
                            </p>

                            <div className="flex items-center gap-2 flex-wrap">
                                <SortDropdown
                                    value={filters.sortBy}
                                    onChange={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}
                                />

                                <button
                                    onClick={() => setShowFilters(true)}
                                    className="lg:hidden p-2 rounded-xl border flex items-center gap-2"
                                    style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#1f2937' }}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="text-sm">Filters</span>
                                </button>
                            </div>
                        </div>

                        {/* Mobile-only Filter Sheet */}
                        <MobileFilterSheet
                            isOpen={showFilters}
                            onClose={() => setShowFilters(false)}
                            onApply={() => setShowFilters(false)}
                            sortBy={filters.sortBy}
                            onSortChange={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}
                            categories={SPIRITUAL_CATEGORIES}
                            selectedCategories={filters.categories}
                            onToggleCategory={(cat) => setFilters(prev => ({ ...prev, categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat] }))}
                            priceMin={filters.priceMin}
                            priceMax={filters.priceMax}
                            onPriceRangeChange={(min, max) => setFilters(prev => ({ ...prev, priceMin: min, priceMax: max }))}
                            priceBounds={{ min: 0, max: 10000 }}
                        />

                        {/* Filter Chips - COMMENTED OUT (Only for Shop Page) */}
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
                        </div> */ }

                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <SkeletonProductCard key={i} />
                                ))}
                            </div>
                        ) : finalFilteredProducts.length > 0 ? (
                            <>
                                <div className="w-full overflow-hidden pb-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 w-full items-stretch">
                                        {paginatedProducts.map(product => (
                                            <div key={product.id} className="w-full h-full">
                                                <ProductCard
                                                    product={product}
                                                    eyeNavigates
                                                    hideCategory={true}
                                                    hideColors={true}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div ref={sentinelRef} style={{ height: '1px' }} />
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No products match your filters</p>
                                <button
                                    onClick={clearFilters}
                                    className="premium-btn-white mt-4"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={() => setShowFilters(true)}
                className="fixed bottom-6 right-4 md:hidden rounded-full border w-12 h-12 flex items-center justify-center shadow-lg z-50"
                style={{ borderColor: '#334155', backgroundColor: '#0f172a', color: '#e5e7eb' }}
            >
                <span className="sr-only">Filters</span>
                <Filter className="w-6 h-6" />
            </button>

            <Footer />
        </div>
    );
}
