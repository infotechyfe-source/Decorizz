import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Star } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Fetch testimonials error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen content-offset">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl text-center mb-4" style={{ color: '#1f2937', fontWeight: 700 }}>Customer Testimonials</h1>
        <p className="text-xl text-center mb-12" style={{ color: '#4b5563' }}>
          See what our customers have to say about FrameShop
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#14b8a6' }}></div>
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial: any) => (
              <div key={testimonial.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <p className="text-gray-900">{testimonial.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p style={{ color: '#6b7280' }}>No testimonials available yet</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
