import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { isYouTubeUrl as isYouTube, getYouTubeId, isGoogleDriveUrl as isGoogleDrive, getDriveEmbedUrl, getDriveDirectVideoUrl } from '../utils/video';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { toast } from 'sonner';
import { Heart, MessageCircle, ShoppingCart, Play, Share2, Bookmark, X, ChevronUp, ChevronDown, ExternalLink, Volume2, VolumeX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

type VideoItem = {
  id: string;
  title: string;
  url: string;
  caption?: string;
  thumbnail?: string;
  productId?: string | null;
};

type ProductInfo = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export default function ShopByVideosPage() {
  const { user, accessToken } = useContext(AuthContext);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReelsMode, setIsReelsMode] = useState(false);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [showCartPopup, setShowCartPopup] = useState<VideoItem | null>(null);
  const [products, setProducts] = useState<Record<string, ProductInfo>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const reelsContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetchVideos(); }, []);

  const fetchVideos = async () => {
    try {
      let apiVideos: VideoItem[] = [];
      const [authRes, pubRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`),
      ]);
      let authList: VideoItem[] = [];
      let pubList: VideoItem[] = [];
      if (authRes.ok) {
        const j = await authRes.json();
        authList = j.videos || j.items || [];
      }
      if (pubRes.ok) {
        const j2 = await pubRes.json();
        pubList = j2.videos || j2.items || [];
      }
      apiVideos = authList.length ? authList : pubList;
      setVideos(apiVideos);

      const likeCounts: Record<string, number> = {};
      await Promise.all((apiVideos || []).map(async (v: any) => {
        try {
          const r = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${v.id}/likes`, {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
          });
          const d = await r.json();
          likeCounts[v.id] = d.count || 0;
        } catch { }
      }));
      setLikes(likeCounts);

      const productData: Record<string, ProductInfo> = {};
      await Promise.all((apiVideos || []).filter((v: any) => v.productId).map(async (v: any) => {
        try {
          const r = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${v.productId}`, {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
          });
          const d = await r.json();
          if (d.product) {
            productData[v.productId] = {
              id: d.product.id,
              name: d.product.name,
              price: d.product.price,
              image: d.product.images?.[0] || '',
            };
          }
        } catch { }
      }));
      setProducts(productData);
    } catch (e) {
      console.error('Fetch videos error:', e);
    } finally {
      setLoading(false);
    }
  };


  const toggleLike = async (id: string) => {
    try {
      if (!user) return toast.error('Login to like');

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Failed');

      setLikes(prev => ({ ...prev, [id]: d.count }));
      setLikedVideos(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
      });
    } catch { toast.error('Failed'); }
  };

  const addToCart = async (v: VideoItem) => {
    try {
      if (!user) return toast.error('Login to add to cart');
      if (!v.productId) return toast.error('No related product');

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ productId: v.productId, quantity: 1 })
      });

      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Failed');

      toast.success('Added to cart!');
      setShowCartPopup(null);
    } catch { toast.error('Failed'); }
  };

  // Handle comment button
  const handleComment = () => {
    toast.info('Comments coming soon!');
  };

  // Handle share button
  const handleShare = async (video: VideoItem) => {
    const shareData = {
      title: video.title,
      text: `Check out this video: ${video.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(window.location.href);
          toast.success('Link copied to clipboard!');
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  // Handle save/bookmark button
  const toggleSave = (videoId: string) => {
    setSavedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
        toast.success('Removed from saved');
      } else {
        newSet.add(videoId);
        toast.success('Saved!');
      }
      return newSet;
    });
  };

  // Handle keyboard navigation in Reels mode
  useEffect(() => {
    if (!isReelsMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(prev + 1, videos.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setIsReelsMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReelsMode, videos.length]);

  // Handle touch swipe in Reels mode
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe up - next video
        setCurrentIndex(prev => Math.min(prev + 1, videos.length - 1));
      } else {
        // Swipe down - previous video
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
    }
  };

  // Handle wheel scroll in Reels mode - one video per scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    // Prevent multiple scrolls at once
    if (isScrolling) return;

    if (Math.abs(e.deltaY) > 30) {
      setIsScrolling(true);

      if (e.deltaY > 0) {
        // Scroll down - next video
        setCurrentIndex(prev => Math.min(prev + 1, videos.length - 1));
      } else {
        // Scroll up - previous video
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }

      // Reset scrolling flag after delay
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    }
  }, [videos.length, isScrolling]);

  const openReelsMode = (index: number) => {
    setCurrentIndex(index);
    setIsReelsMode(true);
    document.body.style.overflow = 'hidden';
  };

  const closeReelsMode = () => {
    setIsReelsMode(false);
    document.body.style.overflow = '';
  };

  const currentVideo = videos[currentIndex];

  // Toggle video mute
  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  // Render video element for grid (always muted)
  const renderVideoThumbnail = (v: VideoItem) => {
    if (isYouTube(v.url)) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${getYouTubeId(v.url)}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${getYouTubeId(v.url)}`}
          title={v.title}
          className="w-full h-full object-cover pointer-events-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      );
    } else if (isGoogleDrive(v.url)) {
      const stream = getDriveDirectVideoUrl(v.url);
      if (stream) {
        return (
          <video
            src={stream}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
          />
        );
      }
      return (
        <iframe
          src={`${getDriveEmbedUrl(v.url)}?autoplay=1&mute=1`}
          title={v.title}
          className="w-full h-full object-cover pointer-events-none"
          allow="autoplay; fullscreen"
          referrerPolicy="no-referrer"
        />
      );
    } else {
      return (
        <video
          src={v.url}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          loop
          preload="auto"
        />
      );
    }
  };

  // Render video for full-screen reels mode (with sound control)
  const renderReelsVideo = (v: VideoItem) => {
    if (isYouTube(v.url)) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${getYouTubeId(v.url)}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${getYouTubeId(v.url)}`}
          title={v.title}
          className="w-full h-full object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    } else if (isGoogleDrive(v.url)) {
      const stream = getDriveDirectVideoUrl(v.url);
      if (stream) {
        return (
          <video
            ref={videoRef}
            src={stream}
            className="w-full h-full object-cover"
            autoPlay
            muted={isMuted}
            playsInline
            loop
            preload="auto"
          />
        );
      }
      return (
        <iframe
          src={getDriveEmbedUrl(v.url)}
          title={v.title}
          className="w-full h-full object-cover"
          allow="autoplay; fullscreen"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      );
    } else {
      return (
        <video
          ref={videoRef}
          src={v.url}
          className="w-full h-full object-cover"
          playsInline
          muted={isMuted}
          autoPlay
          loop
          preload="auto"
        />
      );
    }
  };

  return (
    <div className="min-h-screen content-offset premium-bg">
      <Navbar />

      {/* HEADER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#1f2937' }}>
            Shop by <span style={{ color: '#14b8a6' }}>Reels</span>
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Tap any video to enter full-screen mode. Swipe up/down to browse!
          </p>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-2xl animate-pulse" style={{ aspectRatio: '9/16' }} />
            ))}
          </div>
        ) : videos.length > 0 ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {videos.map((v, index) => (
              <div
                key={v.id}
                className="group relative rounded-2xl overflow-hidden bg-black shadow-lg cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                style={{ aspectRatio: '9/16' }}
                onClick={() => openReelsMode(index)}
              >
                {/* Video Thumbnail */}
                <div className="absolute inset-0 pointer-events-none">
                  {renderVideoThumbnail(v)}
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-7 h-7 text-white ml-1" fill="white" />
                  </div>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {/* <p className="text-white font-semibold text-sm line-clamp-2">{v.title}</p> */}
                  {v.productId && (
                    <span className="inline-block mt-2 px-2 py-1 bg-teal-500 rounded-full text-xs text-white">
                      Shop Now
                    </span>
                  )}
                </div>

                {/* Reels Icon */}
                <div className="absolute top-3 right-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="opacity-80">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l6-5-6-5v10z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Play className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No videos available yet.</p>
          </div>
        )}
      </section>

      {/* FULL-SCREEN REELS MODE */}
      {isReelsMode && currentVideo && (
        <div
          ref={reelsContainerRef}
          className="fixed inset-0 z-50 bg-black"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Header with Close button and Cart */}
          <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
            {/* Add to Cart button */}
            <button
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-full text-white font-semibold transition-colors shadow-lg"
              onClick={() => currentVideo.productId ? setShowCartPopup(currentVideo) : toast.error('No product linked')}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>

            {/* Close button - Desktop */}
            <button
              onClick={closeReelsMode}
              className="flex items-center justify-center ml-4 transition-all hover:scale-110"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderRadius: '50%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <X className="w-6 h-6" style={{ color: '#333' }} />
            </button>
          </div>



          {/* Main Video - Full screen on mobile, Reel style on desktop */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative overflow-hidden w-full h-full md:w-auto md:rounded-2xl"
              style={{
                maxWidth: window.innerWidth >= 768 ? '450px' : '100%',
                height: window.innerWidth >= 768 ? '90vh' : '100%',
                aspectRatio: window.innerWidth >= 768 ? '9/16' : 'auto',
                borderRadius: window.innerWidth >= 768 ? '16px' : '0',
                boxShadow: window.innerWidth >= 768 ? '0 20px 60px rgba(0,0,0,0.5)' : 'none',
              }}
            >
              {renderReelsVideo(currentVideo)}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            </div>
          </div>

          {/* Right Side Actions - Instagram Reels Style */}
          <div
            className="absolute flex flex-col items-center gap-4 z-50"
            style={{
              right: '12px',
              bottom: '120px',
            }}
          >
            {/* Like Button */}
            <button
              className="flex flex-col items-center active:scale-90 transition-transform"
              style={{ background: 'transparent', border: 'none', padding: 0 }}
              onClick={() => toggleLike(currentVideo.id)}
            >
              <Heart
                className={`w-8 h-8 ${likedVideos.has(currentVideo.id) ? 'text-red-500 fill-red-500' : 'text-white'}`}
                strokeWidth={2}
              />
              <span className="text-white text-[11px] mt-0.5 font-medium">{likes[currentVideo.id] || 0}</span>
            </button>

            {/* Comment Button */}
            <button
              className="flex flex-col items-center active:scale-90 transition-transform"
              style={{ background: 'transparent', border: 'none', padding: 0 }}
              onClick={handleComment}
            >
              <MessageCircle className="w-8 h-8 text-white" strokeWidth={2} />
              <span className="text-white text-[11px] mt-0.5 font-medium">Chat</span>
            </button>

            {/* Share Button */}
            <button
              className="flex flex-col items-center active:scale-90 transition-transform"
              style={{ background: 'transparent', border: 'none', padding: 0 }}
              onClick={() => handleShare(currentVideo)}
            >
              <Share2 className="w-8 h-8 text-white" strokeWidth={2} />
              <span className="text-white text-[11px] mt-0.5 font-medium">Share</span>
            </button>

            {/* Save/Bookmark Button */}
            <button
              className="flex flex-col items-center active:scale-90 transition-transform"
              style={{ background: 'transparent', border: 'none', padding: 0 }}
              onClick={() => toggleSave(currentVideo.id)}
            >
              <Bookmark
                className={`w-8 h-8 ${savedVideos.has(currentVideo.id) ? 'text-white fill-white' : 'text-white'}`}
                strokeWidth={2}
              />
            </button>

            {/* Volume Button */}
            <button
              className="flex flex-col items-center active:scale-90 transition-transform mt-2"
              style={{ background: 'transparent', border: 'none', padding: 0 }}
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="w-7 h-7 text-white" strokeWidth={2} />
              ) : (
                <Volume2 className="w-7 h-7 text-white" strokeWidth={2} />
              )}
            </button>
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-6 left-4 right-20 z-20">
            {/* <h3 className="text-white font-bold text-lg mb-1">{currentVideo.title}</h3> */}
            {currentVideo.caption && <p className="text-white/80 text-sm line-clamp-2">{currentVideo.caption}</p>}

            {currentVideo.productId && (
              <button
                onClick={() => setShowCartPopup(currentVideo)}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Shop This Look
              </button>
            )}
          </div>

          {/* ADD TO CART POPUP */}
          {/* {showCartPopup && showCartPopup.productId && (
            <div
              className="absolute inset-0 z-40 flex items-end justify-center"
              onClick={() => setShowCartPopup(null)}
            >
              <div
                className="bg-white w-full max-w-md rounded-t-3xl p-6"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'slideUp 0.3s ease-out' }}
              >

                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

                <h3 className="text-lg font-bold text-gray-900 mb-4">Add to Cart</h3>


                <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl mb-4">
                  {products[showCartPopup.productId]?.image ? (
                    <img
                      src={products[showCartPopup.productId].image}
                      alt={products[showCartPopup.productId].name}
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {products[showCartPopup.productId]?.name || showCartPopup.title}
                    </p>
                    {products[showCartPopup.productId]?.price && (
                      <p className="text-teal-600 font-bold text-lg">
                        ₹{products[showCartPopup.productId].price}
                      </p>
                    )}
                  </div>
                </div>


                <div className="flex gap-3">
                  <button
                    onClick={() => addToCart(showCartPopup)}
                    className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                  <Link
                    to={`/product/${showCartPopup.productId}`}
                    className="py-3 px-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View
                  </Link>
                </div>
              </div>
            </div>
          )} */}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      <Footer />
    </div>
  );
}
