import React, { useEffect, useRef, useState } from "react";
import { getPlaceholderImage, preloadImage } from "../../utils/optimizeImage";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4=";

export function ImageWithFallback(
  props: React.ImgHTMLAttributes<HTMLImageElement>
) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const { src, alt, className = "", style, loading, decoding, fetchPriority, ...rest } = props as any;

  // Smart initialization: Start with placeholder for optimizable sources to prevent high-res race condition
  const getInitialSrc = (url: string) => {
    if (!url) return "";
    const shouldOptimize = url.includes("supabase.co") || url.includes("res.cloudinary.com");
    return shouldOptimize ? getPlaceholderImage(url) : url;
  };

  const [currentSrc, setCurrentSrc] = useState(() => getInitialSrc(src));
  const [isRetrying, setIsRetrying] = useState(false);
  // If loading="eager", start visible immediately (skip IntersectionObserver delay)
  const [isVisible, setIsVisible] = useState(loading === 'eager');

  useEffect(() => {
    if (!imgRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setIsVisible(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );
    obs.observe(imgRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    // Progressive load: placeholder first, then optimized when visible
    if (!src) return;
    const shouldOptimize = src.includes("supabase.co") || src.includes("res.cloudinary.com");

    const startLoad = async () => {
      try {
        // If cached, immediately show
        const probe = new Image();
        probe.src = src;
        if (probe.complete && probe.naturalWidth > 0) {
          setCurrentSrc(src);
          setLoaded(true);
          setError(false);
          setIsRetrying(false);
          return;
        }

        // Show tiny placeholder while preloading real image
        if (shouldOptimize) {
          setCurrentSrc(getPlaceholderImage(src));
          setLoaded(false);
        }

        await preloadImage(src);
        setCurrentSrc(src);
        setLoaded(true);
        setError(false);
        setIsRetrying(false);
      } catch (e) {
        // Fall back handled by onError
        setLoaded(false);
      }
    };

    if (isVisible) startLoad();
  }, [src, isVisible]);

  const handleError = () => {
    console.error("Image load failed:", currentSrc);

    if (isRetrying) {
      setError(true);
      return;
    }

    // 1. Cloudinary Fetch Fail -> Retry Original URL
    if (currentSrc && currentSrc.includes("/image/fetch/")) {
      // Extract the original URL at the end
      // Robust way: find the start of http/https
      const match = currentSrc.match(/(https?:\/\/.*)/);
      if (match && match[1]) {
        console.log("Retrying with original source (Cloudinary Fetch failed):", match[1]);
        setIsRetrying(true);
        setCurrentSrc(match[1]);
        return;
      }
    }

    // 2. Optimized Supabase Render Fail -> Retry Original Object URL
    if (currentSrc && currentSrc.includes("/render/image/public")) {
      // Revert to original storage URL (Supabase)
      const original = currentSrc
        .replace("/render/image/public", "/object/public")
        .split("?")[0];

      console.log("Retrying with original Supabase URL:", original);
      setIsRetrying(true);
      setCurrentSrc(original);
      return;
    }

    // 3. Cloudinary Upload Transform Fail -> Retry Original Cloudinary URL
    if (currentSrc && currentSrc.includes("res.cloudinary.com") && currentSrc.includes("/upload/w_")) {
      // Retry Cloudinary without frontend optimizations (strip generated params)
      // This handles cases where our optimizing logic creates invalid URLs
      // Just blindly try to load the 'src' prop (which is the DB url)
      console.log("Retrying with original Cloudinary source:", src);
      setIsRetrying(true);
      setCurrentSrc(src);
      return;
    }

    // No recovery possible
    setError(true);
  };

  // 🚨 Maintain perfect square aspect ratio ONLY if no specific style/class overrides it
  // But usually for product cards we want to fill parent. 
  // We'll trust the parent 'className' or 'style' to handle dimensions.
  // We only default to 100% w/h to fill container.

  // 🚫 IMAGE FAILED → Show fallback placeholder
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ ...style, width: '100%', height: '100%' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
    );
  }

  // 👍 MAIN IMAGE
  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`
        transition-opacity duration-500
        ${loaded ? "opacity-100" : "opacity-0"}
        ${className}
      `}
      style={{
        display: "block",
        // Remove forced aspect-ratio 1/1 so it fits parent containers (like 4/5 cards)
        ...style,
      }}
      loading={loading ?? "lazy"}
      decoding={decoding ?? "async"}
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
      {...(loaded ? { srcSet: (props as any).srcSet, sizes: (props as any).sizes } : {})}
      onLoad={() => setLoaded(true)}
      onError={handleError}
      {...rest}
    />
  );
}
