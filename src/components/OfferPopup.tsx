import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { optimizeImage } from '../utils/optimizeImage';

interface Offer {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    coupon_code?: string;
    discount_value?: number;
    discount_type?: 'percentage' | 'fixed';
    is_active: boolean;
    created_at: string;
}

export function OfferPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [offer, setOffer] = useState<Offer | null>(null);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const isClosed = sessionStorage.getItem('offer_popup_closed');
        if (isClosed) {
            setIsLoading(false);
            return;
        }
        fetchActiveOffer();
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) handleClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const fetchActiveOffer = async () => {
        try {
            const { data } = await supabase
                .from('offers')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                setOffer(data);
                setTimeout(() => {
                    setIsOpen(true);
                    setIsLoading(false);
                }, 800);
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error fetching offer:', error);
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('offer_popup_closed', 'true');
    };

    const handleCopyCode = async () => {
        if (!offer?.coupon_code) return;
        try {
            await navigator.clipboard.writeText(offer.coupon_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (error) {
            console.error('Failed to copy code:', error);
        }
    };

    const formatDiscount = () => {
        if (!offer?.discount_value) return null;
        return offer.discount_type === 'percentage'
            ? `${offer.discount_value}%`
            : `₹${offer.discount_value}`;
    };

    if (!isOpen || !offer || isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            {/* Backdrop - bg-black from index.css */}
            <div
                className="absolute inset-0 bg-black"
                style={{ opacity: 0.7 }}
                onClick={handleClose}
            />

            {/* Modal - bg-teal, rounded-xl, overflow-hidden, shadow-2xl from index.css */}
            <div className="relative w-full max-w-md bg-teal rounded-xl overflow-hidden shadow-2xl popup-enter">

                {/* Close Button - rounded-full, bg-white/20 from index.css */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/20 text-white transition-all duration-200 cursor-pointer"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Discount Badge - rounded-full, bg-orange-500, flex, flex-col, items-center, justify-center from index.css */}
                {formatDiscount() && (
                    <div className="absolute top-4 ml-2 z-40 w-16 h-16 rounded-full bg-orange-500 flex flex-col items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg leading-none">{formatDiscount()}</span>
                        <span className="text-white text-xs font-medium">OFF</span>
                    </div>
                )}

                {/* Image Section - p-5 from index.css */}
                <div className="relative p-5 pb-0">
                    <div className="rounded-xl overflow-hidden shadow-lg">
                        {offer.image_url ? (
                            <img
                                src={optimizeImage(offer.image_url, 500)}
                                alt={offer.title}
                                className="w-full h-64 object-cover"
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-800 flex flex-col items-center justify-center gap-2">
                                <Sparkles className="w-16 h-16 text-white" style={{ opacity: 0.4 }} />
                                <span className="text-white font-medium" style={{ opacity: 0.6 }}>Special Offer</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section - p-5, space-y-4 from index.css */}
                <div className="p-4 py-6">

                    {/* Coupon Code Box - bg-white, rounded-xl, p-4, flex, items-center, justify-between from index.css */}
                    {offer.coupon_code && (
                        <button
                            onClick={handleCopyCode}
                            className="w-full p-4 rounded-xl bg-white flex items-center justify-between shadow-lg transition-all duration-200"
                            style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
                        >
                            <div className="text-left">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                                    Use Code
                                </p>
                                <p className="text-2xl font-bold text-gray-900 tracking-wider" style={{ fontFamily: 'monospace' }}>
                                    {offer.coupon_code}
                                </p>
                            </div>
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer"
                                style={{
                                    backgroundColor: copied ? '#22c55e' : '#f3f4f6',
                                    color: copied ? '#ffffff' : '#6b7280'
                                }}
                            >
                                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                            </div>
                        </button>
                    )}

                    {copied && (
                        <p className=" p-1 text-center text-sm text-white font-medium">
                            ✓ Copied to clipboard!
                        </p>
                    )}

                    {/* Shop Now Button - w-full, py-4, rounded-xl, bg-white, text-teal-500, font-bold, text-center, text-lg from index.css */}
                    {/* <a
                        href="/shop"
                        className="block w-full py-4 rounded-xl bg-white text-teal-500 font-bold text-center text-lg shadow-lg transition hover:bg-gray-50"
                    >
                        Shop Now →
                    </a> */}

                    {/* Dismiss Link - text-center, text-sm from index.css */}
                    {/* <button
                        onClick={handleClose}
                        className="w-full py-2 text-white text-sm text-center transition"
                        style={{ opacity: 0.7 }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                    >
                        Maybe later
                    </button> */}
                </div>
            </div>
        </div>
    );
}