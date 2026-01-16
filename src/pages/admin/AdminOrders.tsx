import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from '../../context/AuthContext';
import { projectId } from "../../utils/supabase/info";
import { toast } from "sonner";
import AdminLayout from "../../components/admin/AdminLayout";
import { Package, Truck, CreditCard, ChevronDown, ChevronUp, FileDown } from "lucide-react";
import { generateInvoice } from "../../utils/generateInvoice";

export default function AdminOrders() {
    const { accessToken } = useContext(AuthContext);

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/orders`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error("Fetch orders error:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (
        orderId: string,
        status: string,
        paymentStatus?: string
    ) => {
        try {
            const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/orders/${orderId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ status, paymentStatus }),
                }
            );

            if (response.ok) {
                toast.success("Order updated");
                fetchOrders();
            } else {
                toast.error("Failed to update order");
            }
        } catch (error) {
            console.error("Update order error:", error);
            toast.error("Failed to update order");
        }
    };

    const toggleOrderExpand = (orderId: string) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    return (
        <AdminLayout title="Manage Orders">
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="h-10 w-10 border-b-2 border-teal-600 rounded-full animate-spin" />
                </div>
            ) : orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((order: any) => {
                        const isExpanded = expandedOrders.has(order.id);

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition"
                            >
                                {/* Header - Clickable to expand */}
                                <div
                                    className="bg-slate-50/50 p-4 md:p-6 border-b border-slate-100 cursor-pointer"
                                    onClick={() => toggleOrderExpand(order.id)}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-teal-100/50 p-3 rounded-xl text-teal-600">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                    Order #{order.id.slice(0, 8)}...
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${order.status === 'delivered' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            'bg-blue-100 text-blue-700 border-blue-200'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                        }`}>
                                                        {order.paymentStatus || 'pending'}
                                                    </span>
                                                </h3>
                                                <p className="text-slate-500 text-sm">
                                                    {order.shippingAddress?.fullName} • {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-teal-600">
                                                    ₹{order.total?.toFixed(0)}
                                                </p>
                                                <p className="text-xs text-slate-400">{order.items?.length || 0} items</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Content */}
                                {isExpanded && (
                                    <div className="p-6 animate-fadeIn">
                                        {/* Customer + Address */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span> Customer Details
                                                </h4>
                                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                                    <p className="text-slate-900 font-medium text-lg">{order.shippingAddress?.fullName}</p>
                                                    <p className="text-slate-600 mt-1">{order.shippingAddress?.phone}</p>
                                                    <p className="text-slate-500 text-sm mt-2">{order.userEmail}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                    <Truck className="w-4 h-4 text-slate-400" /> Shipping Address
                                                </h4>
                                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                                    <p className="text-slate-700 leading-relaxed">
                                                        {order.shippingAddress?.address}, {order.shippingAddress?.city}
                                                        <br />
                                                        {order.shippingAddress?.state} - <span className="font-mono text-slate-900">{order.shippingAddress?.zipCode}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="mb-6">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span> Items ({order.items?.length || 0})
                                            </h4>
                                            <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                                                <div className="divide-y divide-slate-100">
                                                    {order.items?.map((item: any, index: number) => {
                                                        const displayImage = item.customImage || item.image || '';
                                                        const isCustomCanvas = !!item.customImage || item.productName?.includes('Custom Print');

                                                        return (
                                                            <div key={index} className="p-4 flex items-center gap-4">
                                                                {/* Product Image */}
                                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 relative">
                                                                    {displayImage ? (
                                                                        <img
                                                                            src={displayImage}
                                                                            alt={item.productName}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                                                            No Image
                                                                        </div>
                                                                    )}
                                                                    {isCustomCanvas && (
                                                                        <span className="absolute top-1 left-1 bg-teal-500 text-white text-[8px] px-1 py-0.5 rounded font-semibold">
                                                                            Custom
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-slate-900 font-medium truncate">{item.productName}</p>
                                                                    <p className="text-slate-500 text-sm">
                                                                        {item.color && `${item.color} • `}{item.size} • Qty: {item.quantity}
                                                                    </p>
                                                                    {item.customArtStyle && (
                                                                        <p className="text-xs text-teal-600">Style: {item.customArtStyle}</p>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-slate-900 font-semibold">₹{(item.price * item.quantity).toFixed(0)}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Summary */}
                                        <div className="mb-6">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Order Summary
                                            </h4>
                                            <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Subtotal</span>
                                                        <span className="text-slate-900">₹{order.subtotal?.toFixed(0) || order.total?.toFixed(0)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Shipping</span>
                                                        {order.shipping === 0 ? (
                                                            <span className="text-green-600 font-medium">Free</span>
                                                        ) : (
                                                            <span className="text-slate-900">₹{order.shipping?.toFixed(0) || 0}</span>
                                                        )}
                                                    </div>

                                                    {/* Coupon Applied */}
                                                    {order.couponCode && order.discount > 0 && (
                                                        <div className="flex justify-between items-center bg-green-50 -mx-4 px-4 py-2 border-y border-green-100">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                                                                    {order.couponCode}
                                                                </span>
                                                                <span className="text-xs text-green-600">Coupon Applied</span>
                                                            </div>
                                                            <span className="text-green-600 font-semibold">-₹{order.discount?.toFixed(0)}</span>
                                                        </div>
                                                    )}

                                                    {/* Savings Breakdown */}
                                                    {(order.discount > 0 || order.shipping === 0) && (
                                                        <div className="bg-green-50 rounded-lg p-3 mt-2">
                                                            <p className="text-xs font-medium text-green-700 mb-2">Savings Breakdown:</p>
                                                            <div className="space-y-1 text-xs text-green-600">
                                                                <div className="flex justify-between">
                                                                    <span>Product Discount (15%)</span>
                                                                    <span>₹{Math.round((order.subtotal || order.total) * 0.15)}</span>
                                                                </div>
                                                                {order.shipping === 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span>Free Shipping</span>
                                                                        <span>₹49</span>
                                                                    </div>
                                                                )}
                                                                {order.couponCode && order.discount > 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span>Coupon ({order.couponCode})</span>
                                                                        <span>₹{order.discount?.toFixed(0)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between mt-2 pt-2 border-t border-green-200 text-sm font-semibold text-green-700">
                                                                <span>Total Savings</span>
                                                                <span>₹{(Math.round((order.subtotal || order.total) * 0.15) + (order.shipping === 0 ? 49 : 0) + (order.discount || 0)).toFixed(0)}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between pt-3 border-t border-slate-200 text-lg font-bold">
                                                        <span className="text-slate-900">Total</span>
                                                        <span className="text-teal-600">₹{order.total?.toFixed(0)}</span>
                                                    </div>

                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>Payment Method</span>
                                                        <span className="font-medium uppercase">{order.paymentMethod || 'Razorpay'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Controls */}
                                        <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            {/* Delivery Status */}
                                            <div className="flex-1">
                                                <label className="block text-slate-700 mb-2 font-semibold text-sm flex items-center gap-2">
                                                    <Truck className="w-4 h-4 text-teal-600" /> Delivery Status
                                                </label>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        updateOrderStatus(order.id, e.target.value);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>

                                            {/* Payment Status */}
                                            <div className="flex-1">
                                                <label className="block text-slate-700 mb-2 font-semibold text-sm flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-purple-600" /> Payment Status
                                                </label>
                                                <select
                                                    value={order.paymentStatus}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        updateOrderStatus(order.id, order.status, e.target.value);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="failed">Failed</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Download Invoice Button */}
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generateInvoice(order);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm"
                                            >
                                                <FileDown className="w-4 h-4" />
                                                Download Invoice
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Orders Found</h3>
                    <p className="text-slate-500">New orders will appear here.</p>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </AdminLayout>
    );
}
