/* eslint-disable react/no-inline-styles */
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Heart, ChevronDown } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import { wishlistEvents } from '../utils/wishlistEvents';
import { AuthContext } from '../context/AuthContext';
import { cartEvents } from '../utils/cartEvents';
import logo from "../assets/logo-r.png";
import { TopMarquee } from "./TopMarquee";
import { useCategoryImages } from '../utils/useCategoryImages';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Fallback placeholder image
const PLACEHOLDER_IMG = 'https://placehold.co/150x150?text=Loading...';



export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [showDecorDropdown, setShowDecorDropdown] = useState(false);
  const [showFramesDropdown, setShowFramesDropdown] = useState(false);
  const [showLightingDropdown, setShowLightingDropdown] = useState(false);
  const [showNewArtDropdown, setShowNewArtDropdown] = useState(false);
  const [showAcrylicDropdown, setShowAcrylicDropdown] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showCustomDesignsDropdown, setShowCustomDesignsDropdown] = useState(false);
  const { user, logout, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [atTop, setAtTop] = useState(true);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isActive = (path: string) => location.pathname === path;
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Fetch category images from backend
  const { getImage, loading: imagesLoading } = useCategoryImages();

  const framesTimerRef = useRef<any>(null);
  const decorTimerRef = useRef<any>(null);
  const lightingTimerRef = useRef<any>(null);
  const newArtTimerRef = useRef<any>(null);
  const acrylicTimerRef = useRef<any>(null);
  const shopTimerRef = useRef<any>(null);
  const customDesignsTimerRef = useRef<any>(null);

  const spiritualActive =
    showFramesDropdown || isActive('/spiritual-art-gallery');

  const decorActive =
    showDecorDropdown || isActive('/decor-by-room');

  const handleShopEnter = () => {
    if (shopTimerRef.current) clearTimeout(shopTimerRef.current);
    setShowShopDropdown(true);
  };

  const handleShopLeave = () => {
    shopTimerRef.current = setTimeout(() => {
      setShowShopDropdown(false);
    }, 150);
  };

  const handleFramesEnter = () => {
    if (framesTimerRef.current) clearTimeout(framesTimerRef.current);
    setShowFramesDropdown(true);
  };

  const handleFramesLeave = () => {
    framesTimerRef.current = setTimeout(() => {
      setShowFramesDropdown(false);
    }, 150);
  };

  const handleDecorEnter = () => {
    if (decorTimerRef.current) clearTimeout(decorTimerRef.current);
    setShowDecorDropdown(true);
  };

  const handleDecorLeave = () => {
    decorTimerRef.current = setTimeout(() => {
      setShowDecorDropdown(false);
    }, 150);
  };

  const handleLightingEnter = () => {
    if (lightingTimerRef.current) clearTimeout(lightingTimerRef.current);
    setShowLightingDropdown(true);
  };

  const handleLightingLeave = () => {
    lightingTimerRef.current = setTimeout(() => {
      setShowLightingDropdown(false);
    }, 150);
  };

  const handleNewArtEnter = () => {
    if (newArtTimerRef.current) clearTimeout(newArtTimerRef.current);
    setShowNewArtDropdown(true);
  };

  const handleNewArtLeave = () => {
    newArtTimerRef.current = setTimeout(() => {
      setShowNewArtDropdown(false);
    }, 150);
  };

  const handleAcrylicEnter = () => {
    if (acrylicTimerRef.current) clearTimeout(acrylicTimerRef.current);
    setShowAcrylicDropdown(true);
  };

  const handleAcrylicLeave = () => {
    acrylicTimerRef.current = setTimeout(() => {
      setShowAcrylicDropdown(false);
    }, 150);
  };

  const handleCustomDesignsEnter = () => {
    if (customDesignsTimerRef.current) clearTimeout(customDesignsTimerRef.current);
    setShowCustomDesignsDropdown(true);
  };

  const handleCustomDesignsLeave = () => {
    customDesignsTimerRef.current = setTimeout(() => {
      setShowCustomDesignsDropdown(false);
    }, 150);
  };

  useEffect(() => {
    if (user && accessToken) {
      fetchCartCount();
      fetchWishlistCount();

      const unsubscribeCart = cartEvents.subscribe(() => {
        fetchCartCount();
      });
      const unsubscribeWishlist = wishlistEvents.subscribe(() => fetchWishlistCount());

      const onFocus = () => {
        if (document.visibilityState === 'visible') {
          fetchCartCount();
          fetchWishlistCount();
        }
      };
      window.addEventListener('visibilitychange', onFocus);

      return () => {
        unsubscribeCart();
        unsubscribeWishlist();
        window.removeEventListener('visibilitychange', onFocus);
      };
    }
  }, [user, accessToken]);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchCartCount = async () => {
    try {
      const response = await fetch(
        `https://wievhaxedotrhktkjupg.supabase.co/functions/v1/make-server-52d68140/cart`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      // Only count items with valid productId (not undefined/null)
      const validItems = data.cart?.items?.filter((item: any) => item.productId && (item.name || item.productId)) || [];
      const count = validItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error('Cart count error:', error);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await fetch(
        `https://wievhaxedotrhktkjupg.supabase.co/functions/v1/make-server-52d68140/wishlist`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      // Only count valid product IDs (not undefined/null/empty)
      const validIds = (data.wishlist?.items || []).filter((id: string) => id && id.length > 0);
      setWishlistCount(validIds.length);
    } catch (error) {
      console.error('Wishlist count error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  // Dynamic transparency to show hero image fully
  const transparent = !isMobile && atTop && location.pathname === '/';

  // Theme colors
  const navBg = transparent ? 'rgba(255,255,255,0.1)' : 'linear-gradient(180deg, #f8fffe 0%, #faf9f5 100%)';
  const navBorder = transparent ? 'none' : '1px solid #e5e7eb';
  const navTextColor = '#3b2f27'; // Always Brand Brown for visibility
  const navIconColor = '#3b2f27'; // Always Brand Brown
  const logoColor = '#3b2f27'; // Always Brand Brown
  const isDarkTheme = false; // Fix: Define missing variable forced to light theme


  return (
    <>
      <TopMarquee />
      <nav className={`fixed top-10 left-0 right-0 z-50 transition-all duration-300 ${transparent ? '' : 'shadow-lg shadow-teal-500/10'}`} style={{ background: navBg, borderBottom: navBorder, backdropFilter: 'blur(12px)' }}>

        <div className="w-full px-4 sm:px-6 xl:px-8">

          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div
              // className="w-10 h-10 rounded flex items-center justify-center"
              // style={{
              //   backgroundColor: '#14b8a6',
              //   color: 'white'
              // }}
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>

              <span className="text-xl font-extrabold text-accent glow-accent">DECORIZZ</span>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              {/* Shop Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleShopEnter}
                onMouseLeave={handleShopLeave}
              >
               <button
                  className="rounded-full px-4 py-2 text-sm transition hover:text-teal-600 cursor-pointer"
                  style={{
                    backgroundColor: showShopDropdown || isActive('/shop') ? 'white' : (transparent ? 'rgba(255,255,255,0.2)' : 'rgba(233, 229, 220, 0.5)'),
                    backdropFilter: transparent ? 'blur(10px)' : 'none',
                    boxShadow: showShopDropdown || isActive('/shop') ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                    color: '#3b2f27'
                  }}
                  onClick={() => navigate('/shop')}
                >
                  <span className={showShopDropdown || isActive('/shop') ? 'text-teal-600' : 'text-gray-900'}>Shop
                    <svg className={`ml-1 inline-block w-4 h-4 transition-transform ${showShopDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {showShopDropdown && (
                  <div
                    className="fixed left-0 right-0 top-16 backdrop-blur-md shadow-xl border-t border-gray-100 animate-fadeIn z-999"
                    style={{ background: 'linear-gradient(180deg, #f8fffe 0%, #faf9f5 100%)' }}
                    onMouseEnter={handleShopEnter}
                    onMouseLeave={handleShopLeave}
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex justify-between items-center mb-6">

                        <Link
                          to="/shop"
                          className="text-teal-500 hover:text-teal-700 font-semibold flex items-center gap-1 group ml-6"
                        >
                          View All Products
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>

                      <div className="flex justify-center gap-8">
                        {[
                          { label: '2 Set', to: '/shop?subsection=2-Set', category: '2-Set' },
                          { label: '3 Set', to: '/shop?subsection=3-Set', category: '3-Set' },
                          { label: 'Square', to: '/shop?layout=Square', category: 'Square' },
                          { label: 'Circle', to: '/shop?layout=Circle', category: 'Circle' },
                          { label: 'Landscape', to: '/shop?layout=Landscape', category: 'Landscape' },
                        ].map((item, idx) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="group flex flex-col items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 transform hover:-translate-y-1"
                            style={{
                              opacity: 0,
                              animation: `fadeSlideUp 0.5s ease forwards ${idx * 0.1}s`
                            }}
                            onClick={() => setShowShopDropdown(false)}
                          >
                            <div className="relative w-32 h-32 overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-all">
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                              <ImageWithFallback
                                src={getImage(item.category)}
                                alt={item.label}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-teal-600 text-center transition-colors text-sm">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Spritual Art Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleFramesEnter}
                onMouseLeave={handleFramesLeave}
              >
                <button
                  className="rounded-full px-4 py-2 text-sm transition hover:text-teal-600 cursor-pointer"
                  style={{
                    backgroundColor: spiritualActive
                      ? 'white'
                      : transparent
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(233, 229, 220, 0.5)',
                    backdropFilter: transparent ? 'blur(10px)' : 'none',
                    boxShadow: spiritualActive ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                    color: '#3b2f27'
                  }}
                  onClick={() => navigate('/spiritual-art-gallery')}
                >
                  <span className={isActive('/spiritual-art-gallery') ? 'text-brand' : 'text-gray-900'}>Spiritual Art
                    <svg className={`ml-1 inline-block w-4 h-4 transition-transform ${showFramesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {showFramesDropdown && (
                  <div
                    className="fixed left-0 right-0 top-16 backdrop-blur-md shadow-xl border-t border-gray-100 animate-fadeIn z-999"
                    style={{ background: 'linear-gradient(180deg, #f8fffe 0%, #faf9f5 100%)' }}
                    onMouseEnter={handleFramesEnter}
                    onMouseLeave={handleFramesLeave}
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex justify-between items-center mb-6">

                        <Link
                          to="/spiritual-art-gallery"
                          className="text-teal-500 hover:text-teal-700 font-semibold flex items-center gap-1 group ml-6"
                        >
                          View All Spiritual
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>

                      <div className="flex flex-wrap justify-center gap-8">
                        {[
                          { label: 'Vastu Yatra Painting', to: '/spiritual-art-gallery?category=Vastu Yatra Painting', category: 'Vastu Yatra Painting' },
                          { label: 'Ganesh Wall Art', to: '/spiritual-art-gallery?category=Ganesh Wall Art', category: 'Ganesh Wall Art' },
                          { label: 'Radha/Krishna Art', to: '/spiritual-art-gallery?category=Radha Krishna Art', category: 'Radha Krishna Art' },
                          { label: 'Vishnu Art', to: '/spiritual-art-gallery?category=Vishnu Art', category: 'Vishnu Art' },
                          { label: 'Buddha Painting', to: '/spiritual-art-gallery?category=Buddha Painting', category: 'Buddha Painting' },
                          { label: 'Shiva/Mahdev Art', to: '/spiritual-art-gallery?category=Shiva Mahdev Art', category: 'Shiva Mahdev Art' },
                          // { label: 'Ma Durga Art', to: '/spiritual-art-gallery?category=Ma Durga Art', category: 'Ma Durga Art' },
                          { label: 'Jesus Art', to: '/spiritual-art-gallery?category=Jesus Art', category: 'Jesus Art' },
                          { label: 'Islamic Art', to: '/spiritual-art-gallery?category=Islamic Art', category: 'Islamic Art' },
                        ].map((item, idx) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="group flex flex-col items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 transform hover:-translate-y-1"
                            style={{
                              opacity: 0,
                              animation: `fadeSlideUp 0.5s ease forwards ${idx * 0.1}s`
                            }}
                            onClick={() => setShowFramesDropdown(false)}
                          >
                            <div className="relative w-32 h-32 overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-all">
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                              <ImageWithFallback
                                src={getImage(item.category)}
                                alt={item.label}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-teal-600 text-center transition-colors text-sm">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Decororative Art Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleDecorEnter}
                onMouseLeave={handleDecorLeave}
              >
                <button
                  className="rounded-full px-4 py-2 text-sm transition hover:text-teal-600 cursor-pointer"
                  style={{
                    backgroundColor: decorActive
                      ? 'white'
                      : transparent
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(233, 229, 220, 0.5)',
                    backdropFilter: transparent ? 'blur(10px)' : 'none',
                    boxShadow: decorActive ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                    color: '#3b2f27'
                  }}
                  onClick={() => navigate('/decor-by-room')}
                >
                  <span className={isActive('/decor-by-room') ? 'text-brand' : 'text-gray-900'}>
                    Decorative Art
                    <svg className={`ml-1 inline-block w-4 h-4 transition-transform ${showDecorDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {showDecorDropdown && (
                  <div
                    className="fixed left-0 right-0 top-16 backdrop-blur-md shadow-xl border-t border-gray-100 animate-fadeIn z-999"
                    style={{ background: 'linear-gradient(180deg, #f8fffe 0%, #faf9f5 100%)' }}
                    onMouseEnter={handleDecorEnter}
                    onMouseLeave={handleDecorLeave}
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex justify-between items-center mb-6">

                        <Link
                          to="/decor-by-room"
                          className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 group ml-6"
                        >
                          View All Rooms
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>

                      <div className="flex flex-wrap justify-center gap-8">
                        {[
                          { label: 'Animals Art', to: '/decor-by-room?category=Animals Art', category: 'Animals Art' },
                          { label: 'Birds Art', to: '/decor-by-room?category=Birds Art', category: 'Birds Art' },
                          { label: 'Natural Art', to: '/decor-by-room?category=Natural Art', category: 'Natural Art' },
                          { label: 'Office Canvas Art', to: '/decor-by-room?category=Office Canvas Art', category: 'Office Canvas Art' },
                          { label: 'Boho Art', to: '/decor-by-room?category=Boho Art', category: 'Boho Art' },
                          { label: 'Wall Art', to: '/decor-by-room?category=Wall Art', category: 'Wall Art' },
                          { label: '3D Wall Art', to: '/decor-by-room?category=3D Wall Art', category: '3D Wall Art' },
                          { label: '3 Set Art', to: '/decor-by-room?category=3 Set Art', category: '3 Set Art' },
                          { label: '2 Set Art', to: '/decor-by-room?category=2 Set Art', category: '2 Set Art' },
                          { label: 'Mandela Art', to: '/decor-by-room?category=Mandela Art', category: 'Mandela Art' },
                        ].map((item, idx) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="group flex flex-col items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 transform hover:-translate-y-1"
                            style={{
                              opacity: 0,
                              animation: `fadeSlideUp 0.5s ease forwards ${idx * 0.1}s`
                            }}
                            onClick={() => setShowDecorDropdown(false)}
                          >
                            <div className="relative w-32 h-32 overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-all">
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                              <ImageWithFallback
                                src={getImage(item.category)}
                                alt={item.label}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-teal-600 text-center transition-colors text-sm">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* New Art Gallery Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleNewArtEnter}
                onMouseLeave={handleNewArtLeave}
              >
                <button
                  className="rounded-full px-4 py-2 text-sm flex items-center gap-1 cursor-pointer"
                  style={{
                    backgroundColor: showNewArtDropdown || isActive('/new-art-gallery') ? 'white' : (transparent ? 'rgba(255,255,255,0.2)' : 'rgba(233, 229, 220, 0.5)'),
                    backdropFilter: transparent ? 'blur(10px)' : 'none',
                    boxShadow: showNewArtDropdown || isActive('/new-art-gallery') ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                    color: '#3b2f27'
                  }}
                  onClick={() => navigate('/new-art-gallery')}
                >
                  New Art
                  <ChevronDown className={`w-4 h-4 transition-transform ${showNewArtDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showNewArtDropdown && (
                  <div
                    className="fixed left-0 right-0 top-16 backdrop-blur-md shadow-xl border-t border-gray-100 animate-fadeIn z-999"
                    style={{ background: 'linear-gradient(180deg, #f8fffe 0%, #faf9f5 100%)' }}
                    onMouseEnter={handleNewArtEnter}
                    onMouseLeave={handleNewArtLeave}
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex justify-between items-center mb-4">

                        <Link
                          to="/new-art-gallery"
                          className="text-teal-500 hover:text-teal-700 font-semibold flex items-center gap-1 group ml-6"
                        >
                          View All New Art
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>

                      <div className="flex flex-wrap justify-center gap-8">
                        {[
                          { label: 'Gen Z Art', to: '/new-art-gallery?category=Gen Z Art', category: 'Gen Z Art' },
                          { label: 'Living Room Art', to: '/new-art-gallery?category=Living Room Art', category: 'Living Room Art' },
                          { label: 'Pop Art', to: '/new-art-gallery?category=Pop Art', category: 'Pop Art' },
                          { label: 'Bed Room Art', to: '/new-art-gallery?category=Bed Room Art', category: 'Bed Room Art' },
                          { label: 'Graffiti Art', to: '/new-art-gallery?category=Graffiti Art', category: 'Graffiti Art' },
                          { label: 'Abstract Art', to: '/new-art-gallery?category=Abstract Art', category: 'Abstract Art' },
                          { label: 'Bollywood Art', to: '/new-art-gallery?category=Bollywood Art', category: 'Bollywood Art' },
                          { label: 'Couple Art', to: '/new-art-gallery?category=Couple Art', category: 'Couple Art' },
                          
                        ].map((item, idx) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="group flex flex-col items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 transform hover:-translate-y-1"
                            style={{
                              opacity: 0,
                              animation: `fadeSlideUp 0.5s ease forwards ${idx * 0.1}s`
                            }}
                            onClick={() => setShowNewArtDropdown(false)}
                          >
                            <div className="relative w-32 h-32 overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-all">
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                              <ImageWithFallback
                                src={getImage(item.category)}
                                alt={item.label}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-teal-600 text-center transition-colors text-sm">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Neon Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleLightingEnter}
                onMouseLeave={handleLightingLeave}
              >
                <button
                  aria-label='neon'
                  className="rounded-full px-4 py-2 text-sm transition hover:text-teal-600 cursor-pointer"
                  style={{
                    backgroundColor: showLightingDropdown
                      ? 'white'
                      : transparent
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(233, 229, 220, 0.5)',
                    backdropFilter: transparent ? 'blur(10px)' : 'none',
                    boxShadow: showLightingDropdown ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                    color: '#3b2f27'
                  }}
                  onClick={() => navigate('/lighting')}
                >
                  <span className={isActive('/lighting') ? 'text-brand' : 'text-gray-900'}>
                    Neon Sign
                    <svg className={`ml-1 inline-block w-4 h-4 transition-transform ${showLightingDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {showLightingDropdown && (
                  <div
                    className="fixed left-0 right-0 top-16 backdrop-blur-md shadow-xl border-t border-gray-100 animate-fadeIn z-999"
                    style={{ background: 'linear-gradient(180deg, #f8fffe 0%, #faf9f5 100%)' }}
                    onMouseEnter={handleLightingEnter}
                    onMouseLeave={handleLightingLeave}
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex justify-between items-center mb-6">

                        <Link
                          to="/lighting"
                          className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 group ml-6"
                        >
                          View All Lighting
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>

                      <div className="flex flex-wrap justify-center gap-8">
                        {[
                          { label: 'Gods', to: '/lighting?category=Gods', category: 'Gods' },
                          { label: 'Café', to: '/lighting?category=Cafe', category: 'Cafe' },
                          { label: 'Gym', to: '/lighting?category=Gym', category: 'Gym' },
                          { label: 'Car', to: '/lighting?category=Car', category: 'Car' },
                          { label: 'Gaming', to: '/lighting?category=Gaming', category: 'Gaming' },
                          { label: 'Wings', to: '/lighting?category=Wings', category: 'Wings' },
                          { label: 'Kids', to: '/lighting?category=Kids', category: 'Kids' },
                          // { label: 'Christmas', to: '/lighting?category=Christmas', category: 'Christmas' },
                          
                        ].map((item, idx) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="group flex flex-col items-center gap-3 p-3 transition-all duration-300 transform hover:-translate-y-1"
                            style={{
                              opacity: 0,
                              animation: `fadeSlideUp 0.5s ease forwards ${idx * 0.05}s`
                            }}
                            onClick={() => setShowLightingDropdown(false)}
                          >
                            <div className="relative w-20 h-20 md:w-24 md:h-24 overflow-hidden rounded-full shadow-lg group-hover:shadow-xl transition-all border-4 border-white group-hover:border-teal-400">
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                              <ImageWithFallback
                                src={getImage(item.category)}
                                alt={item.label}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-teal-600 text-center transition-colors text-sm">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Designs Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleCustomDesignsEnter}
                onMouseLeave={handleCustomDesignsLeave}
              >
                <button
                  className="rounded-full px-4 py-2 text-sm transition hover:text-teal-600 cursor-pointer"
                  style={{
                    backgroundColor: showCustomDesignsDropdown ? 'white' : (transparent ? 'rgba(255,255,255,0.2)' : 'rgba(233, 229, 220, 0.5)'),
                    backdropFilter: transparent ? 'blur(10px)' : 'none',
                    boxShadow: showCustomDesignsDropdown ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                    color: '#3b2f27'
                  }}
                >
                  <span className={showCustomDesignsDropdown ? 'text-brand' : 'text-gray-900'}>
                    Custom Designs
                    <svg className={`ml-1 inline-block w-4 h-4 transition-transform ${showCustomDesignsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {showCustomDesignsDropdown && (
                  <div
                    className="fixed left-0 right-0 top-16 backdrop-blur-md shadow-xl border-t border-gray-100 animate-fadeIn z-999"
                    style={{ background: 'linear-gradient(180deg, #f8fffe 0%, #faf9f5 100%)' }}
                    onMouseEnter={handleCustomDesignsEnter}
                    onMouseLeave={handleCustomDesignsLeave}
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex justify-between items-center mb-6">
                        <Link
                          to="/product/custom/custom-print-round-canvas-wall-art"
                          className="text-teal-500 hover:text-teal-700 font-semibold flex items-center gap-1 group ml-6"
                        >
                          View All Custom Designs
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>

                      <div className="flex justify-center gap-8">
                        {[
                          { label: 'Round Canvas', to: '/product/custom/custom-print-round-canvas-wall-art', category: 'Circle' },
                          { label: 'Square Canvas', to: '/product/custom/custom-print-square-canvas-wall-art', category: 'Square' },
                          { label: 'Portrait Canvas', to: '/product/custom/custom-print-portrait-canvas-wall-art', category: 'Portrait' },
                          { label: 'Landscape Canvas', to: '/product/custom/custom-print-landscape-canvas-wall-art', category: 'Landscape' },
                          { label: 'Custom Neon Sign', to: '/product/custom/custom-name-neon-signs-lights', category: 'Wings' },
                        ].map((item, idx) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="group flex flex-col items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 transform hover:-translate-y-1"
                            style={{
                              opacity: 0,
                              animation: `fadeSlideUp 0.5s ease forwards ${idx * 0.1}s`
                            }}
                            onClick={() => setShowCustomDesignsDropdown(false)}
                          >
                            <div className="relative w-24 h-24 md:w-28 md:h-28 overflow-hidden rounded-full shadow-lg group-hover:shadow-xl transition-all border-4 border-white group-hover:border-teal-400">
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                              <ImageWithFallback
                                src={getImage(item.category)}
                                alt={item.label}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-teal-600 text-center transition-colors text-sm">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Acrylic Art Gallery Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleAcrylicEnter}
                onMouseLeave={handleAcrylicLeave}
              >
                <button
                  className="rounded-full px-4 py-2 text-sm flex items-center gap-1 cursor-pointer"
                  style={{
                    backgroundColor: showAcrylicDropdown || isActive('/acrylic-art-gallery') ? 'white' : (transparent ? 'rgba(255,255,255,0.2)' : 'rgba(233, 229, 220, 0.5)'),
                    backdropFilter: transparent ? 'blur(10px)' : 'none',
                    boxShadow: showAcrylicDropdown || isActive('/acrylic-art-gallery') ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                    color: '#3b2f27'
                  }}
                  onClick={() => navigate('/acrylic-art-gallery')}
                >
                  Acrylic Art
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAcrylicDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showAcrylicDropdown && (
                  <div
                    className="fixed left-0 right-0 top-16 backdrop-blur-md shadow-xl border-t border-gray-100 animate-fadeIn z-999"
                    style={{ background: 'linear-gradient(180deg, #f8fffe 0%, #faf9f5 100%)' }}
                    onMouseEnter={handleAcrylicEnter}
                    onMouseLeave={handleAcrylicLeave}
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex justify-between items-center mb-6">

                        <Link
                          to="/acrylic-art-gallery"
                          className="text-teal-500 hover:text-teal-700 font-semibold flex items-center gap-1 group ml-6"
                        >
                          View All Acrylic
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>

                      <div className="flex justify-center gap-12">
                        {[
                          { label: 'Animal Acrylic Art', to: '/acrylic-art-gallery?category=Animal Acrylic Art', category: 'Animal Acrylic Art' },
                          { label: 'Spiritual Acrylic Art', to: '/acrylic-art-gallery?category=Spiritual Acrylic Art', category: 'Spiritual Acrylic Art' },
                          { label: 'Gen Z Acrylic Art', to: '/acrylic-art-gallery?category=Gen Z Acrylic Art', category: 'Gen Z Acrylic Art' },
                        ].map((item, idx) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="group flex flex-col items-center gap-3 p-3 transition-all duration-300 transform hover:-translate-y-1"
                            style={{
                              opacity: 0,
                              animation: `fadeSlideUp 0.5s ease forwards ${idx * 0.1}s`
                            }}
                            onClick={() => setShowAcrylicDropdown(false)}
                          >
                            <div className="relative w-24 h-24 md:w-28 md:h-28 overflow-hidden rounded-full shadow-lg group-hover:shadow-xl transition-all border-4 border-white group-hover:border-teal-400">
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                              <img
                                src={getImage(item.category)}
                                alt={item.label}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                              />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-teal-600 text-center transition-colors text-sm">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {[
                // { to: '/gallery', label: 'New Art Gallery' },
                // { to: '/contact', label: 'Contact' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full px-4 py-2 text-sm"
                  style={{
                    backgroundColor: isActive(item.to) ? 'white' : (transparent ? 'rgba(255,255,255,0.2)' : 'rgba(233, 229, 220, 0.5)'),
                    backdropFilter: transparent ? 'blur(10px)' : 'none',
                    boxShadow: isActive(item.to) ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                    color: '#3b2f27'
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Search Bar - Desktop */}
            {/* <form onSubmit={handleSearch} className="hidden md:flex items-center relative" style={{ zIndex: 50 }}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search frames..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-12 py-2 border rounded-lg focus:outline-none"
                  style={{
                    borderColor: '#d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#3b2f27',
                    width: '150px',
                    fontSize: '14px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#14b8a6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <Search
                  className="absolute right-2 top-1/2 w-5 h-5 pointer-events-none"
                  style={{ transform: 'translateY(-50%)', color: '#6b7280' }}
                />
              </div>
            </form> */}

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4 relative" style={{ zIndex: 50 }}>

              {/* Wishlist Icon */}
              <Link to="/wishlist" className="relative inline-flex items-center justify-center transition hover:scale-110" style={{ color: navIconColor }}>
                <Heart className="w-6 h-6" />
                {wishlistCount > 0 && (
                  <span className="absolute mb-6 ml-4 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-teal-600 rounded-full border-2 border-white shadow-md">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link
                to="/cart"
                className="relative inline-flex items-center justify-center transition hover:scale-110"
                style={{ color: navIconColor }}>
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute mb-6 ml-4 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-teal-600 rounded-full border-2 border-white shadow-md">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User/Profile Icon - Mobile (shows beside cart, not inside hamburger) */}
              {user ? (
                <Link to="/account" className="inline-flex lg:hidden items-center justify-center transition hover:scale-110" style={{ color: navIconColor }}>
                  <User className="w-6 h-6" />
                </Link>
              ) : (
                <Link to="/login" className="inline-flex lg:hidden items-center justify-center rounded-full px-3 py-1 transition" style={{ backgroundColor: '#14b8a6', color: 'white', fontWeight: 700 }}>
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* User/Login - Desktop Only */}
              {user ? (
                <div className="relative group hidden md:flex">
                  <button
                    className="inline-flex items-center gap-2  p-2 rounded-lg transition bg-teal-600 cursor-pointer"
                    style={{ color: navIconColor }}
                  >
                    <User className="w-5 h-5 text-white" />
                    <span style={{ fontWeight: 500, color: '#eef3f2' }}>
                      {user.name}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg py-2 hidden group-hover:block"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', zIndex: 100 }}
                  >
                    <Link
                      to="/account"
                      className="block px-6 py-2 transition"
                      style={{ fontWeight: 500, color: '#374151' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#14b8a6';
                        e.currentTarget.style.color = '#eef3f2ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#374151';
                      }}
                    >
                      My Account
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 transition"
                        style={{ fontWeight: 500, color: '#374151' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.color = '#14b8a6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#374151';
                        }}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 transition"
                      style={{ fontWeight: 500, color: '#374151' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.color = '#14b8a6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#374151';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  aria-label="Login"
                  title="Login"
                  className="hidden md:flex items-center justify-center rounded-full px-6 py-2 transition"
                  style={{ backgroundColor: '#14b8a6', color: 'white', fontWeight: 700 }}
                >
                  Log In
                </Link>
              )}

              {/* Mobile Search Icon */}
              <button
                type="button"
                onClick={() => {
                  // console.log('Search icon clicked');
                  setIsSearchOpen(true);
                }}
                className="lg:hidden"
                style={{ color: navIconColor }}
              >
                <Search className="w-6 h-6" />
              </button>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden"
                style={{ color: isDarkTheme ? '#e5e7eb' : '#374151' }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <>
          {/* Backdrop - Click to close */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
            style={{ zIndex: 99999 }}
            onClick={() => setIsSearchOpen(false)}
          />

          {/* Search Bar Container */}
          <div
            className="fixed top-0 left-0 right-0 p-4 bg-white lg:hidden shadow-xl"
            style={{ borderBottom: '1px solid #e5e7eb', zIndex: 100000 }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(e);
                setIsSearchOpen(false);
              }}
              className="relative flex items-center gap-2"
            >

              <input
                autoFocus
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all  placeholder-gray-400 text-gray-900"
              />
              <Search className="w-5 h-5 text-gray-400 absolute ml-2" />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-600 rounded-lg"
              >
                Cancel
              </button>
            </form>
          </div>
        </>
      )}

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
      />
    </>
  );
}
