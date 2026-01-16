import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { Toaster } from 'sonner';


// Critical pages - load immediately
import HomePage from './pages/HomePage';

// Lazy-loaded pages for code splitting - loads only when visited
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const UserAccountPage = lazy(() => import('./pages/UserAccountPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const AdminSignupPage = lazy(() => import('./pages/AdminSignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminDelivery = lazy(() => import('./pages/admin/AdminDelivery'));
const AdminContacts = lazy(() => import('./pages/admin/AdminContacts'));
const AdminFAQs = lazy(() => import('./pages/admin/AdminFAQs'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const RefundsPage = lazy(() => import('./pages/RefundsPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ShopByVideosPage = lazy(() => import('./pages/ShopByVideosPage'));
const AdminVideos = lazy(() => import('./pages/admin/AdminVideos'));
const AdminInstagram = lazy(() => import('./pages/admin/AdminInstagram'));
const AdminHomeSections = lazy(() => import('./pages/admin/AdminHomeSections'));
const AdminOffers = lazy(() => import('./pages/admin/AdminOffers'));
const DecorByRoomPage = lazy(() => import('./pages/DecorByRoomPage'));
const LightingPage = lazy(() => import('./pages/LightingPage'));
const NewArtGalleryPage = lazy(() => import('./pages/NewArtGalleryPage'));
const AcrylicArtGalleryPage = lazy(() => import('./pages/AcrylicArtGalleryPage'));
const SpiritualArtGalleryPage = lazy(() => import('./pages/SpiritualArtGalleryPage'));
const CustomDesignsPage = lazy(() => import('./pages/CustomDesignsPage'));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

import { WhatsappButton } from './components/WhatsappButton';
import { ChatBot } from './components/ChatBot';
import { AuthContext, AuthContextType, User } from './context/AuthContext';
import { ScrollToTop } from './components/ScrollToTop';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouteLoader } from './components/RouteLoader';

// Loading fallback component for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();



const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Auth context moved to ./context/AuthContext to keep this file exporting only components
// Helper component to hide ChatBot on admin pages
function ChatBotWrapper() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null;
  return <ChatBot />;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lenis smooth scrolling - applied globally to all pages
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      smoothTouch: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  // Image Protection - Block right-click, keyboard shortcuts, and long-press
  useEffect(() => {
    // Block right-click context menu on images
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Block keyboard shortcuts (Ctrl+S, Ctrl+U, Ctrl+Shift+I)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.key === 's') || // Save
        (e.ctrlKey && e.key === 'u') || // View source
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // Dev tools
        (e.ctrlKey && e.shiftKey && e.key === 'i') ||
        (e.key === 'F12') // Dev tools
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Block drag on images
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setAccessToken(session.access_token);
        fetchUser(session.access_token);
      } else {
        setAccessToken(null);
        setUser(null);
      }
      setIsLoading(false);
    });
    // also check current session once on mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.access_token) {
          setAccessToken(session.access_token);
          fetchUser(session.access_token);
        }
      })
      .finally(() => setIsLoading(false));
    return () => { sub.subscription?.unsubscribe(); };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session?.access_token) {
        setAccessToken(session.access_token);
        await fetchUser(session.access_token);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/auth/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const adminEmails = new Set(['admin@decorizz.com']);
        const incoming = data.user as Partial<User> & { email?: string; role?: string };
        const normalizedRole: 'user' | 'admin' = incoming.role === 'admin'
          ? 'admin'
          : adminEmails.has((incoming.email || '').toLowerCase())
            ? 'admin'
            : 'user';
        setUser({
          id: String(incoming.id || ''),
          email: String(incoming.email || ''),
          name: String((incoming as any).name || incoming.email?.split('@')[0] || 'User'),
          role: normalizedRole,
        });
      }
    } catch (error) {
      console.error('Fetch user error:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.session) {
      setAccessToken(data.session.access_token);
      await fetchUser(data.session.access_token);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/auth/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    // Auto login after signup
    await login(email, password);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  const googleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login',
        },
      });
    } catch (e: any) {
      console.error('Google auth error:', e);
      alert('Google sign-in is not enabled. Enable Google in Supabase Auth → Providers and add redirect URL.');
    }
  };

  const authValue: AuthContextType = {
    user,
    accessToken,
    login,
    signup,
    logout,
    googleLogin,
    isLoading,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <BrowserRouter>
          <RouteLoader />
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:category/:name" element={<ProductDetailPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              {/* Protect checkout: redirect unauthenticated users to login with a return path */}
              <Route
                path="/checkout"
                element={user ? <CheckoutPage /> : <Navigate to="/login" state={{ redirect: '/checkout' }} replace />}
              />
              <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
              <Route path="/account" element={<UserAccountPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/refunds" element={<RefundsPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/shop-by-videos" element={<ShopByVideosPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/testimonials" element={<TestimonialsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/decor-by-room" element={<DecorByRoomPage />} />
              <Route path="/lighting" element={<LightingPage />} />
              <Route path="/new-art-gallery" element={<NewArtGalleryPage />} />
              <Route path="/acrylic-art-gallery" element={<AcrylicArtGalleryPage />} />
              <Route path="/spiritual-art-gallery" element={<SpiritualArtGalleryPage />} />
              <Route path="/custom-designs" element={<CustomDesignsPage />} />
              <Route path="/contact" element={<ContactUsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/admin-signup" element={<AdminSignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />


              {/* Admin Routes */}
              <Route
                path="/admin"
                element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/products"
                element={user?.role === 'admin' ? <AdminProducts /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/orders"
                element={user?.role === 'admin' ? <AdminOrders /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/users"
                element={user?.role === 'admin' ? <AdminUsers /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/testimonials"
                element={user?.role === 'admin' ? <AdminTestimonials /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/gallery"
                element={user?.role === 'admin' ? <AdminGallery /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/payments"
                element={user?.role === 'admin' ? <AdminPayments /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/delivery"
                element={user?.role === 'admin' ? <AdminDelivery /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/contacts"
                element={user?.role === 'admin' ? <AdminContacts /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/faqs"
                element={user?.role === 'admin' ? <AdminFAQs /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/home-sections"
                element={user?.role === 'admin' ? <AdminHomeSections /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/offers"
                element={user?.role === 'admin' ? <AdminOffers /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/videos"
                element={user?.role === 'admin' ? <AdminVideos /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/instagram"
                element={user?.role === 'admin' ? <AdminInstagram /> : <Navigate to="/login" />}
              />

              {/* 404 Catch-all Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <WhatsappButton />
          <ChatBotWrapper />
        </BrowserRouter>
        <Toaster position="top-right" />

      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
