import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen content-offset premium-bg flex flex-col">
            <SEO
                title="Page Not Found"
                description="The page you're looking for doesn't exist. Browse our collection of premium wall frames and canvas art."
                url="/404"
            />
            <Navbar />

            <div className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="text-center max-w-lg">
                    {/* 404 Illustration */}
                    <div className="relative mb-8">
                        <div className="text-[150px] sm:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-400 to-teal-600 leading-none select-none">
                            404
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/80 backdrop-blur-sm shadow-xl flex items-center justify-center">
                                <span className="text-4xl sm:text-5xl">🖼️</span>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                        Oops! Page Not Found
                    </h1>
                    <p className="text-gray-600 mb-8 text-base sm:text-lg">
                        The page you're looking for doesn't exist or has been moved.
                        Let's get you back to exploring our beautiful frames!
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                            style={{ backgroundColor: '#14b8a6' }}
                        >
                            <Home className="w-5 h-5" />
                            Go to Homepage
                        </Link>

                        <Link
                            to="/shop"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold border-2 border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600 transition-all"
                        >
                            <Search className="w-5 h-5" />
                            Browse Shop
                        </Link>
                    </div>

                    {/* Go Back Link */}
                    <button
                        onClick={() => window.history.back()}
                        className="mt-8 inline-flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go back to previous page
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
