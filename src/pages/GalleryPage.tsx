import React, { useEffect, useState, useContext } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { X } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AuthContext } from "../context/AuthContext";
import { toast } from "sonner";

export default function GalleryPage() {
  const { user, accessToken } = useContext(AuthContext);
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/gallery`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setGalleryItems(data.galleryItems || []);
    } catch (error) {
      console.error("Gallery fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", "Events", "Studio", "Outdoor", "Portrait"];

  // MEMOIZED DATA PROCESSING
  const { years, itemsByYear, totalPages, flattened } = React.useMemo(() => {
    // 1. Filter
    const filtered = filter === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === filter);

    // 2. Group by Year
    const grouped = filtered.reduce((acc, item) => {
      const year = item.year ?? new Date().getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(item);
      return acc;
    }, {});

    const sortedYearsAll = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

    // 3. Flatten for global pagination
    const flat = sortedYearsAll.flatMap((year) =>
      grouped[year].map((item) => ({ ...item, __year: year }))
    );

    const pages = Math.ceil(flat.length / ITEMS_PER_PAGE);

    // 4. Paginate
    const paginated = flat.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    // 5. Re-group for display
    const displayGroups = paginated.reduce((acc, item) => {
      if (!acc[item.__year]) acc[item.__year] = [];
      acc[item.__year].push(item);
      return acc;
    }, {});

    const displayYears = Object.keys(displayGroups).sort((a, b) => Number(b) - Number(a));

    return {
      years: displayYears,
      itemsByYear: displayGroups,
      totalPages: pages,
      flattened: flat
    };
  }, [galleryItems, filter, currentPage]);

  const addToCart = async (productId: string) => {
    try {
      if (!user) return toast.error('Login to add to cart');
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ productId, quantity: 1 })
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Failed');
      toast.success('Added to cart');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen content-offset premium-bg">
      <Navbar />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Aligned with About Page / Home Page standards */}
          {/* Aligned with Contact Page standards */}
          <div className="premium-card-glow p-8 sm:p-12 animate-fade-scale">
            <h1 className="text-center custom-heading">
              Our <span className="text-gradient-teal">Gallery</span>
            </h1>
            <p className="text-center max-w-3xl mx-auto italic text-base sm:text-lg" style={{ color: "#4b5563" }}>
              A curated collection of artwork captured across events, studios, outdoor moments and creative visuals — all crafted with passion.
            </p>
          </div>
        </div>
      </section>

      {/* FILTER SECTION */}
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="
      flex 
      gap-3 
      overflow-x-auto 
      no-scrollbar
      md:flex-wrap 
      md:overflow-visible
    "
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`pill ${filter === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>



      {/* GALLERY */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-12 w-12 border-b-2 border-teal-500 rounded-full"></div>
          </div>
        ) : flattened.length === 0 ? (
          <p className="text-center py-20 text-gray-500 text-lg">
            No items found
          </p>
        ) : (
          <div className="space-y-16">
            {years.map((year) => (
              <div key={year}>
                <div className="flex items-center gap-4 mb-10 pt-12 border-b border-gray-200 pb-4">
                  <h2 className="text-3xl sm:text-4xl font-rashi font-bold text-gray-900">
                    {year}
                  </h2>
                  <div className="h-1 flex-1 bg-gradient-to-r from-teal-500/20 to-transparent rounded-full"></div>
                </div>

                {/* TWO IMAGES PER ROW ALWAYS */}
                <div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6">
                  {itemsByYear[year].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedImage(item)}
                      className="curved-image-card cursor-pointer">
                      <div className="w-full aspect-[4/3] bg-gray-100">
                        <ImageWithFallback
                          src={item.thumbUrl || item.image}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="p-4">
                        <h3 className="font-rashi font-semibold text-lg" style={{ color: "#1f2937" }}>
                          {item.title}
                        </h3>

                        {item.productId && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(item.productId);
                              }}
                              className="px-3 py-1 rounded border"
                              style={{ borderColor: "#e5e7eb", color: "#1f2937" }}
                            >
                              Add to Cart
                            </button>

                            <a
                              href={`/product/${item.productId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1 rounded premium-btn-white"
                            >
                              View Product
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* PAGINATION */}
      {flattened.length > ITEMS_PER_PAGE && (
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-3 flex-wrap pb-12">

            {/* Prev */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-full border shadow-sm transition-all ${currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-50 text-gray-800"
                }`}
            >
              Prev
            </button>

            {/* Page Numbers */}
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-full border shadow-sm transition-all ${currentPage === i + 1
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {i + 1}
              </button>
            ))}

            {/* Next */}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-full border shadow-sm transition-all ${currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-50 text-gray-800"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-10 h-10" />
          </button>

          <div
            className="max-w-4xl w-full max-h-[90vh] bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageWithFallback
              src={selectedImage.image}
              className="w-full max-h-[70vh] object-contain mx-auto rounded-xl"
            />

            <h2 className="text-3xl font-rashi text-center mt-4 text-gray-100">
              {selectedImage.title}
            </h2>

            <p className="text-center text-gray-400 mt-2 max-w-2xl mx-auto">
              {selectedImage.description}
            </p>
            {selectedImage.productId && (
              <div className="mt-4 flex justify-center gap-3">
                <button onClick={() => addToCart(selectedImage.productId)} className="px-4 py-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition">Add to Cart</button>
                <a href={`/product/${selectedImage.productId}`} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 transition">View Product</a>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

