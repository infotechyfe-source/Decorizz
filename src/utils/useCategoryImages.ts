import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from './supabase/info';

// Cache key for localStorage
const CACHE_KEY = 'category_images_cache_v6';
const CACHE_EXPIRY_KEY = 'category_images_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const normalizeKey = (key: string) =>
  key.trim().replace(/-/g, ' ').replace(/\s+/g, ' ');

// All categories used in navbar dropdowns
export const ALL_CATEGORIES = [
  // Spiritual Art Gallery

  'Vastu Yatra Painting', // Also support alternate spelling
  'Ganesh Wall Art',
  'Radha Krishna Art',
  'Vishnu Art',
  'Buddha Painting',
  'Shiva Mahdev Art',
  'Ma Durga Art',
  'Jesus Art',
  'Islamic Art',

  // Decor Your Space
  'Animals Art',
  'Birds Art',
  'Natural Art',
  'Office Canvas Art',
  'Boho Art',
  'Wall Art',
  '3D Wall Art',
  '3 Set Art',
  '2 Set Art',
  'Mandela Art',

  // Neon Sign (Lighting)
  'Gods',
  'Cafe',
  'Gym',
  'Car',
  'Gaming',
  'Wings',
  'Kids',
  'Christmas',
  'Restaurant and Bar',

  // New Art Gallery
  'Gen Z Art',
  'Living Room Art',
  'Pop Art',
  'Bed Room Art',
  'Graffiti Art',
  'Abstract Art',
  'Bollywood Art',
  'Couple Art',

  // Acrylic Art Gallery
  'Animal Acrylic Art',
  'Spiritual Acrylic Art',
  'Gen Z Acrylic Art',

  // Shop Layouts & Subsections (Navbar Dropdown)
  'Square',
  'Circle',
  'Landscape',
  'Portrait',
  '2 Set',
  '3 Set',
  '2-Set',
  '3-Set',

  // Custom Neon Sign
  'Custom Neon Sign',
];
export interface CategoryImages {
  [category: string]: string;
}

// Default placeholder image
const DEFAULT_IMAGE = 'https://placehold.co/100x100?text=No+Image';

// Helper to get initial cached data synchronously
function getInitialCachedData(): CategoryImages {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);

    if (cachedData && cacheExpiry) {
      const expiryTime = parseInt(cacheExpiry, 10);
      if (Date.now() < expiryTime) {
        return JSON.parse(cachedData);
      }
    }
  } catch (e) {
    console.error('Error reading cache:', e);
  }
  return {};
}

/**
 * Hook to fetch and cache category images from products table
 */
export function useCategoryImages() {
  // Initialize with cached data immediately (synchronous)
  const [categoryImages, setCategoryImages] = useState<CategoryImages>(() => getInitialCachedData());
  const [loading, setLoading] = useState(() => Object.keys(getInitialCachedData()).length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have cached data, ensure core keys exist; otherwise refresh
    const hasCore = (img: CategoryImages) => {
      const core = ['Canvas', 'Frame', 'Rolled', 'Square', 'Circle', 'Landscape'];
      return core.every((k) => typeof img[k] === 'string' && img[k].length > 0);
    };

    if (Object.keys(categoryImages).length > 0 && hasCore(categoryImages)) {
      setLoading(false);
      return;
    }

    fetchCategoryImages();
  }, []);

  const fetchCategoryImages = async () => {
    try {
      // Check cache first (double-check in case of race condition)
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);

      if (cachedData && cacheExpiry) {
        const expiryTime = parseInt(cacheExpiry, 10);
        if (Date.now() < expiryTime) {
          // Cache is valid, use cached data
          setCategoryImages(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      }

      // Fetch from API - get products like ShopPage does
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products?t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      const products = data.products || [];

      // Build category -> image map
      const imageMap: CategoryImages = {};

      if (products && products.length > 0) {
        for (const product of products) {
          // Handle image field - can be 'image' (single) or 'images' (array)
          let firstImage: string | null = null;
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            firstImage = product.images[0];
          } else if (product.image) {
            firstImage = product.image;
          }

          if (!firstImage) continue;

          // Handle both single category and categories array
          const productCategories: string[] = [];

          if (product.categories && Array.isArray(product.categories)) {
            productCategories.push(...product.categories);
          }
          if (product.category) {
            productCategories.push(product.category);
          }

          // Also add layout to valid keys (for Square, Circle, Landscape)
          if (product.layout) {
            // Normalized check to match standard casing if needed, but shop usually uses capital first
            const layout = product.layout.charAt(0).toUpperCase() + product.layout.slice(1).toLowerCase();
            productCategories.push(layout);
          }
          // Add format (Canvas, Frame, Rolled)
          if (product.format) {
            const fmt = String(product.format);
            const formatNorm = fmt.charAt(0).toUpperCase() + fmt.slice(1).toLowerCase();
            productCategories.push(formatNorm);
          }
          if (product.subsection) {
            // Navbar expects "2 Set" / "3 Set", DB might have "2-Set"
            // Normalize to ensure key match
            const subsection = product.subsection.replace('-', ' ');
            productCategories.push(subsection);
            // Also push original just in case
            productCategories.push(product.subsection);
          }

          // Assign image to each category/layout/subsection if not already assigned
         for (const cat of productCategories) {
  const catKey = normalizeKey(cat);

  // Find the actual category key in ALL_CATEGORIES
  const matchKey = ALL_CATEGORIES.find(c => normalizeKey(c) === catKey);

  if (matchKey && !imageMap[matchKey] && firstImage) {
    imageMap[matchKey] = firstImage;
  }
}



        }
      }

      // Add default images for categories without products
      for (const cat of ALL_CATEGORIES) {
        if (!imageMap[cat]) {
          imageMap[cat] = DEFAULT_IMAGE;
        }
      }
     console.log('Category Images Map:', imageMap);
      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(imageMap));
      localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));

      setCategoryImages(imageMap);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching category images:', err);
      setError(err.message);
      setLoading(false);

      // Try to use cached data even if expired
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setCategoryImages(JSON.parse(cachedData));
      }
    }
  };

  // Function to manually refresh cache
  const refreshCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    setLoading(true);
    fetchCategoryImages();
  };

  // Get image for a specific category
  const getImage = (category: string): string => {
    // Normalize keys like '2-Set' vs '2 Set'
    const norm = category.replace('-', ' ');
    return categoryImages[category] || categoryImages[norm] || DEFAULT_IMAGE;
  };

  return {
    categoryImages,
    loading,
    error,
    refreshCache,
    getImage,
  };
}

/**
 * Utility function to clear category images cache
 * Call this when products are added/updated in admin
 */
export function clearCategoryImagesCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_EXPIRY_KEY);
}
