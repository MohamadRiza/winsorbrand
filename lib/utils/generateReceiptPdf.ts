import { jsPDF } from 'jspdf';

export interface ReceiptItem {
  productTitle: string;
  productModelNo?: string;
  colorVariant?: string;
  quantity: number;
  price: number;
}

export interface ReceiptCustomerInfo {
  name: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ReceiptData {
  orderRef: string;
  date?: string;
  customer: ReceiptCustomerInfo;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount?: number;
  finalTotal: number;
  paymentMethod?: string;
}

export function generateReceiptPdf(data: ReceiptData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  let y = 18;

  // ── Colors ─────────────────────────────────────────────────────────────
  const primaryGold = [139, 105, 20]; // #8B6914
  const accentDark = [26, 18, 9];    // #1A1209
  const textGray = [80, 80, 80];
  const lightBg = [250, 247, 240];   // #FAF7F0
  const emeraldGreen = [46, 125, 50]; // #2E7D32

  // ── Header Box ─────────────────────────────────────────────────────────
  doc.setFillColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative gold top border strip
  doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Winsor Maison Header Logo Text
  doc.setTextColor(243, 227, 184); // Gold-light
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('✦  W I N S O R   M A I S O N  ✦', pageWidth / 2, y, { align: 'center' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55); // #D4AF37
  doc.text('BESPOKE TIMEPIECE CURATION & HAUTE HORLOGERIE', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFontSize(7.5);
  doc.setTextColor(180, 170, 150);
  doc.text('OFFICIAL INVOICE & ORDER RECEIPT', pageWidth / 2, y, { align: 'center' });

  y = 50;

  // ── Order Meta Info Banner ─────────────────────────────────────────────
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'D');

  // Order Ref (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('ORDER REFERENCE', margin + 6, y + 7);

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.text(data.orderRef, margin + 6, y + 15);

  // Date (Center)
  const formattedDate = data.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('DATE OF ISSUANCE', pageWidth / 2 - 10, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(formattedDate, pageWidth / 2 - 10, y + 15);

  // Payment Status Badge (Right)
  doc.setFillColor(232, 245, 233); // Emerald light bg
  doc.setDrawColor(46, 125, 50);
  doc.roundedRect(pageWidth - margin - 48, y + 4, 42, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text('✓ CONFIRMED & PAID', pageWidth - margin - 27, y + 12, { align: 'center' });

  y += 30;

  // ── Customer & Delivery Information Box ────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text('DELIVERY & CONTACT DETAILS', margin, y);

  y += 3;
  doc.setDrawColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 55, y);

  y += 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 34, 2, 2, 'DF');

  // Customer info column 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Customer Name:', margin + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer.name, margin + 35, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Email Address:', margin + 6, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer.email, margin + 35, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Mobile Number:', margin + 6, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer.mobile, margin + 35, y + 24);

  // Address column 2
  const col2X = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Delivery Address:', col2X, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer.address, col2X + 28, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('City & Postal:', col2X, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(`${data.customer.city}, ${data.customer.postalCode}`, col2X + 28, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Country:', col2X, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer.country, col2X + 28, y + 24);

  y += 42;

  // ── Items Table ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text('ORDERED TIMEPIECES', margin, y);

  y += 3;
  doc.setDrawColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.line(margin, y, margin + 45, y);

  y += 5;
  // Table Header bar
  doc.setFillColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(243, 227, 184);
  doc.text('#', margin + 4, y + 5.5);
  doc.text('TIMEPIECE DESCRIPTION', margin + 14, y + 5.5);
  doc.text('QTY', pageWidth - margin - 65, y + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', pageWidth - margin - 35, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', pageWidth - margin - 4, y + 5.5, { align: 'right' });

  y += 8;

  // Table Body Rows
  data.items.forEach((item, index) => {
    const rowBg = index % 2 === 0 ? [255, 255, 255] : [250, 247, 240];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, pageWidth - (margin * 2), 11, 'F');
    doc.setDrawColor(235, 230, 220);
    doc.line(margin, y + 11, pageWidth - margin, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);

    // Index
    doc.text(String(index + 1), margin + 4, y + 7);

    // Title & Details
    const variantStr = item.colorVariant ? ` (${item.colorVariant})` : '';
    const modelStr = item.productModelNo ? ` [Model: ${item.productModelNo}]` : '';
    const fullTitle = `${item.productTitle}${variantStr}${modelStr}`;
    doc.setFont('helvetica', 'bold');
    doc.text(fullTitle.slice(0, 48), margin + 14, y + 7);

    // Quantity
    doc.setFont('helvetica', 'normal');
    doc.text(String(item.quantity), pageWidth - margin - 65, y + 7, { align: 'center' });

    // Unit Price
    doc.setFont('courier', 'normal');
    doc.text(`LKR ${item.price.toLocaleString()}`, pageWidth - margin - 35, y + 7, { align: 'right' });

    // Total Amount
    doc.setFont('courier', 'bold');
    doc.text(`LKR ${(item.price * item.quantity).toLocaleString()}`, pageWidth - margin - 4, y + 7, { align: 'right' });

    y += 11;
  });

  y += 6;

  // ── Financial Totals Summary & Official Paid Seal ───────────────────────
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Subtotal Amount:', totalsX, y);
  doc.setFont('courier', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(`LKR ${data.subtotal.toLocaleString()}`, pageWidth - margin - 4, y, { align: 'right' });

  if (data.discountAmount && data.discountAmount > 0) {
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.text('Coupon Discount:', totalsX, y);
    doc.setFont('courier', 'normal');
    doc.text(`- LKR ${data.discountAmount.toLocaleString()}`, pageWidth - margin - 4, y, { align: 'right' });
  }

  y += 7;
  // Grand Total Box
  doc.setFillColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.roundedRect(totalsX - 4, y - 4, totalsWidth + 4, 12, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(243, 227, 184);
  doc.text('TOTAL PAID:', totalsX, y + 3.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(212, 175, 55);
  doc.text(`LKR ${data.finalTotal.toLocaleString()}`, pageWidth - margin - 4, y + 3.5, { align: 'right' });

  // ── Official PAID Stamp Seal (Left side bottom) ────────────────────────
  const stampCenterX = margin + 35;
  const stampCenterY = y - 2;

  // Outer circular stamp border
  doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.setLineWidth(1.2);
  doc.circle(stampCenterX, stampCenterY, 18, 'S');

  // Inner dotted circular border
  doc.setLineWidth(0.4);
  doc.circle(stampCenterX, stampCenterY, 15.5, 'S');

  // Stamp text inside
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text('★ WINSOR MAISON ★', stampCenterX, stampCenterY - 7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('P A I D', stampCenterX, stampCenterY + 1.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('VERIFIED & CONFIRMED', stampCenterX, stampCenterY + 7.5, { align: 'center' });

  // ── Footer ─────────────────────────────────────────────────────────────
  const footerY = pageHeight - 16;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Thank you for choosing Winsor Maison. For order inquiries or support, visit winsorbrand.com or email info@winsorbrand.com', pageWidth / 2, footerY, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  doc.text(`Computer Generated Receipt · Reference Code: ${data.orderRef}`, pageWidth / 2, footerY + 4, { align: 'center' });

  // Save the PDF
  const filename = `Winsor_Receipt_${data.orderRef.replace(/[^A-Za-z0-9\-]/g, '_')}.pdf`;
  doc.save(filename);
}
