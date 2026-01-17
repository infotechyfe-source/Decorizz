import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { optimizeImage } from "../utils/optimizeImage";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { SEO } from "../components/SEO";
import { Star, Leaf, Palette, Brush, ShieldCheck, Play, Frame, Image as ImageIcon, LayoutGrid, Square, Circle as CircleIcon, Layers, Home, Bed, Briefcase, Baby, ChefHat, BookOpen, Dumbbell, Car, Wine, ArrowRight, Sparkles, TrendingUp, Tag } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { isYouTubeUrl, getYouTubeId, isGoogleDriveUrl, getDriveEmbedUrl, getDriveDirectVideoUrl } from "../utils/video";
import { useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { useCategoryImages } from "../utils/useCategoryImages";
import { OfferPopup } from "../components/OfferPopup";

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "../components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  createdAt?: string;
  colors?: string[];
  sizes?: string[];
  roomCategory?: string;
}

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  profileImage?: string;
}

interface VideoItem {
  id: string;
  title: string;
  url: string;
  caption?: string;
  thumbnail?: string;
  productId?: string | null;
}

export default function HomePage() {
  const heroPlugins = useMemo(() => [Autoplay({ delay: 3000, stopOnInteraction: false })], []);
  const bestPlugins = useMemo(() => [Autoplay({ delay: 3000, stopOnInteraction: false })], []);
  const latestPlugins = useMemo(() => [Autoplay({ delay: 3500, stopOnInteraction: false })], []);
  const watchPlugins = useMemo(() => [Autoplay({ delay: 3000, stopOnInteraction: false })], []);
  const testimonialPlugins = useMemo(() => [Autoplay({ delay: 4000, stopOnInteraction: false })], []);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestProducts, setBestProducts] = useState<Product[]>([]);
  const [premiumProducts, setPremiumProducts] = useState<Product[]>([]);
  const [homeNewProducts, setHomeNewProducts] = useState<Product[]>([]);
  const [budgetProducts, setBudgetProducts] = useState<Product[]>([]);
  const [bestStart, setBestStart] = useState(0);
  const [premiumStart, setPremiumStart] = useState(0);
  const [homeNewStart, setHomeNewStart] = useState(0);
  const [budgetStart, setBudgetStart] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroApi, setHeroApi] = useState<CarouselApi | null>(null);
  const [formatFilter, setFormatFilter] = useState<'All' | 'Rolled' | 'Canvas' | 'Frame'>('All');
  const [bestApi, setBestApi] = useState<CarouselApi | null>(null);
  const [bestSelected, setBestSelected] = useState(0);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [testApi, setTestApi] = useState<CarouselApi | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [watchVideos, setWatchVideos] = useState<VideoItem[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [justInApi, setJustInApi] = useState<CarouselApi | null>(null);
  const [justInSelected, setJustInSelected] = useState(0);
  const [watchApi, setWatchApi] = useState<CarouselApi | null>(null);
  const [roomImages, setRoomImages] = useState<Record<string, { name: string; image: string }>>({});


  const computeTags = () => {
    const words = new Set<string>();
    featuredProducts.forEach((p: any) => {
      (p.name || '').split(/\s+/).forEach((w: string) => {
        const clean = w.replace(/[^A-Za-z]/g, '');
        const pick = clean.toLowerCase();
        const allow = ['lion', 'zebra', 'owl', 'rama', 'virat', 'horses', 'canvas', 'frame', 'black'];
        if (allow.includes(pick)) words.add(clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase());
      });
    });
    const list = Array.from(words);
    return list.length ? list.slice(0, 6) : ['Lion', 'Black', 'Rama', 'Owl', 'Virat', 'Horses'];
  };
  const tags = computeTags();

  // Removed obsolete fetchHomeData useEffect; data fetching now handled by fetchAllData effect.

  useEffect(() => {
    AOS.init({
      duration: 600, // Reduced for snappier feel
      once: true,
      throttleDelay: 100, // Throttle scroll events for performance
      offset: 50, // Trigger animations earlier
      easing: 'ease-out-cubic', // Smoother easing
      disable: window.innerWidth < 480 ? 'phone' : false, // Disable on very small screens
    });
  }, []);

  // Removed AOS.refresh() - with once:true set, animations run only once and don't need refresh

  // Load cached data immediately on mount for instant display
  useEffect(() => {
    try {
      const cachedProducts = localStorage.getItem('home_products');
      const cachedTestimonials = localStorage.getItem('home_testimonials');
      const cachedVideos = localStorage.getItem('home_videos');
      const cachedFaqs = localStorage.getItem('home_faqs');

      if (cachedProducts) {
        const products = JSON.parse(cachedProducts);
        setFeaturedProducts(products.featured || []);
        setNewProducts(products.newest || []);
        setLoading(false); // Show cached data immediately
      }
      if (cachedTestimonials) setTestimonials(JSON.parse(cachedTestimonials));
      if (cachedVideos) setWatchVideos(JSON.parse(cachedVideos));
      if (cachedFaqs) {
        setFaqs(JSON.parse(cachedFaqs));
        setFaqsLoading(false);
      }
      const cachedRoomImages = localStorage.getItem('home_room_images');
      if (cachedRoomImages) setRoomImages(JSON.parse(cachedRoomImages));
    } catch (e) {
      console.log('Cache read error:', e);
    }
  }, []);

  // Combined data fetching with parallel requests and abort support
  const fetchAllData = useCallback(async (signal: AbortSignal) => {
    try {
      const [productsRes, bestRes, premiumRes, homeNewRes, budgetRes, testimonialsRes, videosRes, faqsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal,
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/home-section/best`, { signal }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/home-section/premium`, { signal }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/home-section/new`, { signal }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/home-section/budget`, { signal }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal,
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal,
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs`, { signal }),
      ]);

      // Products
      const productsData = await productsRes.json();
      const featured = productsData.products?.slice(0, 20) || [];
      setFeaturedProducts(featured);
      const bestData = await bestRes.json();
      const premiumData = await premiumRes.json();
      const homeNewData = await homeNewRes.json();
      const budgetData = await budgetRes.json();
      setBestProducts(bestData.products || []);
      setPremiumProducts(premiumData.products || []);
      setHomeNewProducts(homeNewData.products || []);
      setBudgetProducts(budgetData.products || []);
      const allProducts: Product[] = productsData.products || [];
      const sortedNew = [...allProducts].sort((a: any, b: any) => {
        const ta = a.createdAt || a.created_at ? new Date(a.createdAt || a.created_at).getTime() : 0;
        const tb = b.createdAt || b.created_at ? new Date(b.createdAt || b.created_at).getTime() : 0;
        return tb - ta;
      });
      const newest = sortedNew.slice(0, 20);
      setNewProducts(newest);

      // Cache products for instant loading next time
      try {
        localStorage.setItem('home_products', JSON.stringify({ best: bestData.products || [], featured, newest, premium: premiumData.products || [], newsec: homeNewData.products || [], budget: budgetData.products || [] }));
      } catch (e) { }

      // Extract room images from products with roomCategory
      const roomImagesMap: Record<string, { name: string; image: string }> = {};
      allProducts.forEach((p: any) => {
        if (p.roomCategory && p.image && !roomImagesMap[p.roomCategory]) {
          roomImagesMap[p.roomCategory] = { name: p.roomCategory, image: p.image };
        }
      });
      setRoomImages(roomImagesMap);
      try {
        localStorage.setItem('home_room_images', JSON.stringify(roomImagesMap));
      } catch (e) { }

      // Testimonials
      const testimonialsData = await testimonialsRes.json();
      const testimonialsSlice = testimonialsData.testimonials?.slice(0, 4) || [];
      setTestimonials(testimonialsSlice);
      try { localStorage.setItem('home_testimonials', JSON.stringify(testimonialsSlice)); } catch (e) { }

      let videosList: VideoItem[] = [];
      try {
        const [authRes, pubRes] = await Promise.all([
          videosRes,
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`, { signal }),
        ]);
        if (authRes.ok) {
          const jd = await authRes.json();
          videosList = jd.videos || jd.items || [];
        }
        if (!videosList.length && pubRes.ok) {
          const jd2 = await pubRes.json();
          videosList = jd2.videos || jd2.items || [];
        }
      } catch (e) { }
      const videosSlice = (videosList || []).slice(0, 10);
      setWatchVideos(videosSlice);
      try { localStorage.setItem('home_videos', JSON.stringify(videosSlice)); } catch (e) { }

      // FAQs
      const faqsData = await faqsRes.json();
      const faqsList = faqsData.faqs || [];
      setFaqs(faqsList);
      try { localStorage.setItem('home_faqs', JSON.stringify(faqsList)); } catch (e) { }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Homepage fetch error:", error);
      }
    } finally {
      setLoading(false);
      setFaqsLoading(false);
    }
  }, []);

  // Initial load with abort handling
  useEffect(() => {
    const controller = new AbortController();
    fetchAllData(controller.signal);
    return () => controller.abort();
  }, [fetchAllData]);

  // Remove separate fetchFaqs useEffect – FAQs are now loaded in fetchAllData

  // fetchFaqs and its useEffect removed; FAQs are now fetched in fetchAllData.



  useEffect(() => {
    if (!bestApi) return;

    const onSelect = () => {
      setBestSelected(bestApi.selectedScrollSnap());
    };

    bestApi.on("select", onSelect);

    return () => {
      bestApi.off("select", onSelect);
    };
  }, [bestApi]);
  useEffect(() => {
    if (!justInApi) return;
    const onSelect = () => {
      setJustInSelected(justInApi.selectedScrollSnap());
    };
    justInApi.on("select", onSelect);
    return () => {
      justInApi.off("select", onSelect);
    };
  }, [justInApi]);

  const bestSellerRef = React.useRef<HTMLDivElement | null>(null);

  const scrollBestSellerLeft = () => {
    if (!bestSellerRef.current) return;
    const { clientWidth } = bestSellerRef.current;
    bestSellerRef.current.scrollBy({ left: -clientWidth, behavior: "smooth" });
  };

  const scrollBestSellerRight = () => {
    if (!bestSellerRef.current) return;
    const { clientWidth } = bestSellerRef.current;
    bestSellerRef.current.scrollBy({ left: clientWidth, behavior: "smooth" });
  };

  const [viewportW, setViewportW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { getImage: getCategoryImage } = useCategoryImages();
  const heroImagesDesktop = (newProducts.length ? newProducts : featuredProducts).slice(0, 2).map((p) => optimizeImage(p.image, 1200));
  const heroImagesMobile = (newProducts.length ? newProducts : featuredProducts).slice(0, 2).map((p) => optimizeImage(p.image, 800));

  const heroImages = viewportW < 768 ? heroImagesMobile : heroImagesDesktop;

  const windowSlice = (arr: Product[], start: number, count: number) => {
    const n = arr.length;
    const out: Product[] = [];
    if (n === 0) return out;
    const c = Math.min(count, n);
    for (let i = 0; i < c; i++) out.push(arr[(start + i) % n]);
    return out;
  };
  const isMobile = viewportW < 768;
  const bestVisible = windowSlice(bestProducts, bestStart, isMobile ? 2 : 4);
  const premiumVisible = windowSlice(premiumProducts, premiumStart, isMobile ? 2 : 4);
  const newVisible = windowSlice(homeNewProducts, homeNewStart, isMobile ? 2 : 4);
  const budgetVisible = windowSlice(budgetProducts, budgetStart, isMobile ? 2 : 4);

  return (
    <main className="min-h-screen content-offset" role="main">
      <SEO
        title="Premium Wall Frames & Canvas Art | 300+ Modern Designs"
        description="Discover 300+ premium wall frames and canvas art for your home decor. Ethically sourced, handcrafted by skilled artisans. Shop modern, contemporary designs."
        url="/"
      />
      <OfferPopup />
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section" aria-label="Hero Banner">
        {/* Floating Decorative Elements */}
        <div className="hero-floating-circle hero-floating-circle-1" aria-hidden="true" />
        <div className="hero-floating-circle hero-floating-circle-2" aria-hidden="true" />
        <div className="hero-floating-circle hero-floating-circle-3" aria-hidden="true" />

        <Carousel
          key={newProducts.length}
          plugins={heroPlugins}
          opts={{
            loop: true,
            align: "center",
            slidesToScroll: 1,
          }}
          setApi={setHeroApi}
          className="w-full"
        >
          <CarouselContent className="ml-0 gap-0">
            {heroImages.map((src, idx) => (
              <CarouselItem key={idx} className="basis-full min-w-full pl-0">
                <div className="relative w-full">
                  <ImageWithFallback
                    src={src}
                    alt={`Premium decorative wall frame collection - Slide ${idx + 1}`}
                    className="hero-image"
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding={idx === 0 ? "auto" : "async"}
                  />
                  <div className="hero-overlay hero-gradient-overlay" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex" aria-label="Previous slide" />
          <CarouselNext className="hidden lg:flex" aria-label="Next slide" />
        </Carousel>

        <div
          className="hero-content"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <div className="p-4 sm:p-8 md:p-16 text-left max-w-2xl">
            {/* Animated Title with staggered lines */}
            <h1
              style={{
                fontSize: 'clamp(2rem, 8vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            >
              <span
                className="hero-text-line-1"
                style={{
                  display: 'block',
                  color: '#3b2f27',
                }}
              >
                Discover
              </span>
              <span
                className="hero-text-line-2"
                style={{
                  display: 'block',
                  fontSize: 'clamp(2.5rem, 10vw, 5rem)',
                  color: '#14b8a6',
                }}
              >
                300+
              </span>
              <span
                className="hero-text-line-3"
                style={{
                  display: 'block',
                  color: '#3b2f27',
                }}
              >
                Modern Frames
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="hero-text-line-3"
              style={{
                fontSize: 'clamp(0.9rem, 3vw, 1.25rem)',
                fontWeight: 500,
                marginTop: '1rem',
                color: '#5c4a3d',
                opacity: 0,
              }}
            >
              {/* Premium Wall Frames & Canvas for Your Home */}
            </p>

            {/* CTA Buttons */}
            {/* <div
              className="flex flex-wrap gap-3 sm:gap-4 mt-6"
              style={{
                animation: 'lineSlideIn 0.6s ease-out 0.8s forwards',
                opacity: 0,
              }}
            >
              <Link
                to="/shop"
                className="hero-cta-btn px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base"
                style={{
                  backgroundColor: '#14b8a6',
                  color: 'white',
                }}
              >
                Shop Now
              </Link>
              <Link
                to="/gallery"
                className="hero-cta-btn px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base"
                style={{
                  backgroundColor: 'transparent',
                  color: '#3b2f27',
                  border: '2px solid #3b2f27',
                }}
              >
                View Gallery
              </Link>
            </div> */}
          </div>
        </div>
      </section>

      {/* Curated Collections Section */}
      <section className="section-collections relative" aria-label="Curated Collections">

        <div className="section-divider-top" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 section-header">
            <h2 className="section-title-themed font-extrabold mb-3 inline-block">
              <span className="text-brand">Curated</span>
              <span className="text-accent"> Collections</span>
            </h2>
            <p className="section-subtitle">Handpicked selections to elevate your lifestyle</p>
          </div>

          {isMobile ? (
            <div className="category-grid">
              <Link to="/spiritual-art-gallery" className="category-card">
                <ImageWithFallback src={optimizeImage((featuredProducts[0]?.image || newProducts[0]?.image || getCategoryImage('Spiritual Art Gallery')), 800)} className="category-card-bg" alt="Spiritual Art Gallery" loading="eager" decoding="async" />
                <div className="category-card-content">
                  <span className="category-title">Spiritual Art Gallery</span>
                </div>
              </Link>
              <Link to="/decor-by-room" className="category-card">
                <ImageWithFallback src={optimizeImage((featuredProducts.slice().sort((a, b) => (b.price || 0) - (a.price || 0))[0]?.image || getCategoryImage('Decor by Room')), 800)} className="category-card-bg" alt="Decor Your Space" loading="eager" decoding="async" />
                <div className="category-card-content">
                  <span className="category-title">Decor Your Space</span>
                </div>
              </Link>
              <Link to="/new-art-gallery" className="category-card">
                <ImageWithFallback src={optimizeImage((newProducts[0]?.image || featuredProducts[1]?.image || getCategoryImage('New Art Gallery')), 800)} className="category-card-bg" alt="New Art Gallery" loading="eager" decoding="async" />
                <div className="category-card-content">
                  <span className="category-title">New Art Gallery</span>
                </div>
              </Link>
              <Link to="/lighting" className="category-card">
                <ImageWithFallback src={optimizeImage((newProducts[2]?.image || featuredProducts[3]?.image || getCategoryImage('Lighting')), 800)} className="category-card-bg" alt="Neon Sign" loading="eager" decoding="async" />
                <div className="category-card-content">
                  <span className="category-title">Neon Sign</span>
                </div>
              </Link>
              <Link to="/acrylic-art-gallery" className="category-card">
                <ImageWithFallback src={optimizeImage((newProducts[3]?.image || featuredProducts[4]?.image || getCategoryImage('Acrylic Art Gallery')), 800)} className="category-card-bg" alt="Acrylic Art Gallery" loading="eager" decoding="async" />
                <div className="category-card-content">
                  <span className="category-title">Acrylic Art Gallery</span>
                </div>
              </Link>
              <Link to="/shop?sort=price-low" className="category-card">
                <ImageWithFallback src={optimizeImage((newProducts.slice().sort((a, b) => (a.price || 0) - (b.price || 0))[0]?.image || featuredProducts.slice().sort((a, b) => (a.price || 0) - (b.price || 0))[0]?.image || getCategoryImage('Budget')), 800)} className="category-card-bg" alt="Budget Friendly" loading="eager" decoding="async" />
                <div className="category-card-content">
                  <span className="category-title">Budget Finds</span>
                </div>
              </Link>
            </div>
          ) : (
            <div className="collection-grid grid grid-cols-3 gap-6">
              {/* Spiritual Art Gallery */}
              <Link to="/spiritual-art-gallery" className="collection-card home-card">
                <ImageWithFallback
                  src={optimizeImage((featuredProducts[0]?.image || newProducts[0]?.image || getCategoryImage('Spiritual Art Gallery')), 800)}
                  alt="Spiritual Art Gallery"
                  loading="eager"
                  decoding="async"
                  className="collection-card-bg"
                />
                <div className="collection-card-content">
                  <span className="collection-badge">Featured</span>
                  <span className="collection-title">Spiritual Art Gallery</span>
                  <span className="collection-desc">Serene devotional designs to inspire calm.</span>
                  <div className="collection-cta">
                    Explore Spiritual <ArrowRight size={16} />
                  </div>
                </div>
              </Link>

              {/* Decor Your Space */}
              <Link to="/decor-by-room" className="collection-card home-card">
                <ImageWithFallback
                  src={optimizeImage((featuredProducts.slice().sort((a, b) => (b.price || 0) - (a.price || 0))[0]?.image || getCategoryImage('Decor by Room')), 800)}
                  alt="Decor Your Space"
                  loading="eager"
                  decoding="async"
                  className="collection-card-bg"
                />
                <div className="collection-card-content">
                  <span className="collection-badge">Rooms</span>
                  <span className="collection-title">Decor Your Space</span>
                  <span className="collection-desc">Curated frames for every room and mood.</span>
                  <div className="collection-cta">
                    Decor Now <Sparkles size={16} />
                  </div>
                </div>
              </Link>

              {/* New Art Gallery */}
              <Link to="/new-art-gallery" className="collection-card home-card">
                <ImageWithFallback
                  src={optimizeImage((newProducts[0]?.image || featuredProducts[1]?.image || getCategoryImage('New Art Gallery')), 800)}
                  alt="New Art Gallery"
                  loading="eager"
                  decoding="async"
                  className="collection-card-bg"
                />
                <div className="collection-card-content">
                  <span className="collection-badge">Latest</span>
                  <span className="collection-title">New Art Gallery</span>
                  <span className="collection-desc">Fresh arrivals and trending picks.</span>
                  <div className="collection-cta">
                    See New <TrendingUp size={16} />
                  </div>
                </div>
              </Link>


              <Link to="/lighting" className="collection-card home-card">
                <ImageWithFallback
                  src={optimizeImage((newProducts[2]?.image || featuredProducts[3]?.image || getCategoryImage('Lighting')), 800)}
                  alt="Neon Sign"
                  loading="eager"
                  decoding="async"
                  className="collection-card-bg"
                />
                <div className="collection-card-content">
                  <span className="collection-badge">Vibrant</span>
                  <span className="collection-title">Neon Sign</span>
                  <span className="collection-desc">Bright, bold decor and signboards.</span>
                  <div className="collection-cta">
                    Shop Neon <TrendingUp size={16} />
                  </div>
                </div>
              </Link>

              <Link to="/acrylic-art-gallery" className="collection-card home-card">
                <ImageWithFallback
                  src={optimizeImage((newProducts[3]?.image || featuredProducts[4]?.image || getCategoryImage('Acrylic Art Gallery')), 800)}
                  alt="Acrylic Art Gallery"
                  loading="eager"
                  decoding="async"
                  className="collection-card-bg"
                />
                <div className="collection-card-content">
                  <span className="collection-badge">Premium</span>
                  <span className="collection-title">Acrylic Art Gallery</span>
                  <span className="collection-desc">Exquisite acrylic frames with clarity.</span>
                  <div className="collection-cta">
                    Explore Acrylic <TrendingUp size={16} />
                  </div>
                </div>
              </Link>

              {/* Budget Friendly */}
              <Link to="/shop?sort=price-low" className="collection-card home-card">
                <ImageWithFallback
                  src={optimizeImage((newProducts.slice().sort((a, b) => (a.price || 0) - (b.price || 0))[0]?.image || featuredProducts.slice().sort((a, b) => (a.price || 0) - (b.price || 0))[0]?.image || getCategoryImage('Budget')), 800)}
                  alt="Budget Friendly"
                  loading="eager"
                  decoding="async"
                  className="collection-card-bg"
                />
                <div className="collection-card-content">
                  <span className="collection-badge">Value</span>
                  <span className="collection-title">Budget Finds</span>
                  <span className="collection-desc">Quality decor that fits your budget perfectly.</span>
                  <div className="collection-cta">
                    Shop Deals <Tag size={16} />
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="section-collections relative bg-[#faf7f4]" aria-label="Best Sellers">
        <div className="mb-6 max-w-7xl mx-auto px-4 sm:px-0">
          <div className="section-header text-center mb-6">
            <h2 className="section-title-themed font-extrabold mb-3 inline-block">
              <span className="text-brand">Best</span>
              <span className="text-accent"> Sellers</span>
            </h2>
            <div className="flex items-center justify-between">
              {!isMobile && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setBestStart(s => { const len = bestProducts.length || 1; return (s + len - 1) % len; })} aria-label="Previous" className="p-2 rounded bg-white border border-slate-200 cursor-pointer">◀</button>
                  <button onClick={() => setBestStart(s => { const len = bestProducts.length || 1; return (s + 1) % len; })} aria-label="Next" className="p-2 rounded bg-white border border-slate-200 ml-250 cursor-pointer">▶</button>
                </div>
              )}
            </div>
          </div>
          {isMobile ? (
            <div className="category-grid-row" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
              {bestProducts.map((p: any) => (
                <Link key={p.id} to={`/product/${(p.category || 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(p.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden" style={{ width: 240, scrollSnapAlign: 'start' }}>
                  <div className="w-full overflow-hidden bg-gray-100 rounded-t-2xl" style={{ height: 280 }}>
                    <ImageWithFallback src={optimizeImage(p.image, 800)} alt={p.name} className="w-full h-full object-cover" loading="eager" decoding="async" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{p.name}</h3>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 line-through">
                          ₹{Math.round(Number(p.price || 0) * 1.15).toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-gray-900">₹{Number(p.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-green-600 text-[10px] font-medium">Save 15%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {bestVisible.map((p: any) => (
                <ProductCard key={p.id} product={p} hideCategory imageHeight={280} />
              ))}
            </div>
          )}
          <div className="flex justify-center mt-8">
            <Link to="/shop?sort=popular" className="px-8 py-3 rounded-xl font-bold" style={{ backgroundColor: '#14b8a6', color: '#fff', textTransform: 'uppercase' }}>View All</Link>
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="section-category relative" aria-label="Shop by Category">
        <div className="section-divider-top" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14 section-header">
            <h2 className="section-title-themed font-extrabold mb-4 inline-block">
              <span className="text-brand">Shop by</span>
              <span className="text-accent"> Category</span>
            </h2>
            <p className="section-subtitle mt-3">Find the perfect frame style for your space</p>
          </div>

          <div className="category-grid scrollbar-hide">
            {[
              // { name: 'Canvas', icon: ImageIcon, link: '/shop?format=Canvas' },
              { name: 'Circle', icon: CircleIcon, link: '/shop?subsection=Circle' },
              // { name: 'Landscape', icon: Frame, link: '/shop?subsection=Landscape' },
              { name: '2-Set', icon: Layers, link: '/shop?subsection=2-Set' },
              { name: '3-Set', icon: LayoutGrid, link: '/shop?subsection=3-Set' },
              { name: 'Square', icon: Square, link: '/shop?subsection=Square' },
            ].map((cat, idx) => (
              <Link
                key={cat.name}
                to={cat.link}
                className="category-card"
              >
                {(() => {
                  const candidate = getCategoryImage(cat.name);
                  const isPlaceholder = !candidate || candidate.includes('placehold.co');
                  let altSrc = candidate;
                  if (isPlaceholder) {
                    const fromFeatured = featuredProducts.find((p) => (cat.name === 'Canvas' ? p.format?.toLowerCase() === 'canvas' : cat.name === 'Landscape' ? p.layout?.toLowerCase() === 'landscape' : cat.name === 'Square' ? p.layout?.toLowerCase() === 'square' : cat.name === 'Circle' ? p.subsection?.toLowerCase() === 'circle' : cat.name === '2-Set' ? (p.subsection?.toLowerCase() === '2-set' || p.subsection?.toLowerCase() === '2 set') : cat.name === '3-Set' ? (p.subsection?.toLowerCase() === '3-set' || p.subsection?.toLowerCase() === '3 set') : false));
                    altSrc = fromFeatured?.image || newProducts.find((p) => (cat.name === 'Canvas' ? p.format?.toLowerCase() === 'canvas' : cat.name === 'Landscape' ? p.layout?.toLowerCase() === 'landscape' : cat.name === 'Square' ? p.layout?.toLowerCase() === 'square' : cat.name === 'Circle' ? p.subsection?.toLowerCase() === 'circle' : cat.name === '2-Set' ? (p.subsection?.toLowerCase() === '2-set' || p.subsection?.toLowerCase() === '2 set') : cat.name === '3-Set' ? (p.subsection?.toLowerCase() === '3-set' || p.subsection?.toLowerCase() === '3 set') : false))?.image || candidate;
                  }
                  return (
                    <ImageWithFallback src={optimizeImage(altSrc, 800)} className="category-card-bg" alt={cat.name} loading="eager" decoding="async" />
                  );
                })()}
                <div className="category-card-content">
                  <cat.icon className="category-icon" />
                  <span className="category-title">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      {/* Premium Collection */}
      <section className="section-collections relative bg-[#fef3c7]" aria-label="Premium Collection">
        <div className="mb-6 max-w-7xl mx-auto px-4 sm:px-0">
          <div className="section-header text-center mb-6">
            <h2 className="section-title-themed font-extrabold mb-3 inline-block">
              <span className="text-brand">Premium</span>
              <span className="text-accent"> Collection</span>
            </h2>
            <div className="flex items-center justify-between">
              {!isMobile && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setPremiumStart(s => (s + (premiumProducts.length || 1) - 1) % (premiumProducts.length || 1))} aria-label="Previous" className="p-2 rounded bg-white border border-slate-200 cursor-pointer">◀</button>
                  <button onClick={() => setPremiumStart(s => (s + 1) % (premiumProducts.length || 1))} aria-label="Next" className="p-2 rounded bg-white border border-slate-200 ml-250 cursor-pointer">▶</button>
                </div>
              )}
            </div>
          </div>
          {isMobile ? (
            <div className="category-grid-row" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
              {premiumProducts.map((p: any) => (
                <Link key={p.id} to={`/product/${(p.category || 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(p.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden" style={{ width: 240, scrollSnapAlign: 'start' }}>
                  <div className="w-full overflow-hidden bg-gray-100 rounded-t-2xl" style={{ height: 280 }}>
                    <ImageWithFallback src={optimizeImage(p.image, 800)} alt={p.name} className="w-full h-full object-cover" loading="eager" decoding="async" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{p.name}</h3>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 line-through">
                          ₹{Math.round(Number(p.price || 0) * 1.15).toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-gray-900">₹{Number(p.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-green-600 text-[10px] font-medium">Save 15%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {premiumVisible.map((p: any) => (
                <ProductCard key={p.id} product={p} hideCategory imageHeight={280} />
              ))}
            </div>
          )}
          <div className="flex justify-center mt-8">
            <Link to="/shop?sort=price_high" className="px-8 py-3 rounded-xl font-bold" style={{ backgroundColor: '#14b8a6', color: '#fff', textTransform: 'uppercase' }}>View All</Link>
          </div>
        </div>
      </section>

      {/* Decor by Room Section */}
      <section className="section-room relative" aria-label="Decor by Room">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14 section-header">
            <h2 className="section-title-themed font-extrabold mb-4 inline-block">
              <span className="text-brand">Decor by</span>
              <span className="text-accent"> Room</span>
            </h2>
            <p className="section-subtitle mt-3">Explore frames designed for every corner of your home</p>
          </div>

          {isMobile ? (
            <div className="category-grid scrollbar-hide">
              {[
                { name: 'Wall Art', icon: Home },
                { name: 'Bedroom', icon: Bed },
                { name: 'Office / Study Zone', icon: Briefcase },
                { name: 'Kids Space', icon: Baby },
                { name: 'Natural Art', icon: ChefHat },
                { name: 'Home Bar', icon: BookOpen },
              ].map((room) => {
                const ROOM_CATEGORY_MAP: Record<string, string> = {
                  'Wall Art': 'Wall Art',
                  'Bedroom': 'Boho Art',
                  'Office / Study Zone': 'Office Canvas Art',
                  'Kids Space': 'Animals Art',
                  'Natural Art': 'Natural Art',
                  'Pooja Room': 'Mandela Art',
                };
                const categoryKey = ROOM_CATEGORY_MAP[room.name] || 'Wall Art';
                const dbRoom = roomImages[room.name]?.image;
                const imgSrc = dbRoom || getCategoryImage(categoryKey);
                return (
                  <Link key={room.name} to={`/decor-by-room?room=${encodeURIComponent(room.name)}`} className="category-card">
                    <ImageWithFallback src={optimizeImage(imgSrc, 800)} className="category-card-bg" alt={room.name} loading="eager" decoding="async" />
                    <div className="category-card-content">
                      <room.icon className="category-icon" />
                      <span className="category-title">{room.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="room-grid">
              {[
                { name: 'Wall Art', icon: Home },
                { name: 'Bedroom', icon: Bed },
                { name: 'Office / Study Zone', icon: Briefcase },
                { name: 'Kids Space', icon: Baby },
                { name: 'Natural Art', icon: ChefHat },
                { name: 'Home Bar', icon: BookOpen },
              ].map((room, idx) => {
                const ROOM_CATEGORY_MAP: Record<string, string> = {
                  'Wall Art': 'Wall Art',
                  'Bedroom': 'Boho Art',
                  'Office / Study Zone': 'Office Canvas Art',
                  'Kids Space': 'Animals Art',
                  'Natural Art': 'Natural Art',
                  'Pooja Room': 'Mandela Art',
                };
                const categoryKey = ROOM_CATEGORY_MAP[room.name] || 'Wall Art';
                const dbRoom = roomImages[room.name]?.image;
                const imgSrc = dbRoom || getCategoryImage(categoryKey);
                return (
                  <Link key={room.name} to={`/decor-by-room?room=${encodeURIComponent(room.name)}`} className="room-card">
                    <ImageWithFallback src={optimizeImage(imgSrc, 800)} className="room-card-bg" alt={room.name} loading="eager" decoding="async" />
                    <div className="room-card-content">
                      <div className="inline-block p-2 rounded-full bg-white/20 backdrop-blur-sm mb-2">
                        <room.icon className="room-icon" />
                      </div>
                      <span className="room-title">{room.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="section-collections relative bg-[#e0f2fe]" aria-label="New Arrivals">
        <div className="mb-6 max-w-7xl mx-auto px-4 sm:px-0">
          <div className="section-header text-center mb-6">
            <h2 className="section-title-themed font-extrabold mb-3 inline-block">
              <span className="text-brand">New</span>
              <span className="text-accent"> Arrivals</span>
            </h2>
            <div className="flex items-center justify-between">

              {!isMobile && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setHomeNewStart(s => (s + (homeNewProducts.length || 1) - 1) % (homeNewProducts.length || 1))} aria-label="Previous" className="p-2 rounded bg-white border border-slate-200 cursor-pointer">◀</button>
                  <button onClick={() => setHomeNewStart(s => (s + 1) % (homeNewProducts.length || 1))} aria-label="Next" className="p-2 rounded bg-white border border-slate-200 ml-250 cursor-pointer">▶</button>
                </div>
              )}
            </div>
          </div>
          {isMobile ? (
            <div className="category-grid-row" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
              {
                homeNewProducts.map((p: any) => (
                  <Link key={p.id} to={`/product/${(p.category || 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(p.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden" style={{ width: 240, scrollSnapAlign: 'start' }}>
                    <div className="w-full overflow-hidden bg-gray-100 rounded-t-2xl" style={{ height: 280 }}>
                      <ImageWithFallback src={optimizeImage(p.image, 800)} alt={p.name} className="w-full h-full object-cover" loading="eager" decoding="async" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{p.name}</h3>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400" style={{ textDecoration: 'line-through' }}>₹{Math.round(Number(p.price || 0) * 1.15).toLocaleString('en-IN')}</span>
                          <span className="text-sm text-gray-900">₹{Number(p.price || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-green-600 text-[10px] font-medium">Save 15%</span>
                      </div>
                    </div>
                  </Link>
                ))
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {newVisible.map((p: any) => (
                <ProductCard key={p.id} product={p} hideCategory imageHeight={280} />
              ))}
            </div>
          )}
          <div className="flex justify-center mt-8">
            <Link to="/shop?sort=newest" className="px-8 py-3 rounded-xl font-bold" style={{ backgroundColor: '#14b8a6', color: '#fff', textTransform: 'uppercase' }}>View All</Link>
          </div>
        </div>
      </section>

      {/* Watch & Buy Section - Instagram Reels Style */}
      <section className="section-watch relative py-12 md:py-16" aria-label="Watch and Buy">
        <div className="text-center mb-8 md:mb-12 px-4">
          <h2 className="section-title-themed font-extrabold mb-3 inline-block">
            <span className="text-brand">Watch</span>
            <span className="text-accent"> & Buy</span>
          </h2>
          <p className="section-subtitle">See frames in action and shop the look</p>
        </div>

        {loading ? (
          <>
            {/* Desktop skeleton */}
            <div className="hidden md:flex justify-center max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 animate-pulse rounded-2xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Mobile skeleton */}
            <div className="md:hidden">
              <div className="flex gap-3 overflow-x-auto px-4 pb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 bg-gray-100 animate-pulse rounded-xl overflow-hidden" style={{ width: '140px', aspectRatio: '9/16' }}>
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : watchVideos.length > 0 ? (
          <>
            {/* Desktop View - Grid Layout */}
            <div className="hidden md:flex justify-center max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                {watchVideos.slice(0, 5).map((v) => {
                  const isYT = isYouTubeUrl(v.url || '');
                  const ytId = getYouTubeId(v.url || '');
                  const isDrive = isGoogleDriveUrl(v.url || '');
                  const driveStream = isDrive ? getDriveDirectVideoUrl(v.url || '') : '';
                  return (
                    <Link
                      key={v.id}
                      to="/shop-by-videos"
                      className="group relative rounded-2xl overflow-hidden bg-black shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-transform duration-500 ease-out"
                      style={{ aspectRatio: '9/16' }}


                    >
                      {isYT && ytId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                          className="w-full h-full object-cover pointer-events-none"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          title={v.title}
                        />
                      ) : isDrive && driveStream ? (
                        <video
                          src={driveStream}
                          className="w-full h-full object-cover pointer-events-none"
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="none"
                        />
                      ) : isDrive ? (
                        <iframe
                          src={`${getDriveEmbedUrl(v.url || '')}?autoplay=1&mute=1`}
                          className="w-full h-full object-cover pointer-events-none"
                          allow="autoplay; fullscreen"
                          title={v.title}
                        />
                      ) : (
                        <video
                          src={v.url}
                          className="w-full h-full object-cover pointer-events-none"
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="none"
                        />
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 pointer-events-none" />

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none">
                        <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </div>

                      {/* Title */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium line-clamp-2">{v.title}</p>
                      </div>

                      {/* Reels Icon */}
                      <div className="absolute top-3 right-3" style={{ willChange: 'transform' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="opacity-80">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l6-5-6-5v10z" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile View - Carousel (one video per slide, draggable) */}
            <div className="md:hidden px-4">
              <Carousel opts={{ align: 'center', loop: false }} className="w-full">
                <CarouselContent className="ml-0 gap-0">
                  {watchVideos.map((v) => {
                    const isYT = isYouTubeUrl(v.url || '');
                    const ytId = getYouTubeId(v.url || '');
                    const isDrive = isGoogleDriveUrl(v.url || '');
                    const driveStream = isDrive ? getDriveDirectVideoUrl(v.url || '') : '';
                    return (
                      <CarouselItem
                        key={v.id}
                        className="flex-none w-full px-0"
                        style={{ minWidth: '100%', width: '100%' }}
                      >
                        <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg" style={{ aspectRatio: '9/16', width: '100%' }}>
                          {isYT && ytId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                              className="w-full h-full object-cover pointer-events-none"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                              title={v.title}
                            />
                          ) : isDrive && driveStream ? (
                            <video
                              src={driveStream}
                              className="w-full h-full object-cover pointer-events-none"
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="none"
                            />
                          ) : isDrive ? (
                            <iframe
                              src={`${getDriveEmbedUrl(v.url || '')}?autoplay=1&mute=1`}
                              className="w-full h-full object-cover pointer-events-none"
                              allow="autoplay; fullscreen"
                              title={v.title}
                            />
                          ) : (
                            <video
                              src={v.url}
                              className="w-full h-full object-cover pointer-events-none"
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="none"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-white text-xs font-medium line-clamp-2">{v.title}</p>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">No videos available yet.</p>
        )}

        <div className="text-center mt-8 md:mt-10 px-4">
          <Link
            to="/shop-by-videos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold hover:scale-105 transition-transform shadow-lg"
            style={{ backgroundColor: '#14b8a6' }}
          >
            <Play className="w-4 h-4" />
            View All Reels
          </Link>
        </div>
      </section>

      {/* Budget Finds */}
      <section className="section-collections relative bg-[#f1f5f9]" aria-label="Budget Finds">
        <div className="mb-6 max-w-7xl mx-auto px-4 sm:px-0">
          <div className="section-header text-center mb-6">
            <h2 className="section-title-themed font-extrabold mb-3 inline-block">
              <span className="text-brand">Budget</span>
              <span className="text-accent"> Finds</span>
            </h2>
            <div className="flex items-center justify-between">
              {!isMobile && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setBudgetStart(s => (s + (budgetProducts.length || 1) - 1) % (budgetProducts.length || 1))}
                    aria-label="Previous"
                    className="w-10 h-10  p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">◀</button>
                  <button onClick={() => setBudgetStart(s => (s + 1) % (budgetProducts.length || 1))} aria-label="Next"
                    className="p-2 rounded-lg bg-white border border-slate-200 ml-250 cursor-pointer">▶</button>
                </div>
              )}
            </div>
          </div>
          {isMobile ? (
            <div className="category-grid-row" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
              {
                budgetProducts.map((p: any) => (
                  <Link key={p.id} to={`/product/${(p.category || 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(p.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden" style={{ width: 240, scrollSnapAlign: 'start' }}>
                    <div className="w-full overflow-hidden bg-gray-100 rounded-t-2xl" style={{ height: 280 }}>
                      <ImageWithFallback src={optimizeImage(p.image, 800)} alt={p.name} className="w-full h-full object-cover" loading="eager" decoding="async" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{p.name}</h3>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400" style={{ textDecoration: 'line-through' }}>₹{Math.round(Number(p.price || 0) * 1.15).toLocaleString('en-IN')}</span>
                          <span className="text-sm text-gray-900">₹{Number(p.price || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-green-600 text-[10px] font-medium">Save 15%</span>
                      </div>
                    </div>
                  </Link>
                ))
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {budgetVisible.map((p: any) => (
                <ProductCard key={p.id} product={p} hideCategory imageHeight={280} />
              ))}
            </div>
          )}
          <div className="flex justify-center mt-8">
            <Link to="/shop?sort=price-low" className="px-8 py-3 rounded-xl font-bold" style={{ backgroundColor: '#14b8a6', color: '#fff', textTransform: 'uppercase' }}>View All</Link>
          </div>
        </div>
      </section>

      {/* Wall Art Collection Section */}
      <section className="section-wallart relative" aria-label="Wall Art Collection">
        <div
          className="absolute inset-0"
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-10 md:gap-14 items-center z-[5]">
          <div className="fade-left space-y-6">
            <div className="flex gap-3 opacity-70">
              <div className="w-8 h-8 md:w-10 md:h-10 border-2 rounded float-box border-gray-900/20"></div>
              <div className="w-8 h-8 md:w-10 md:h-10 border-2 rounded float-box border-gray-900/20"></div>
            </div>
            <div className="space-y-1 md:space-y-3">
              <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-900">
                Wall
              </h2>
              <h1 className="font-serif font-extrabold italic text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tigh text-gray-600">
                Art
              </h1>
              <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-900">
                Collection
              </h2>
            </div>
            <p className="text-sm sm:text-base md:text-lg max-w-sm">
              <span className="text-gray-700 font-medium"> Discover our curated collection of premium wall décor frames—from elegant
                minimalist pieces to luxurious handcrafted artwork.</span>
            </p>
            <Link
              to="/shop"
              className="btn-glow-teal text-white rounded-xl inline-block text-sm md:text-base px-6 py-3"
            >
              Explore Collection
            </Link>
          </div>
          <div className="fade-right relative pb-6 pt-6">
            <div className="curved-image-card">
              <ImageWithFallback
                src={optimizeImage((featuredProducts[0]?.image || newProducts[0]?.image || getCategoryImage('Wall Art')), 1200)}
                fetchPriority="high"
                loading="eager"
                className="w-full h-full object-cover rounded-xl"
                alt="Decor"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-whychoose relative" aria-label="Why Choose Decorizz">
        {/* Decorative Floating Elements */}
        <div className="deco-circle deco-circle-teal float-slow" style={{ width: '180px', height: '180px', top: '10%', left: '-60px' }} aria-hidden="true" />
        <div className="deco-circle deco-circle-brown float-medium" style={{ width: '120px', height: '120px', bottom: '20%', right: '-40px' }} aria-hidden="true" />

        <div className="absolute right-8 top-12 hidden lg:flex flex-col gap-2" aria-hidden="true">
          <div className="w-10 h-10 border-2 rounded float-fast" style={{ borderColor: "#14b8a6" }} />
          <div className="w-10 h-10 border-2 rounded float-slow" style={{ borderColor: "#14b8a6" }} />
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-14 text-center section-header">
            <h2 className="section-title-themed font-extrabold mb-4 inline-block">
              <span className="text-brand">Why</span>
              <span className="text-accent"> Choose Us</span>
            </h2>
            <p className="section-subtitle">
              Your confidence in our products is paramount. We stand behind every
              piece with unwavering guarantee and dedication.
            </p>
          </div>

          {isMobile ? (
            <div className="px-2">
              <Carousel opts={{ align: 'center', loop: false }} className="w-full">
                <CarouselContent className="ml-0 gap-2">
                  {[
                    { title: "Sourcing", desc: "Ethically sourced materials from sustainable forests and trusted artisan partners worldwide.", icon: Leaf },
                    { title: "Design", desc: "Contemporary and timeless designs crafted to complement any home aesthetic perfectly.", icon: Palette },
                    { title: "Crafting", desc: "Handcrafted by skilled artisans using time-honored techniques and precision tools.", icon: Brush },
                    { title: "Quality Assurance", desc: "Every frame undergoes rigorous quality checks to ensure it meets our standards.", icon: ShieldCheck },
                  ].map((item, idx) => (
                    <CarouselItem key={idx} className="flex-none w-full px-0" style={{ minWidth: '100%' }}>
                      <article
                        className="why-choose-card curve-card fade-up soft-card"
                        style={{
                          borderRadius: "50px",
                          padding: "22px",
                          minHeight: "30px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          border: "2px solid #14b8a6",
                        }}
                      >
                        <div className="icon-gradient-bg w-20 h-20 rounded-full flex items-center justify-center mb-3">
                          {(() => {
                            const Icon = (item as any).icon;
                            return <Icon className="w-10 h-10" color="#ffffff" aria-hidden="true" />;
                          })()}
                        </div>
                        <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "Georgia, serif", color: "#1f2937" }}>
                          {item.title}
                        </h3>
                        <p className="leading-relaxed" style={{ color: "#4b5563" }}>
                          {item.desc}
                        </p>
                      </article>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  title: "Sourcing",
                  desc: "Ethically sourced materials from sustainable forests and trusted artisan partners worldwide.",
                  icon: Leaf,
                },
                {
                  title: "Design",
                  desc: "Contemporary and timeless designs crafted to complement any home aesthetic perfectly.",
                  icon: Palette,
                },
                {
                  title: "Crafting",
                  desc: "Handcrafted by skilled artisans using time-honored techniques and precision tools.",
                  icon: Brush,
                },
                {
                  title: "Quality Assurance",
                  desc: "Every frame undergoes rigorous quality checks to ensure it meets our standards.",
                  icon: ShieldCheck,
                },
              ].map((item, idx) => (
                <article
                  key={idx}
                  className="why-choose-card curve-card fade-up soft-card relative"
                  style={{
                    borderRadius: "50px",
                    padding: "22px",
                    minHeight: "30px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    border: "2px solid #14b8a6",
                  }}
                >
                  <div
                    className="icon-gradient-bg w-20 h-20 rounded-full flex items-center justify-center mb-3 md:absolute md:-top-6 md:left-1/2 md:-translate-x-1/2 md:mb-0"
                  >
                    {(() => {
                      const Icon = (item as any).icon;
                      return <Icon className="w-10 h-10" color="#ffffff" aria-hidden="true" />;
                    })()}
                  </div>

                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ fontFamily: "Georgia, serif", color: "#1f2937" }}
                  >
                    {item.title}
                  </h3>

                  <p className="leading-relaxed" style={{ color: "#4b5563" }}>
                    {item.desc}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section >

      {/* TESTIMONIALS */}
      {
        loading ? (
          <section className="section-testimonials relative" aria-label="Customer Testimonials">
            <div className="best-section w-full mx-auto px-4 py-16 lg:py-20 relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-6 rounded-lg bg-white shadow-sm">
                    <div className="flex items-start mb-4 gap-3">
                      <div className="skeleton rounded-full w-12 h-12" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton skeleton-line lg w-1/2" />
                        <div className="skeleton skeleton-line sm w-1/3" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="skeleton skeleton-line lg w-full" />
                      <div className="skeleton skeleton-line lg w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : testimonials.length > 0 && (
          <section className="section-testimonials relative" aria-label="Customer Testimonials">

            <div className="w-full mx-auto px-4">
              <div className="text-center section-header">
                <h2 className="section-title-themed font-extrabold mb-4 inline-block">
                  <span className="text-brand">What</span>
                  <span className="text-accent"> People Say</span>
                </h2>
                <div className="flex items-center justify-center gap-3 mb-3" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full [background:#14b8a6]" />
                  <span className="w-40 border-t-2 [background:#14bb8a6]" />
                  <span className="w-2 h-2 rounded-full [background:#14b8a6]" />
                </div>
                <p className="section-subtitle">Real transformations from discerning homeowners who trust Decorizz</p>
              </div>

              <div className="mb-12 mt-6">
                <Carousel plugins={testimonialPlugins} opts={{ loop: true, align: "center", slidesToScroll: 1 }} setApi={setTestApi} className="w-full overflow-hidden testimonial-carousel">
                  <CarouselContent className="ml-0 sm:ml-2 gap-4 sm:gap-6">
                    {testimonials.map((t) => (
                      <CarouselItem
                        key={t.id}
                        className="testimonial-item flex-none w-full sm:w-1/2 lg:w-1/3 px-2"
                        data-slot="carousel-item"
                      >
                        <article
                          className="testimonial-card-enhanced soft-card bg-white border rounded-xl flex flex-col justify-between h-[320px] w-full max-w-[360px] mx-auto overflow-hidden"
                        >
                          <div className="p-8 flex flex-col items-center text-center h-full relative">

                            {/* PROFILE */}
                            <div className="mb-6 flex flex-col items-center shrink-0">
                              <ImageWithFallback
                                src={optimizeImage(t.profileImage || "", 100)}
                                alt={`${t.name} - Customer testimonial`}
                                className="w-18 h-18 rounded-full object-cover border-4 border-teal-50 shadow-md mb-3 transition-transform hover:scale-110 duration-300"
                              />

                              <div className="space-y-1">
                                <p className="text-gray-900 font-bold text-lg tracking-tight">{t.name}</p>

                                <div className="flex justify-center gap-1" role="img" aria-label={`${t.rating} out of 5 stars`}>
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                                      aria-hidden="true"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* TEXT */}
                            <blockquote className="text-gray-600 leading-relaxed line-clamp-3 relative px-2 flex-1 flex items-center justify-center">
                              <span className="relative z-10">{t.text}</span>
                            </blockquote>
                          </div>
                        </article>
                      </CarouselItem>


                    ))}
                  </CarouselContent>

                </Carousel>
              </div>

              <div className="text-center">
                <Link
                  to="/testimonials"
                  className="pill active"


                >
                  View Customer Gallery
                </Link>
              </div>
            </div>
          </section>
        )
      }

      {/* FAQ Section */}
      {
        faqsLoading ? (
          <section className="section-faq relative" aria-label="FAQ">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-white shadow-sm p-4">
                  <div className="skeleton skeleton-line lg w-2/3 mb-2" />
                  <div className="skeleton skeleton-line lg w-full mb-2" />
                  <div className="skeleton skeleton-line lg w-5/6" />
                </div>
              ))}
            </div>

          </section>
        ) : faqs.length > 0 && (
          <section
            className="best-section best-section-enhanced w-full mx-auto px-4 py-16 lg:py-20
             relative overflow-hidden
             bg-[linear-gradient(135deg,_#f5f2e9_0%)]
             backdrop-blur-sm"
            aria-label="Explore Our Frame Collection"
          >

            <div className="max-w-7xl mx-auto px-4">
              <h2 className="section-title-themed text-center mb-10">
                <span className="text-brand">Frequently</span>
                <span className="text-accent"> Asked Questions</span>
              </h2>
              <div className="faq-list" role="list">
                {faqs.slice(0, 5).map((f) => {
                  const isOpen = openFaq === f.id;

                  return (
                    <details
                      key={f.id}
                      open={isOpen}
                      className="faq-item faq-item-enhanced group"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenFaq(isOpen ? null : f.id);
                      }}
                    >
                      <summary className="faq-summary">
                        <span className="faq-icon faq-icon-animated">
                          <span className={`plus ${isOpen ? "hidden" : "inline"}`}>+</span>
                          <span className={`minus ${isOpen ? "inline" : "hidden"}`}>−</span>
                        </span>
                        <span className="faq-question">
                          {String(f.question).toUpperCase()}
                        </span>
                      </summary>


                      {isOpen && (
                        <div className="faq-answer">
                          {f.answer}
                        </div>
                      )}
                    </details>
                  );
                })}

              </div>
            </div>
          </section>
        )
      }

      <Footer />

    </main >
  );
}
