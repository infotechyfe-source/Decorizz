import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  CheckCircle,
  Download,
  Package,
  Clock,
} from "lucide-react";
import { projectId } from "../utils/supabase/info";
import { AuthContext } from '../context/AuthContext';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const { accessToken } = React.useContext(AuthContext);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/orders`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const data = await response.json();
      const foundOrder = data.orders.find((o: any) => o.id === orderId);
      setOrder(foundOrder);
    } catch (error) {
      console.error("Fetch order error:", error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // 📄 Generate PDF Invoice
  // -------------------------------
  const handleDownloadInvoice = () => {
    if (!order) return;

    const doc = new jsPDF();

    // Header - Company Name
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(20, 184, 166); // Teal color
    doc.text("DECORIZZ", 14, 20);

    // Invoice Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("INVOICE", 14, 32);

    // Horizontal line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, 36, 196, 36);

    // Order Details
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Order ID: ${order.id}`, 14, 45);
    const isCod = String(order.paymentMethod || '').toLowerCase().includes('cod');
    doc.text(`Payment Status: ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}`, 14, 52);
    doc.text(`Payment Method: ${isCod ? 'COD (10% advance paid)' : (order.paymentMethod || 'N/A')}`, 14, 59);
    if (isCod) {
      doc.text(`COD Terms: 10% paid online, remaining on delivery`, 14, 66);
    }
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })}`, 14, isCod ? 73 : 66);

    // Shipping Address Section
    const shippingStartY = isCod ? 80 : 72;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Shipping Address:", 14, shippingStartY);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    const addressLines = [
      order.shippingAddress.fullName || 'N/A',
      order.shippingAddress.phone || 'N/A',
      order.shippingAddress.address || 'N/A',
      `${order.shippingAddress.city || 'N/A'}, ${order.shippingAddress.state || 'N/A'} - ${order.shippingAddress.zipCode || 'N/A'}`
    ];

    let yPos = shippingStartY + 8;
    addressLines.forEach(line => {
      doc.text(line, 14, yPos);
      yPos += 7;
    });

    // Items Table
    const items = order.items.map((item: any) => [
      item.productName || 'Product',
      item.size || 'N/A',
      item.color || 'N/A',
      item.quantity.toString(),
      `Rs. ${Number(item.price).toFixed(0)}`,
      `Rs. ${(Number(item.price) * item.quantity).toFixed(0)}`,
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [["Product", "Size", "Color", "Qty", "Price", "Total"]],
      body: items,
      theme: 'striped',
      headStyles: {
        fillColor: [20, 184, 166], // Teal
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [31, 41, 55],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 32, halign: 'right' },
        5: { cellWidth: 34, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // Summary Box Background
    doc.setFillColor(249, 250, 251);
    const boxHeight = isCod ? 44 : 30;
    doc.rect(120, finalY - 5, 76, boxHeight, 'F');

    // Summary Section
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);

    const labelX = 125;
    const valueX = 191;

    doc.text("Subtotal:", labelX, finalY + 3);
    doc.text(`Rs. ${Number(order.subtotal).toFixed(0)}`, valueX, finalY + 3, { align: 'right' });

    doc.text("Shipping:", labelX, finalY + 10);
    doc.text(Number(order.shipping) === 0 ? 'Free' : `Rs. ${Number(order.shipping).toFixed(0)}`, valueX, finalY + 10, { align: 'right' });

    // Separator line
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.line(125, finalY + 14, 191, finalY + 14);

    // Grand Total
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 184, 166);
    doc.text("Grand Total:", labelX, finalY + 21);
    doc.text(`Rs. ${Number(order.total).toFixed(0)}`, valueX, finalY + 21, { align: 'right' });

    if (isCod) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const advance = Number((Number(order.total) * 0.10).toFixed(0));
      const remaining = Number((Number(order.total) - advance).toFixed(0));
      doc.text("Advance (10%):", labelX, finalY + 28);
      doc.text(`Rs. ${advance.toFixed(0)}`, valueX, finalY + 28, { align: 'right' });
      doc.text("Remaining on delivery:", labelX, finalY + 35);
      doc.text(`Rs. ${remaining.toFixed(0)}`, valueX, finalY + 35, { align: 'right' });
    }

    // Footer Section
    const footerY = 270;

    // Footer background
    doc.setFillColor(31, 41, 55);
    doc.rect(0, footerY, 210, 27, 'F');

    // Footer text
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("Thank you for shopping with Decorizz!", 105, footerY + 8, { align: 'center' });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(209, 213, 219);
    doc.text("For support, contact us at support@decorizz.com", 105, footerY + 14, { align: 'center' });
    doc.text("www.decorizz.com", 105, footerY + 19, { align: 'center' });

    doc.save(`Decorizz-Invoice-${order.id}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen content-offset">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: "#14b8a6" }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen content-offset">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl text-gray-900 mb-4">Order not found</h1>
          <Link to="/" className="text-teal-600 hover:underline">
            Return to homepage
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen content-offset" style={{ background: 'linear-gradient(135deg, #fdf9efff 0%, #f0fdf9 100%)' }}>
      <Navbar />

      {/* Decorative Squares */}
      <div className="flex justify-between max-w-5xl mx-auto px-4 pt-10">
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded border-2 border-gray-200"></div>
          <div className="w-10 h-10 rounded border-2 border-gray-200"></div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded border-2 border-gray-200"></div>
          <div className="w-10 h-10 rounded border-2 border-gray-200"></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Success Icon */}
        <div className="text-center mb-10">
          <CheckCircle
            className="w-20 h-20 mx-auto mb-4"
            style={{ color: "#14b8a6" }}
          />
          <h1 className="text-4xl text-gray-900 font-bold mb-2">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase 💚
          </p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border p-8 mb-6 border-white/50">
          <div className="flex items-center justify-between mb-6 pb-6 border-b">
            <div>
              <p className="text-gray-600">Order Number</p>
              <p className="text-2xl font-semibold text-gray-900">{order.id}</p>
            </div>

            <button
              onClick={handleDownloadInvoice}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow transition"
              style={{ backgroundColor: "#14b8a6" }}
            >
              <Download className="w-5 h-5" />
              Download Invoice
            </button>
          </div>

          {/* Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Address */}
            <div className="flex items-start gap-3">
              <Package className="w-6 h-6 text-teal-600 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Shipping Address</p>
                <p className="text-gray-600">
                  {order.shippingAddress.fullName} <br />
                  {order.shippingAddress.address} <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                </p>
              </div>
            </div>

            {/* Delivery */}
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-teal-600 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">
                  Estimated Delivery
                </p>
                <p className="text-gray-600">5–7 business days</p>
              </div>
            </div>

            {/* Payment */}
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Payment Status</p>
                <p className="text-gray-600 capitalize">
                  {order.paymentStatus}
                </p>
                <p className="text-gray-600 mt-1">
                  Payment Method: {order.paymentMethod || 'N/A'}
                </p>
                {String(order.paymentMethod || '').toLowerCase().includes('cod') && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p>Advance paid: ₹{(Number(order.total) * 0.10).toFixed(0)}</p>
                    <p>Remaining on delivery: ₹{(Number(order.total) * 0.90).toFixed(0)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Order Items
            </h2>

            <div className="space-y-4">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <p className="text-gray-900 font-medium">
                      {item.productName}
                    </p>
                    <p className="text-gray-500">
                      {item.color} • {item.size} • Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="text-gray-900 font-medium">
                    ₹{(item.price * item.quantity).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal).toFixed(0)}</span>
              </div>

              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>
                  {Number(order.shipping) === 0 ? "Free" : `₹${Number(order.shipping).toFixed(0)}`}
                </span>
              </div>

              <div className="flex justify-between text-xl font-semibold text-gray-900">
                <span>Total</span>
                <span>₹{Number(order.total).toFixed(0)}</span>
              </div>
              {String(order.paymentMethod || '').toLowerCase().includes('cod') && (
                <>
                  <div className="flex justify-between text-gray-700">
                    <span>Advance (10%)</span>
                    <span>₹{(Number(order.total) * 0.10).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Remaining on delivery</span>
                    <span>₹{(Number(order.total) * 0.90).toFixed(0)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-4">
          <Link
            to="/account"
            className="flex-1 py-3 rounded-xl text-white text-center shadow transition"
            style={{ backgroundColor: "#14b8a6" }}
          >
            View My Orders
          </Link>

          <Link
            to="/shop"
            className="flex-1 py-3 rounded-xl border text-center border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
