export const optimizeImage = (
  url: string,
  width = 800,
  quality = 80
) => {
  if (!url) return "";

  const q = quality === 100 ? "q_100" : `q_${quality}`;

  // Cloudinary Upload URLs
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace(
      "/upload/",
      `/upload/w_${width},${q},f_auto,c_limit/`
    );
  }

  // Cloudinary Fetch URLs
  if (url.includes("/image/fetch/")) {
    return url.replace(
      /\/image\/fetch\/[^/]+\//,
      `/image/fetch/${q},f_auto,w_${width},c_limit/`
    );
  }

  // Supabase → Cloudinary Fetch
  if (url.includes("supabase.co")) {
    const cloudName = "dxpabpzkf";
    return `https://res.cloudinary.com/${cloudName}/image/fetch/${q},f_auto,w_${width},c_limit/${url}`;
  }

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
