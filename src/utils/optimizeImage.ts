export const optimizeImage = (url: string, width = 800, quality = 80) => {
  if (!url) return "";
  
  // Handle Cloudinary Upload URLs (already on Cloudinary)
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto,c_limit/`);
  }

  // Handle already Cloudinary Fetch URLs - replace params
  if (url.includes("/image/fetch/")) {
      return url.replace(/\/image\/fetch\/[^/]+\//, `/image/fetch/f_auto,q_auto,w_${width},c_limit/`);
  }

  // Handle Supabase URLs -> Use Cloudinary Fetch
  if (url.includes("supabase.co")) {
    // Cloudinary Fetch URL format: https://res.cloudinary.com/<cloud_name>/image/fetch/f_auto,q_auto,w_<width>/<original_url>
    const cloudName = 'dxpabpzkf'; // Using the same cloud name as in cloudinary.ts
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_${width},c_limit/${url}`;
  }

  // Other URLs (external) -> Return as is or use Cloudinary fetch if desired for all external images
  // For now, we only target Supabase images as requested.
  return url;
};

// Generate a tiny placeholder URL for blur-up effect
export const getPlaceholderImage = (url: string) => {
  if (!url) return "";
  
  // Handle already Cloudinary Fetch URLs - replace params for placeholder
  if (url.includes("/image/fetch/")) {
    return url.replace(/\/image\/fetch\/[^/]+\//, '/image/fetch/w_30,e_blur,f_auto,q_auto/');
  }

  // Handle Cloudinary Upload URLs
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace('/upload/', '/upload/w_30,e_blur,f_auto,q_auto/');
  }

  if (url.includes("supabase.co")) {
     const cloudName = 'dxpabpzkf';
     return `https://res.cloudinary.com/${cloudName}/image/fetch/w_30,e_blur,f_auto,q_auto/${url}`;
  }

  return url;
};

// Preload critical images (for hero/above-fold images)
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
};
