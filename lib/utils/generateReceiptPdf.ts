import { jsPDF } from 'jspdf';
import { WINSOR_LOGO_BASE64 } from './logoBase64';

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

  // ── Luxury Color Palette ────────────────────────────────────────────────
  const primaryGold = [139, 105, 20];   // #8B6914
  const lightGold = [212, 175, 55];    // #D4AF37
  const paleGoldText = [243, 227, 184]; // #F3E3B8
  const accentDark = [26, 18, 9];      // #1A1209
  const textGray = [90, 90, 90];
  const lightBg = [250, 247, 240];     // #FAF7F0
  const emeraldGreen = [34, 112, 44];  // #22702C
  const emeraldBg = [232, 245, 233];

  // ── 1. HEADER SECTION (Dark Maison Banner with Official Emblem) ──────
  const headerH = 44;
  doc.setFillColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.rect(0, 0, pageWidth, headerH, 'F');

  // Decorative gold top accent bar
  doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Add Official Winsor Gold Emblem Image
  if (WINSOR_LOGO_BASE64) {
    try {
      const logoW = 52;
      const logoH = 16.5;
      const logoX = (pageWidth - logoW) / 2;
      const logoY = 6;
      doc.addImage(WINSOR_LOGO_BASE64, 'PNG', logoX, logoY, logoW, logoH);
    } catch (e) {
      console.warn('Failed to embed logo image into PDF:', e);
      // Fallback text if image fails
      doc.setTextColor(paleGoldText[0], paleGoldText[1], paleGoldText[2]);
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.text('W I N S O R   M A I S O N', pageWidth / 2, 16, { align: 'center' });
    }
  }

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(lightGold[0], lightGold[1], lightGold[2]);
  doc.text('BESPOKE TIMEPIECE CURATION & HAUTE HORLOGERIE', pageWidth / 2, 27, { align: 'center' });

  // Receipt Label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 170, 150);
  doc.text('OFFICIAL INVOICE & ORDER RECEIPT', pageWidth / 2, 33, { align: 'center' });

  let y = 48;

  // ── 2. ORDER META INFO BANNER ─────────────────────────────────────────
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'D');

  // Order Ref (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('ORDER REFERENCE', margin + 8, y + 7);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.text(data.orderRef, margin + 8, y + 15);

  // Date (Center)
  const formattedDate = data.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('DATE OF ISSUANCE', pageWidth / 2 - 12, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(formattedDate, pageWidth / 2 - 12, y + 15);

  // Payment Status Badge (Right)
  const badgeW = 44;
  const badgeH = 13;
  const badgeX = pageWidth - margin - badgeW - 4;
  const badgeY = y + 4.5;

  doc.setFillColor(emeraldBg[0], emeraldBg[1], emeraldBg[2]);
  doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text('CONFIRMED & PAID', badgeX + (badgeW / 2), badgeY + 8.5, { align: 'center' });

  y += 30;

  // ── 3. CUSTOMER & DELIVERY INFORMATION BOX ────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text('DELIVERY & CONTACT DETAILS', margin, y);

  y += 2.5;
  doc.setDrawColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 55, y);

  y += 5.5;
  const infoBoxH = 34;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), infoBoxH, 2, 2, 'DF');

  // Customer info column 1
  const col1ValX = margin + 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Customer Name:', margin + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer.name || 'Valued Customer', col1ValX, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Email Address:', margin + 6, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer.email || 'N/A', col1ValX, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Mobile Number:', margin + 6, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer.mobile || 'N/A', col1ValX, y + 24);

  // Address column 2
  const col2X = pageWidth / 2 + 6;
  const col2ValX = col2X + 28;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Delivery Address:', col2X, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text((data.customer.address || 'N/A').slice(0, 32), col2ValX, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('City & Postal:', col2X, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(`${data.customer.city || ''} ${data.customer.postalCode ? '- ' + data.customer.postalCode : ''}`, col2ValX, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Country:', col2X, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer.country || 'Sri Lanka', col2ValX, y + 24);

  y += 42;

  // ── 4. ORDERED TIMEPIECES TABLE ────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text('ORDERED TIMEPIECES', margin, y);

  y += 2.5;
  doc.setDrawColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 45, y);

  y += 5.5;
  // Table Header Bar
  const tableW = pageWidth - (margin * 2);
  doc.setFillColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.rect(margin, y, tableW, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(paleGoldText[0], paleGoldText[1], paleGoldText[2]);

  doc.text('#', margin + 4, y + 5.5);
  doc.text('TIMEPIECE DESCRIPTION & SPECIFICATIONS', margin + 14, y + 5.5);
  doc.text('QTY', margin + 115, y + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', margin + 148, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', margin + tableW - 4, y + 5.5, { align: 'right' });

  y += 8;

  // Table Body Rows (Row Height: 13mm for 2-line clean item specs)
  data.items.forEach((item, index) => {
    const rowH = 13;
    const rowBg = index % 2 === 0 ? [255, 255, 255] : [250, 247, 240];

    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, tableW, rowH, 'F');
    doc.setDrawColor(230, 224, 212);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowH, margin + tableW, y + rowH);

    // Index
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
    doc.text(String(index + 1), margin + 4, y + 7.5);

    // Title (Line 1 - Bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
    doc.text(item.productTitle.slice(0, 52), margin + 14, y + 5.5);

    // Specs / Model (Line 2 - Gray)
    const modelText = item.productModelNo ? `Model: ${item.productModelNo}` : '';
    const colorText = item.colorVariant ? ` · Color: ${item.colorVariant}` : '';
    const subText = `${modelText}${colorText}`.trim() || 'Haute Horlogerie Timepiece';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(subText.slice(0, 60), margin + 14, y + 10.2);

    // Qty
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
    doc.text(String(item.quantity), margin + 115, y + 7.5, { align: 'center' });

    // Unit Price
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.text(`LKR ${item.price.toLocaleString()}`, margin + 148, y + 7.5, { align: 'right' });

    // Amount
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text(`LKR ${(item.price * item.quantity).toLocaleString()}`, margin + tableW - 4, y + 7.5, { align: 'right' });

    y += rowH;
  });

  y += 8;

  // ── 5. FINANCIAL TOTALS SUMMARY & OFFICIAL PAID STAMP SEAL ─────────────
  // Totals Box (Right Side)
  const totalsW = 85;
  const totalsX = margin + tableW - totalsW;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Subtotal Amount:', totalsX, y + 1);

  doc.setFont('courier', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(`LKR ${data.subtotal.toLocaleString()}`, margin + tableW - 4, y + 1, { align: 'right' });

  if (data.discountAmount && data.discountAmount > 0) {
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.text('Coupon Discount:', totalsX, y + 1);

    doc.setFont('courier', 'normal');
    doc.text(`- LKR ${data.discountAmount.toLocaleString()}`, margin + tableW - 4, y + 1, { align: 'right' });
  }

  y += 7;
  // Grand Total Dark Banner Box
  const grandBoxH = 11;
  doc.setFillColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.roundedRect(totalsX - 4, y - 3, totalsW + 4, grandBoxH, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(paleGoldText[0], paleGoldText[1], paleGoldText[2]);
  doc.text('TOTAL PAID:', totalsX, y + 4);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(lightGold[0], lightGold[1], lightGold[2]);
  doc.text(`LKR ${data.finalTotal.toLocaleString()}`, margin + tableW - 4, y + 4, { align: 'right' });

  // ── OFFICIAL PAID STAMP SEAL (Positioned safely on the Left Side) ───────
  // Placed at X = margin + 32, Y centered beside the totals summary so there is ZERO overlap!
  const stampCenterX = margin + 35;
  const stampCenterY = y - 4; // Positioned cleanly to the left of financial summary

  // Outer circular stamp border
  doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.setLineWidth(1.2);
  doc.circle(stampCenterX, stampCenterY, 17, 'S');

  // Inner dotted circular border
  doc.setLineWidth(0.4);
  doc.circle(stampCenterX, stampCenterY, 14.5, 'S');

  // Stamp text inside (Clean fonts without unencoded symbols)
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text('W I N S O R   M A I S O N', stampCenterX, stampCenterY - 6.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('P A I D', stampCenterX, stampCenterY + 1.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('VERIFIED & CONFIRMED', stampCenterX, stampCenterY + 7, { align: 'center' });

  // ── 6. FOOTER SECTION ──────────────────────────────────────────────────
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
  doc.text(`Official Computer Generated Receipt · Reference Code: ${data.orderRef}`, pageWidth / 2, footerY + 4, { align: 'center' });

  // Save the PDF
  const filename = `Winsor_Receipt_${data.orderRef.replace(/[^A-Za-z0-9\-]/g, '_')}.pdf`;
  doc.save(filename);
}
