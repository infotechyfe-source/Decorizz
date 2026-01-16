// Invoice Generator Utility
// Generates a professional HTML invoice and opens it in a new window for printing/downloading as PDF

interface OrderItem {
    productName: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
    frameColor?: string;
}

interface ShippingAddress {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
}

interface Order {
    id: string;
    createdAt: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    userEmail?: string;
    subtotal?: number;
    shipping?: number;
    discount?: number;
    couponCode?: string;
    total: number;
    paymentMethod?: string;
    paymentStatus?: string;
    status?: string;
}

export function generateInvoice(order: Order): void {
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const invoiceNumber = `DEC-${new Date(order.createdAt).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`;

    const subtotal = order.subtotal || order.total;
    const shipping = order.shipping || 0;
    const discount = order.discount || 0;
    const productSavings = Math.round(subtotal * 0.15);
    const shippingSavings = shipping === 0 ? 49 : 0;
    const totalSavings = productSavings + shippingSavings + discount;

    const invoiceHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber} - Decorizz</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f8fafc;
            padding: 20px;
        }
        .invoice-container {
            max-width: 850px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
            overflow: hidden;
        }
        
        /* Header */
        .invoice-header {
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%);
            color: white;
            padding: 40px;
            position: relative;
            overflow: hidden;
        }
        .invoice-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 400px;
            height: 400px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
        }
        .invoice-header::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -10%;
            width: 300px;
            height: 300px;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
        }
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
            z-index: 1;
        }
        .company-info {
            flex: 1;
        }
        .company-name {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -1px;
            margin-bottom: 8px;
        }
        .company-tagline {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 300;
        }
        .invoice-meta {
            text-align: right;
            background: rgba(255,255,255,0.15);
            padding: 20px 25px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }
        .invoice-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .invoice-number {
            font-size: 13px;
            opacity: 0.9;
            margin-bottom: 4px;
        }
        .invoice-date {
            font-size: 13px;
            opacity: 0.8;
        }
        
        /* Body */
        .invoice-body {
            padding: 40px;
        }
        
        /* Info Cards */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 25px;
            margin-bottom: 35px;
        }
        .info-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #14b8a6;
        }
        .info-card h3 {
            color: #0d9488;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 12px;
            font-weight: 700;
        }
        .info-card .primary {
            font-weight: 600;
            color: #1f2937;
            font-size: 15px;
            margin-bottom: 4px;
        }
        .info-card .secondary {
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
        }
        
        /* Items Table */
        .items-section {
            margin-bottom: 30px;
        }
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        .section-title h3 {
            font-size: 14px;
            font-weight: 700;
            color: #1f2937;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .section-title .line {
            flex: 1;
            height: 2px;
            background: linear-gradient(to right, #e2e8f0, transparent);
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .items-table th {
            background: linear-gradient(135deg, #0d9488, #14b8a6);
            color: white;
            padding: 14px 18px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        .items-table th:last-child,
        .items-table th:nth-child(3) {
            text-align: right;
        }
        .items-table td {
            padding: 16px 18px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }
        .items-table tr:last-child td {
            border-bottom: none;
        }
        .items-table tr:hover td {
            background: #fafafa;
        }
        .product-name {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }
        .product-details {
            font-size: 12px;
            color: #94a3b8;
        }
        .qty-cell {
            text-align: center;
            font-weight: 500;
        }
        .price-cell {
            text-align: right;
            color: #64748b;
        }
        .total-cell {
            text-align: right;
            font-weight: 600;
            color: #1f2937;
        }
        
        /* Summary Section */
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 320px;
            gap: 30px;
            margin-top: 30px;
        }
        
        /* Savings Card */
        .savings-card {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
            padding: 25px;
            border: 1px solid #bbf7d0;
        }
        .savings-card h4 {
            color: #166534;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .savings-card h4::before {
            content: '🎉';
        }
        .savings-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
            color: #15803d;
        }
        .savings-row.total {
            border-top: 2px dashed #86efac;
            margin-top: 12px;
            padding-top: 15px;
            font-weight: 700;
            font-size: 15px;
        }
        
        /* Totals Card */
        .totals-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            border: 1px solid #e2e8f0;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 14px;
            color: #64748b;
        }
        .totals-row .label {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .totals-row.discount {
            color: #16a34a;
            font-weight: 500;
        }
        .totals-row.grand-total {
            border-top: 2px solid #14b8a6;
            margin-top: 15px;
            padding-top: 18px;
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
        }
        .totals-row.grand-total .amount {
            color: #0d9488;
        }
        .coupon-tag {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        
        /* Footer */
        .invoice-footer {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 35px 40px;
        }
        .footer-content {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 30px;
        }
        .footer-section h4 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            opacity: 0.7;
        }
        .footer-section p {
            font-size: 13px;
            line-height: 1.8;
            opacity: 0.9;
        }
        .footer-section a {
            color: #5eead4;
            text-decoration: none;
        }
        .footer-bottom {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            text-align: center;
            font-size: 12px;
            opacity: 0.6;
        }
        
        /* Status Badges */
        .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-completed {
            background: #dcfce7;
            color: #166534;
        }
        .status-pending {
            background: #fef3c7;
            color: #b45309;
        }
        .status-processing {
            background: #dbeafe;
            color: #1e40af;
        }
        
        /* Thank You Banner */
        .thank-you-banner {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #fcd34d;
        }
        .thank-you-banner p {
            font-size: 14px;
            color: #92400e;
            font-weight: 500;
        }
        .thank-you-banner p strong {
            color: #78350f;
        }
        
        /* Print Styles */
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
            }
            .no-print {
                display: none !important;
            }
        }
        
        /* Print Button */
        .actions-bar {
            max-width: 850px;
            margin: 20px auto;
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        .print-btn {
            padding: 14px 35px;
            background: linear-gradient(135deg, #0d9488, #14b8a6);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3);
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="header-content">
                <div class="company-info">
                    <div class="company-name">Decorizz</div>
                    <div class="company-tagline">Premium Home Decor & Photo Frames</div>
                </div>
                <div class="invoice-meta">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-number">${invoiceNumber}</div>
                    <div class="invoice-date">${invoiceDate}</div>
                </div>
            </div>
        </div>

        <!-- Thank You Banner -->
        <div class="thank-you-banner">
            <p>Thank you for your order, <strong>${order.shippingAddress?.fullName || 'Valued Customer'}</strong>! We appreciate your business.</p>
        </div>

        <!-- Body -->
        <div class="invoice-body">
            <!-- Info Cards -->
            <div class="info-grid">
                <div class="info-card">
                    <h3>Bill To</h3>
                    <p class="primary">${order.shippingAddress?.fullName || 'N/A'}</p>
                    <p class="secondary">
                        ${order.shippingAddress?.phone || 'N/A'}<br>
                        ${order.userEmail || ''}
                    </p>
                </div>
                <div class="info-card">
                    <h3>Ship To</h3>
                    <p class="primary">${order.shippingAddress?.fullName || 'N/A'}</p>
                    <p class="secondary">
                        ${order.shippingAddress?.address || ''}<br>
                        ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}<br>
                        PIN: ${order.shippingAddress?.zipCode || ''}
                    </p>
                </div>
                <div class="info-card">
                    <h3>Order Info</h3>
                    <p class="secondary">
                        <strong>Payment:</strong> ${(order.paymentMethod || 'Online').toUpperCase()}<br>
                        <strong>Status:</strong> <span class="status-badge ${order.paymentStatus === 'completed' ? 'status-completed' : order.status === 'processing' ? 'status-processing' : 'status-pending'}">${order.paymentStatus || 'Pending'}</span><br>
                        <strong>Order:</strong> <span class="status-badge ${order.status === 'delivered' ? 'status-completed' : order.status === 'shipped' ? 'status-processing' : 'status-pending'}">${order.status || 'Processing'}</span>
                    </p>
                </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
                <div class="section-title">
                    <h3>Order Items</h3>
                    <div class="line"></div>
                </div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items?.map(item => `
                            <tr>
                                <td>
                                    <div class="product-name">${item.productName}</div>
                                    <div class="product-details">
                                        ${item.color ? `Color: ${item.color}` : ''}
                                        ${item.color && item.size ? ' • ' : ''}
                                        ${item.size ? `Size: ${item.size}` : ''}
                                        ${item.frameColor ? ` • Frame: ${item.frameColor}` : ''}
                                    </div>
                                </td>
                                <td class="qty-cell">${item.quantity}</td>
                                <td class="price-cell">₹${item.price?.toLocaleString('en-IN')}</td>
                                <td class="total-cell">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
                            </tr>
                        `).join('') || ''}
                    </tbody>
                </table>
            </div>

            <!-- Summary Section -->
            <div class="summary-grid">
                <!-- Savings Card -->
                <div class="savings-card">
                    <h4>Your Savings</h4>
                    <div class="savings-row">
                        <span>Product Discount (15%)</span>
                        <span>₹${productSavings.toLocaleString('en-IN')}</span>
                    </div>
                    ${shippingSavings > 0 ? `
                    <div class="savings-row">
                        <span>Free Shipping Benefit</span>
                        <span>₹${shippingSavings}</span>
                    </div>
                    ` : ''}
                    ${order.couponCode && discount > 0 ? `
                    <div class="savings-row">
                        <span>Coupon Discount (${order.couponCode})</span>
                        <span>₹${discount.toLocaleString('en-IN')}</span>
                    </div>
                    ` : ''}
                    <div class="savings-row total">
                        <span>Total Savings</span>
                        <span>₹${totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <!-- Totals Card -->
                <div class="totals-card">
                    <div class="totals-row">
                        <span class="label">Subtotal</span>
                        <span>₹${subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="totals-row">
                        <span class="label">Shipping</span>
                        <span>${shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                    </div>
                    ${order.couponCode && discount > 0 ? `
                    <div class="totals-row discount">
                        <span class="label">
                            Discount
                            <span class="coupon-tag">${order.couponCode}</span>
                        </span>
                        <span>-₹${discount.toLocaleString('en-IN')}</span>
                    </div>
                    ` : ''}
                    <div class="totals-row grand-total">
                        <span>Grand Total</span>
                        <span class="amount">₹${order.total.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="invoice-footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>About Decorizz</h4>
                    <p>
                        Premium quality photo frames and home decor products.<br>
                        We craft beautiful memories into timeless pieces for your home.
                    </p>
                </div>
                <div class="footer-section">
                    <h4>Contact Us</h4>
                    <p>
                        📧 <a href="mailto:info@decorizz.com">info@decorizz.com</a><br>
                        🌐 www.decorizz.com
                    </p>
                </div>
                <div class="footer-section">
                    <h4>Support</h4>
                    <p>
                        Need help with your order?<br>
                        Reach out to our support team.
                    </p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>© ${new Date().getFullYear()} Decorizz. All rights reserved. | This is a computer-generated invoice.</p>
            </div>
        </div>
    </div>

    <div class="actions-bar no-print">
        <button class="print-btn" onclick="window.print()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Invoice (PDF)
        </button>
    </div>
</body>
</html>
    `;

    // Open invoice in new window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
    }
}
