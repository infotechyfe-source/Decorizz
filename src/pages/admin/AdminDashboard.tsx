import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';
import { projectId } from "../../utils/supabase/info";

import {
    Package,
    DollarSign,
    Users,
    ShoppingBag,
    TrendingUp,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminDashboard() {
    const { accessToken } = useContext(AuthContext);

    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalProducts: 0,
        pendingDeliveries: 0,
    });

    const [loading, setLoading] = useState(true);
    const [cleaning, setCleaning] = useState(false);
    const [cleanResult, setCleanResult] = useState<any>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/stats`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Stats fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const cleanupDbSelected = async (prefixes: string[], includeUsers = false) => {
        if (!prefixes || prefixes.length === 0) { alert('Select at least one table prefix'); return; }
        setCleaning(true);
        try {
            const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/admin/cleanup`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ prefixes, includeUsers })
            });
            const d = await res.json();
            setCleanResult(d);
            fetchStats();
        } catch (e) {
            setCleanResult({ error: 'Request failed' });
        } finally {
            setCleaning(false);
        }
    };

    const cleanupDb = async (includeUsers = false) => {
        if (!confirm(includeUsers ? 'This will wipe ALL data including users. Continue?' : 'This will wipe content data (products, orders, videos, etc.). Continue?')) return;
        setCleaning(true);
        try {
            const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/admin/cleanup`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ includeUsers })
            });
            const d = await res.json();
            setCleanResult(d);
            fetchStats();
        } catch (e) {
            setCleanResult({ error: 'Request failed' });
        } finally {
            setCleaning(false);
        }
    };

    const statCards = [
        {
            title: "Total Orders",
            value: stats.totalOrders,
            icon: <Package className="w-6 h-6" />,
            bg: "bg-teal-500/10 text-teal-600",
        },
        {
            title: "Total Revenue",
            value: `₹ ${stats.totalRevenue.toFixed(2)}`,
            icon: <DollarSign className="w-6 h-6" />,
            bg: "bg-green-500/10 text-green-600",
        },
        {
            title: "Total Users",
            value: stats.totalUsers,
            icon: <Users className="w-6 h-6" />,
            bg: "bg-purple-500/10 text-purple-600",
        },
        {
            title: "Total Products",
            value: stats.totalProducts,
            icon: <ShoppingBag className="w-6 h-6" />,
            bg: "bg-orange-500/10 text-orange-600",
        },
        {
            title: "Pending Deliveries",
            value: stats.pendingDeliveries,
            icon: <TrendingUp className="w-6 h-6" />,
            bg: "bg-red-500/10 text-red-600",
        },
    ];

    const quickLinks = [
        {
            title: "Manage Products",
            path: "/admin/products",
            description: "Add, edit, and delete products",
        },
        {
            title: "Manage Orders",
            path: "/admin/orders",
            description: "Track and update customer orders",
        },
        {
            title: "Manage Users",
            path: "/admin/users",
            description: "View registered customers",
        },
        {
            title: "Manage Gallery",
            path: "/admin/gallery",
            description: "Upload and manage portfolio images",
        },
        {
            title: "Manage Testimonials",
            path: "/admin/testimonials",
            description: "Review and approve client feedback",
        },
    ];

    return (
        <AdminLayout title="Dashboard">
            {/* LOADING SPINNER */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-b-2 border-teal-600 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* STATS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
                        {statCards.map((stat, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition hover:shadow-md"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`${stat.bg} p-3 rounded-lg`}>
                                        {stat.icon}
                                    </div>
                                </div>

                                <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {quickLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    to={link.path}
                                    className="block p-6 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all group"
                                >
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                                        {link.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-2">
                                        {link.description}
                                    </p>
                                </Link>
                            ))}
                        </div>

                        {/* Cleanup Tool (Advanced) */}
                        <div className="p-6 rounded-xl border border-red-200 bg-red-50/50 mt-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Database Maintenance</h3>
                            <p className="text-sm text-slate-600 mb-6 max-w-2xl">
                                Select tables to clean up. <strong className="text-red-600">Warning: This action is irreversible.</strong>
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                                {['product:', 'order:', 'cart:', 'wishlist:', 'testimonial:', 'gallery:', 'faq:', 'contact:', 'video:', 'video-like:', 'video-comment:', 'notification:', 'payment:', 'reset:', 'reset-email:', 'user:'].map((p) => (
                                    <label key={p} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                        <input type="checkbox" value={p} className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300" />
                                        <span>{p.replace(':', '')}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => {
                                        const checks = Array.from(document.querySelectorAll('input[type="checkbox"][value]')) as HTMLInputElement[];
                                        const prefixes = checks.filter(c => c.checked).map(c => c.value);
                                        const includeUsers = prefixes.includes('user:');
                                        cleanupDbSelected(prefixes, includeUsers);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-50"
                                    disabled={cleaning}
                                >
                                    {cleaning ? 'Cleaning...' : 'Clean Selected'}
                                </button>
                                <button
                                    onClick={() => cleanupDb(true)}
                                    className="px-4 py-2 rounded-lg border border-red-200 text-red-700 font-medium hover:bg-red-50 transition disabled:opacity-50"
                                    disabled={cleaning}
                                >
                                    Clean All (Destructive)
                                </button>
                            </div>

                            {cleanResult && (
                                <pre className="mt-4 text-xs bg-slate-900 text-slate-300 p-4 rounded-lg border border-slate-700 overflow-auto max-h-40">
                                    {JSON.stringify(cleanResult, null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
