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

// Categories for New Art Gallery based on user's image
const NEW_ART_CATEGORIES = [
    'Gen Z Art',
    'Living Room Art',
    'Pop Art',
    'Bed Room Art',
    'Graffiti Art',
    'Abstract Art',
    'Bollywood Art',
    'Couple Art',
    'Restaurant and Bar',
];

function SortDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
    category?: string;
    categories?: string[];
    sizes?: string[];
    colors?: string[];
    material?: string;
    createdAt?: string;
    subsection?: '2-Set' | '3-Set' | 'Square';
    format?: 'Rolled' | 'Canvas' | 'Frame';
    frameColor?: 'White' | 'Black' | 'Brown';
}

export default function NewArtGalleryPage() {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const shuffledProducts = useMemo(() => shuffleArray(products), [products]);

    const [filters, setFilters] = useState({
        categories: [] as string[],
        sortBy: 'popular',
    });

    const [expandedSections, setExpandedSections] = useState({
        categories: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section as keyof typeof prev]: !prev[section as keyof typeof prev]
        }));
    };

    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 12;
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const category = searchParams.get('category');
        if (category && NEW_ART_CATEGORIES.includes(category)) {
            setFilters(prev => ({ ...prev, categories: [category] }));
        }
    }, [searchParams]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
                { headers: { Authorization: `Bearer ${publicAnonKey}` } }
            );
            const data = await res.json();
            // Filter only products in New Art Gallery categories (support both categories array and legacy category)
            const filtered = (data.products || []).filter((p: Product) => {
                const productCategories = p.categories && p.categories.length > 0
                    ? p.categories
                    : (p.category ? [p.category] : []);
                return productCategories.some(cat => NEW_ART_CATEGORIES.includes(cat));
            });
            setProducts(filtered);
        } catch (error) {
            console.error('Fetch products error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryCounts = () => {
        const counts: { [key: string]: number } = {};
        products.forEach(p => {
            const productCategories = p.categories && p.categories.length > 0
                ? p.categories
                : (p.category ? [p.category] : []);

            productCategories.forEach(cat => {
                counts[cat] = (counts[cat] || 0) + 1;
            });
        });
        return counts;
    };
    const categoryCounts = useMemo(() => getCategoryCounts(), [products]);

    const toggleFilter = (value: string) => {
        setFilters(prev => {
            const newCategories = prev.categories.includes(value)
                ? prev.categories.filter(v => v !== value)
                : [...prev.categories, value];
            return { ...prev, categories: newCategories };
        });
    };

    const clearFilters = () => {
        setFilters({ categories: [], sortBy: 'popular' });
    };

    const filteredProducts = useMemo(() => {
        let result = [...shuffledProducts];

        if (filters.categories.length > 0) {
            result = result.filter(p => {
                const productCategories = p.categories && p.categories.length > 0
                    ? p.categories
                    : (p.category ? [p.category] : []);
                return productCategories.some(cat => filters.categories.includes(cat));
            });
        }

        switch (filters.sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
                break;
            case 'price-low':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                result.sort((a, b) => b.price - a.price);
                break;
        }

        return result;
    }, [shuffledProducts, filters]);

    const paginatedProducts = useMemo(() => {
        return filteredProducts.slice(0, currentPage * PAGE_SIZE);
    }, [filteredProducts, currentPage]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) {
                setCurrentPage((p) => {
                    const next = p + 1;
                    const maxPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
                    return next <= maxPages ? next : p;
                });
            }
        }, { root: null, rootMargin: '200px', threshold: 0.01 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [filteredProducts.length, PAGE_SIZE]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    return (
        <div className="min-h-screen content-offset premium-bg">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Header */}
                <section className="mx-auto sm:px-6 mb-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="premium-card-glow p-8 sm:p-12 animate-fade-scale">
                            <h1 className="text-center custom-heading">
                                New <span className="text-gradient-teal">Art Gallery</span>
                            </h1>
                            <p className="text-center max-w-3xl mx-auto italic text-base sm:text-lg" style={{ color: "#4b5563" }}>
                                Explore our latest and trending art collection.
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
                            className="
                max-lg:fixed max-lg:inset-0 max-lg:overflow-y-auto max-lg:top-0
                lg:rounded-3xl max-lg:rounded-none
                shadow-2xl flex flex-col z-20 custom-scrollbar
                lg:bg-white/100 lg:backdrop-blur-md
                max-lg:bg-white max-lg:w-full max-lg:h-full
              "
                            style={{ border: '1px solid #e5e7eb' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg lg:hidden">
                                        <Filter className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold" style={{ color: '#1f2937' }}>Filters</h2>
                                    {filters.categories.length > 0 && (
                                        <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                            {filters.categories.length}
                                        </span>
                                    )}
                                </div>
                                <button onClick={() => setShowFilters(false)} className="lg:hidden p-2 rounded-full transition">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                                {/* Category Filter */}
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
                                            {NEW_ART_CATEGORIES.map(cat => {
                                                const isChecked = filters.categories.includes(cat);
                                                return (
                                                    <label key={cat} className="flex items-center justify-between cursor-pointer group">
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleFilter(cat)}
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

                                {/* Clear Filters */}
                                {filters.categories.length > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="w-full py-3 px-4 rounded-xl font-semibold transition"
                                        style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowFilters(true)}
                                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition"
                                    style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#374151' }}
                                >
                                    <Filter className="w-5 h-5" />
                                    Filters
                                    {filters.categories.length > 0 && (
                                        <span className="bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full">
                                            {filters.categories.length}
                                        </span>
                                    )}
                                </button>
                                <p className="text-sm" style={{ color: '#6b7280' }}>
                                    Showing <span className="font-semibold" style={{ color: '#374151' }}>{filteredProducts.length}</span> products
                                </p>
                            </div>
                            <SortDropdown value={filters.sortBy} onChange={(v) => setFilters(prev => ({ ...prev, sortBy: v }))} />
                        </div>

                        {/* Products Grid */}
                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {[...Array(8)].map((_, i) => <SkeletonProductCard key={i} />)}
                            </div>
                        ) : paginatedProducts.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-500 text-lg">No products found in this category</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {paginatedProducts.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                                <div ref={sentinelRef} className="h-10" />
                            </>
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
                categories={NEW_ART_CATEGORIES}
                selectedCategories={filters.categories}
                onToggleCategory={(cat) => setFilters(prev => ({ ...prev, categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat] }))}
            />

            <Footer />
        </div>
    );
}
