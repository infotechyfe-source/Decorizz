import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { Trash2, Plus, Edit, X, Upload } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { optimizeImage } from '../../utils/optimizeImage';
import AdminSidebar from './AdminSidebar';

interface Offer {
    id: string;
    title: string;
    description: string;
    image_url: string;
    coupon_code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    is_active: boolean;
    created_at: string;
}

export default function AdminOffers() {
    const { accessToken } = useContext(AuthContext);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Sidebar state
    const [sidebarWidth, setSidebarWidth] = useState(256);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const onResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const [formData, setFormData] = useState<Partial<Offer>>({
        title: '',
        description: '',
        image_url: '',
        coupon_code: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: 0,
        is_active: false,
    });

    useEffect(() => {
        if (accessToken) {
            fetchOffers();
        }
    }, [accessToken]);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/offers`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const data = await response.json();
            if (response.ok) {
                setOffers(data.offers || []);
            } else {
                throw new Error(data.error || 'Failed to fetch offers');
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;

        try {
            setSubmitting(true);

            // Sanitize payload: convert empty strings to null for optional fields
            const payload = {
                ...formData,
                discount_value: Number(formData.discount_value),
                min_order_amount: Number(formData.min_order_amount),
                coupon_code: formData.coupon_code?.trim() || null,
                image_url: formData.image_url?.trim() || null,
                description: formData.description?.trim() || null,
            };

            let response;
            if (editingId) {
                // Update
                response = await fetch(
                    `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/offers/${editingId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify(payload),
                    }
                );
            } else {
                // Create
                response = await fetch(
                    `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/offers`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify(payload),
                    }
                );
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.details || data.error || 'Failed to save offer');
            }

            toast.success(editingId ? 'Offer updated successfully' : 'Offer created successfully');
            setIsModalOpen(false);
            resetForm();
            fetchOffers();
        } catch (error: any) {
            console.error('Error saving offer:', error);
            toast.error(error.message || 'Failed to save offer');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            title: '',
            description: '',
            image_url: '',
            coupon_code: '',
            discount_type: 'percentage',
            discount_value: 0,
            min_order_amount: 0,
            is_active: false,
        });
    };

    const handleEdit = (offer: Offer) => {
        setEditingId(offer.id);
        setFormData(offer);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this offer?')) return;
        if (!accessToken) return;

        try {
            const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/offers/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete offer');
            }

            toast.success('Offer deleted');
            fetchOffers();
        } catch (error: any) {
            console.error('Error deleting offer:', error);
            toast.error(error.message || 'Failed to delete offer');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `offer-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('make-52d68140-gallery')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('make-52d68140-gallery')
                .getPublicUrl(filePath);

            if (data.publicUrl) {
                setFormData({ ...formData, image_url: data.publicUrl });
                toast.success('Image uploaded successfully');
            } else {
                throw new Error('Failed to get public URL');
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error(error.message || 'Image upload failed');
        }
    };

    const handleToggleActive = async (offer: Offer) => {
        if (!accessToken) return;
        try {
            const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/offers/${offer.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ is_active: !offer.is_active }),
                }
            );

            if (!response.ok) throw new Error('Failed to update status');

            toast.success(`Offer ${!offer.is_active ? 'activated' : 'deactivated'}`);
            fetchOffers();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Admin Sidebar */}
            <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />

            {/* Main Content */}
            <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">Offers & Coupons</h1>
                        <p className="text-gray-500 mt-1">Manage popup offers and discount codes</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Offer
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-12 w-12 border-b-2 border-gray-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {offers.map((offer) => (
                            <div key={offer.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${offer.is_active ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-200'}`}>
                                <div className="relative aspect-video bg-gray-100">
                                    {offer.image_url ? (
                                        <ImageWithFallback src={optimizeImage(offer.image_url, 400)} className="w-full h-full object-cover" alt={offer.title} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            onClick={() => handleEdit(offer)}
                                            className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-teal-600 transition"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(offer.id)}
                                            className="p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{offer.title}</h3>
                                        <button
                                            onClick={() => {
                                                setEditingId(offer.id);
                                                setFormData({
                                                    title: offer.title,
                                                    description: offer.description || '',
                                                    image_url: offer.image_url || '',
                                                    coupon_code: offer.coupon_code || '',
                                                    discount_type: offer.discount_type,
                                                    discount_value: offer.discount_value,
                                                    min_order_amount: offer.min_order_amount,
                                                    is_active: offer.is_active
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{offer.description}</p>

                                    <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg mb-4">
                                        <div className="flex justify-between py-1 border-b border-gray-200">
                                            <span className="text-gray-500">Code</span>
                                            <span className="font-mono font-bold text-gray-800">{offer.coupon_code || '-'}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-gray-500">Discount</span>
                                            <span className="text-green-600 font-bold">
                                                {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t mt-4">
                                        <span className="text-sm font-medium text-gray-700">Status</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={offer.is_active}
                                                onChange={() => handleToggleActive(offer)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                            <span className="ms-3 text-sm font-medium text-gray-900 group-hover:text-teal-600">
                                                {offer.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn shadow-2xl">
                            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Offer' : 'New Offer'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-normal mb-1 text-gray-700">Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 transition bg-white text-gray-900"
                                                placeholder="e.g. Summer Sale"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-normal mb-1 text-gray-700">Coupon Code</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.coupon_code}
                                                onChange={e => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                                                className="w-full p-2 border border-gray-300 rounded-lg font-mono uppercase bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                                placeholder="SUMMER20"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700">Type</label>
                                                <select
                                                    value={formData.discount_type}
                                                    onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white text-gray-900"
                                                >
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Fixed Amount (₹)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700">Value</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.discount_value}
                                                    onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white text-gray-900"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">Min Order Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.min_order_amount}
                                                onChange={e => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white text-gray-900"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">Popup Image</label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative group min-h-[160px] flex flex-col justify-center">
                                                {formData.image_url ? (
                                                    <>
                                                        <img src={formData.image_url} alt="Preview" className="w-full h-32 object-contain rounded-lg" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl cursor-pointer">
                                                            <span className="text-white text-sm font-medium">Change Image</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="py-4 text-gray-400">
                                                        <Upload className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                                        <span className="text-sm">Click to upload image</span>
                                                    </div>
                                                )}
                                                <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white text-gray-900"
                                                placeholder="Offer description..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition font-medium shadow-md hover:shadow-lg"
                                    >
                                        {submitting ? 'Saving...' : 'Save Offer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
