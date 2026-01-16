import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { Search } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    console.log("Fetching products...");
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      console.log("API Response:", data);
      console.log("Products loaded:", data.products?.length || 0);
      setProducts(data.products || []);
    } catch (error) {
      console.error("Fetch products error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product: any) =>
    product?.name?.toLowerCase().includes(query.toLowerCase()) ||
    product?.category?.toLowerCase().includes(query.toLowerCase()) ||
    product?.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen content-offset" style={{ background: 'linear-gradient(135deg, #fdf9efff 0%, #f0fdf9 100%)' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-10">
          <Search className="w-8 h-8" style={{ color: '#14b8a6' }} />
          <h1
            className="text-4xl"
            style={{ fontWeight: 700, color: '#14b8a6' }}
          >
            Search Results
          </h1>
        </div>

        {/* Query Display */}
        <p className="text-gray-700 mb-4 text-lg">
          Showing results for:{" "}
          <span className="font-semibold" style={{ color: '#14b8a6' }}>
            "{query}"
          </span>
        </p>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: '#14b8a6' }}
            ></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <p className="text-gray-600 mb-8">
              Found{" "}
              <span className="font-semibold" style={{ color: '#14b8a6' }}>
                {filteredProducts.length}
              </span>{" "}
              product{filteredProducts.length !== 1 ? "s" : ""}
            </p>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product: any) => (
                <div key={product.id} className="rounded-2xl overflow-hidden">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        ) : (
          /* No Results */
          <div className="text-center py-16">
            <p className="text-2xl text-gray-700 mb-4 font-semibold">
              No products found
            </p>
            <p className="text-gray-500">
              Try different keywords or explore all collections.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
