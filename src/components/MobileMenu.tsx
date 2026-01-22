import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ChevronRight, HelpCircle, MapPin, LogIn, Phone, Mail, LogOut, Home, Image, Sun, Grid, Heart, ShoppingCart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useCategoryImages } from '../utils/useCategoryImages';
import logo from "../assets/logo-r.png";

// Fallback placeholder image
const PLACEHOLDER_IMG = 'https://placehold.co/100x100?text=Loading...';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    cartCount: number;
    wishlistCount: number;
}

// Navigation Data Structure with category names for dynamic images
const navItems = [
    {
        label: 'Home',
        to: '/',
        icon: <Home className="w-5 h-5 text-teal-600" />,
        category: null
    },
    {
        label: 'Shop',
        to: '/shop',
        icon: <Grid className="w-5 h-5 text-teal-600" />,
        submenu: [
            { label: '2 Set', to: '/shop?subsection=2-Set', category: '2-Set' },
            { label: '3 Set', to: '/shop?subsection=3-Set', category: '3-Set' },
            { label: 'Square', to: '/shop?subsection=Square', category: 'Square' },
            { label: 'Circle', to: '/shop?layout=Circle', category: 'Circle' },
            { label: 'Landscape', to: '/shop?layout=Landscape', category: 'Landscape' },
        ]
    },

    {
        label: 'Spiritual Art',
        to: '/spiritual-art-gallery',
        icon: <Image className="w-5 h-5" />,
        submenu: [
            { label: 'Vastu Yatra Painting', to: '/spiritual-art-gallery?category=Vastu Yatra Painting', category: 'Vastu Yatra Painting' },
            { label: 'Ganesh Wall Art', to: '/spiritual-art-gallery?category=Ganesh Wall Art', category: 'Ganesh Wall Art' },
            { label: 'Radha/Krishna Art', to: '/spiritual-art-gallery?category=Radha Krishna Art', category: 'Radha Krishna Art' },
            { label: 'Vishnu Art', to: '/spiritual-art-gallery?category=Vishnu Art', category: 'Vishnu Art' },
            { label: 'Buddha Painting', to: '/spiritual-art-gallery?category=Buddha Painting', category: 'Buddha Painting' },
            { label: 'Shiva/Mahdev Art', to: '/spiritual-art-gallery?category=Shiva Mahdev Art', category: 'Shiva Mahdev Art' },
            // { label: 'Ma Durga Art', to: '/spiritual-art-gallery?category=Ma Durga Art', category: 'Ma Durga Art' },
            { label: 'Jesus Art', to: '/spiritual-art-gallery?category=Jesus Art', category: 'Jesus Art' },
            { label: 'Islamic Art', to: '/spiritual-art-gallery?category=Islamic Art', category: 'Islamic Art' },
        ]
    },
    {
        label: 'Decorative Art',
        to: '/decor-by-room',
        icon: <MapPin className="w-5 h-5" />,
        submenu: [
            { label: 'Animals Art', to: '/decor-by-room?category=Animals Art', category: 'Animals Art' },
            { label: 'Birds Art', to: '/decor-by-room?category=Birds Art', category: 'Birds Art' },
            { label: 'Natural Art', to: '/decor-by-room?category=Natural Art', category: 'Natural Art' },
            { label: 'Office Canvas Art', to: '/decor-by-room?category=Office Canvas Art', category: 'Office Canvas Art' },
            { label: 'Boho Art', to: '/decor-by-room?category=Boho Art', category: 'Boho Art' },
            { label: 'Wall Art', to: '/decor-by-room?category=Wall Art', category: 'Wall Art' },
            { label: '3D Wall Art', to: '/decor-by-room?category=3D Wall Art', category: '3D Wall Art' },
            { label: '3 Set Art', to: '/decor-by-room?category=3 Set Art', category: '3 Set Art' },
            { label: '2 Set Art', to: '/decor-by-room?category=2 Set Art', category: '2 Set Art' },
            { label: 'Mandela Art', to: '/decor-by-room?category=Mandela Art', category: 'Mandela Art' },
        ]
    },

    {
        label: 'New Art',
        to: '/new-art-gallery',
        icon: <Grid className="w-5 h-5" />,
        submenu: [
            { label: 'Gen Z Art', to: '/new-art-gallery?category=Gen Z Art', category: 'Gen Z Art' },
            { label: 'Living Room Art', to: '/new-art-gallery?category=Living Room Art', category: 'Living Room Art' },
            { label: 'Pop Art', to: '/new-art-gallery?category=Pop Art', category: 'Pop Art' },
            { label: 'Bed Room Art', to: '/new-art-gallery?category=Bed Room Art', category: 'Bed Room Art' },
            { label: 'Graffiti Art', to: '/new-art-gallery?category=Graffiti Art', category: 'Graffiti Art' },
            { label: 'Abstract Art', to: '/new-art-gallery?category=Abstract Art', category: 'Abstract Art' },
            { label: 'Bollywood Art', to: '/new-art-gallery?category=Bollywood Art', category: 'Bollywood Art' },
            { label: 'Couple Art', to: '/new-art-gallery?category=Couple Art', category: 'Couple Art' },
            { label: 'Restaurant & Bar', to: '/new-art-gallery?category=Restaurant and Bar', category: 'Restaurant and Bar' },
        ]
    },

    {
        label: 'Neon Sign',
        to: '/lighting',
        icon: <Sun className="w-5 h-5" />,
        submenu: [
            { label: 'Gods', to: '/lighting?category=Gods', category: 'Gods' },
            { label: 'Café', to: '/lighting?category=Cafe', category: 'Cafe' },
            { label: 'Gym', to: '/lighting?category=Gym', category: 'Gym' },
            { label: 'Car', to: '/lighting?category=Car', category: 'Car' },
            { label: 'Gaming', to: '/lighting?category=Gaming', category: 'Gaming' },
            { label: 'Wings', to: '/lighting?category=Wings', category: 'Wings' },
            { label: 'Kids', to: '/lighting?category=Kids', category: 'Kids' },
        ]
    },


    {
        label: 'Acrylic Art',
        to: '/acrylic-art-gallery',
        icon: <Grid className="w-5 h-5" />,
        submenu: [
            { label: 'Animal Acrylic Art', to: '/acrylic-art-gallery?category=Animal Acrylic Art', category: 'Animal Acrylic Art' },
            { label: 'Spiritual Acrylic Art', to: '/acrylic-art-gallery?category=Spiritual Acrylic Art', category: 'Spiritual Acrylic Art' },
            { label: 'Gen Z Acrylic Art', to: '/acrylic-art-gallery?category=Gen Z Acrylic Art', category: 'Gen Z Acrylic Art' },
        ]
    },
    {
        label: 'Custom Designs',
        to: '/product/custom/custom-print-round-canvas-wall-art',
        icon: <Grid className="w-5 h-5 text-teal-600" />,
        submenu: [
            { label: 'Round Canvas', to: '/product/custom/custom-print-round-canvas-wall-art', category: 'Circle' },
            { label: 'Square Canvas', to: '/product/custom/custom-print-square-canvas-wall-art', category: 'Square' },
            { label: 'Portrait Canvas', to: '/product/custom/custom-print-portrait-canvas-wall-art', category: 'Portrait' },
            { label: 'Landscape Canvas', to: '/product/custom/custom-print-landscape-canvas-wall-art', category: 'Landscape' },
            { label: 'Custom Neon Sign', to: '/product/custom/custom-name-neon-signs-lights', category: 'Wings' },
        ]
    },
];

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, cartCount, wishlistCount }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);

    // Fetch category images from backend
    const { getImage } = useCategoryImages();

    const renderIcon = (ico: React.ReactElement) => {
        return React.cloneElement(ico, { className: "w-6 h-6", strokeWidth: 2.25 });
    };

    const toggleSubmenu = (menu: string) => {
        setOpenSubmenu(openSubmenu === menu ? null : menu);
    };


    const handleLogout = () => {
        logout();
        onClose();
        navigate('/');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex xl:hidden" data-lenis-prevent>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-500 ease-in-out"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className="relative w-full h-full flex flex-col shadow-xl animate-in slide-in-from-left duration-500 ease-out pt-8"
                style={{
                    background: 'linear-gradient(180deg, #f8fffe 0%, #faf9f5 100%)',
                    backdropFilter: 'blur(12px)'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 mb-2 bg-white/70 backdrop-blur-sm">
                    {/* Logo & Brand */}
                    <Link to="/" onClick={onClose} className="flex items-center gap-3">
                        <img
                            src={logo}
                            alt="Decorizz Logo"
                            className="h-10 w-auto object-contain"
                        />
                        <span className="text-2xl font-extrabold text-accent glow-accent">DECORIZZ</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {/* <Link to="/wishlist" onClick={onClose} className="relative inline-flex items-center justify-center" style={{ color: '#3b2f27' }}>
                            <Heart className="w-6 h-6" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-teal-600 rounded-full border-2 border-white shadow-md">
                                    {wishlistCount > 99 ? '99+' : wishlistCount}
                                </span>
                            )}
                        </Link>
                        <Link to="/cart" onClick={onClose} className="relative inline-flex items-center justify-center" style={{ color: '#3b2f27' }}>
                            <ShoppingCart className="w-6 h-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-teal-600 rounded-full border-2 border-white shadow-md">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link> */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-all duration-200"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative z-10 pb-10" data-lenis-prevent>

                    {/* Navigation Links with Accordions */}
                    <div className="px-4 space-y-3">
                        {/* Main Navigation Items */}
                        {navItems.map((item, idx) => {
                            const isOpenMenu = openSubmenu === item.label;
                            const hasSubmenu = item.submenu && item.submenu.length > 0;

                            // If no submenu, render as a simple link
                            if (!hasSubmenu) {
                                return (
                                    <Link
                                        key={idx}
                                        to={item.to}
                                        onClick={onClose}
                                        className="soft-card flex items-center justify-between px-5 py-4 rounded-lg border border-gray-200 bg-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all group"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50 ring-1 ring-teal-100 text-accent shrink-0">
                                                {renderIcon(item.icon as React.ReactElement)}
                                            </div>
                                            <span className="text-sm font-semibold text-brand leading-none">{item.label}</span>
                                        </div>
                                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-50 text-accent shrink-0 leading-none">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </Link>
                                );
                            }

                            // Otherwise render as accordion
                            return (
                                <div
                                    key={idx}
                                    className="soft-card rounded-lg overflow-hidden border border-gray-200 bg-white shadow-md"
                                >
                                    {/* Header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleSubmenu(item.label)}
                                        className="w-full flex items-center justify-between px-5 py-4"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50 ring-1 ring-teal-100 text-accent shrink-0">
                                                {renderIcon(item.icon as React.ReactElement)}
                                            </div>
                                            <span className="text-sm font-semibold text-brand leading-none">{item.label}</span>
                                        </div>

                                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-50 text-accent shrink-0 leading-none">
                                            <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isOpenMenu ? "rotate-90" : ""}`} />
                                        </div>
                                    </button>


                                    {/* Submenu with smooth grid-based animation */}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateRows: isOpenMenu ? '1fr' : '0fr',
                                            transition: 'grid-template-rows 300ms ease-in-out',
                                        }}
                                    >
                                        <div style={{ overflow: 'hidden' }}>
                                            <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-4">
                                                {/* View All */}
                                                <Link
                                                    to={item.to}
                                                    onClick={onClose}
                                                    className="col-span-2 flex items-center justify-between p-3 bg-teal-50 rounded-xl group"
                                                >
                                                    <span className="text-lg font-semibold text-gray-700">
                                                        View All {item.label}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                               

                                                {item.submenu.map((sub, subIdx) => (
                                                    <Link
                                                        key={subIdx}
                                                        to={sub.to}
                                                        onClick={onClose}
                                                        className="flex flex-col items-center gap-2 p-2 rounded-lg bg-white shadow-sm active:scale-[0.99] transition-all"
                                                    >
                                                        <div className="w-32 h-32 rounded-lg overflow-hidden shadow-md">
                                                            <img
                                                                src={getImage(sub.category)}
                                                                alt={sub.label}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                                                            />
                                                        </div>
                                                        <span className="block text-base font-semibold text-brand text-center opacity-100 leading-none mt-1">
                                                            {sub.label}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    </div>

                </div>

               {/* Footer Actions - Enhanced */}
                <div className="py-2 px-6 pt-8 border-gray-600 bg-gradient-to-t from-gray-200 to-white z-20">

                    {/* User Section */}
                    {user ? (

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-xl font-bold shadow-lg shadow-red-200/50 active:scale-[0.98] transition-all duration-200 hover:from-red-600 hover:to-red-700 cursor-pointer"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>

                    ) : (
                        <Link
                            to="/login"
                            onClick={onClose}
                            className="flex w-full items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-200/50 active:scale-[0.98] transition-all duration-200 hover:from-teal-600 hover:to-teal-700 bg-teal-600"
                        >
                            <LogIn className="w-5 h-5" />
                            <span className=''>Login to Account</span>
                        </Link>
                    )}

                    {/* Quick Actions - Bottom Bar */}
                    <div className="flex items-center justify-between pt-2">
                        {[
                            { icon: <Phone className="w-5 h-5" />, label: "Call Us", href: "tel:+919876543210" },
                            { icon: <Mail className="w-5 h-5" />, label: "Email", href: "mailto:support@decorizz.com" },

                        ].map((item, idx) => (
                            item.href ? (
                                <a
                                    key={idx}
                                    href={item.href}
                                    className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-teal-50 transition-colors group"
                                >
                                    <div className="text-gray-500 group-hover:text-teal-600 transition-colors">
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-600 group-hover:text-teal-700">
                                        {item.label}
                                    </span>
                                </a>
                            ) : (
                                <Link
                                    key={idx}
                                    to={item.to || "#"}
                                    onClick={onClose}
                                    className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-teal-50 transition-colors group"
                                >
                                    <div className="text-gray-500 group-hover:text-teal-600 transition-colors">
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-600 group-hover:text-teal-700">
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        ))}
                    </div>

                    {/* Cart and Wishlist Links (Mobile Exclusive) */}

                    {/* User Profile / Login */}
                    <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-100 mt-auto">
                        <p className="text-[10px] text-gray-400 text-center font-medium">
                            © 2025 Decorizz. All rights reserved.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
