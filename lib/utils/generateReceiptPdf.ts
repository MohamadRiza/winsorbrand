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
  mobile?: string;
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
  couponCode?: string;
  discountPercent?: number;
  discountAmount?: number;
  finalTotal: number;
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'pending' | 'failed' | string;
  mobile?: string;
  customerMobile?: string;
}

/** Formats a mobile number into clean, spaced luxury phone notation */
function formatMobileNumber(mobile?: string | null): string {
  if (!mobile || !mobile.trim() || mobile.trim().toUpperCase() === 'N/A') {
    return 'N/A';
  }
  const cleaned = mobile.trim();
  if (cleaned.includes(' ')) return cleaned;
  if (cleaned.startsWith('+94') && cleaned.length === 12) {
    return `+94 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (/^\d{9}$/.test(cleaned)) {
    return `+94 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  return cleaned;
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
  const primaryGold = [139, 105, 20];    // #8B6914
  const lightGold = [212, 175, 55];      // #D4AF37
  const paleGoldText = [243, 227, 184];  // #F3E3B8
  const accentDark = [26, 18, 9];        // #1A1209
  const textGray = [90, 90, 90];
  const lightBg = [250, 247, 240];       // #FAF7F0

  // Emerald Green Palette (for Confirmed & Paid)
  const emeraldGreen = [34, 112, 44];    // #22702C
  const emeraldBg = [232, 245, 233];     // #E8F5E9

  // Amber / Warm Gold Palette (for Pending / Waiting for Admin Approval)
  const amberDark = [180, 83, 9];        // #B45309
  const amberGold = [217, 119, 6];       // #D97706
  const amberBg = [254, 243, 199];       // #FEF3C7
  const amberNoticeBg = [255, 251, 235]; // #FFFBEB

  // Payment State Evaluation
  const methodLower = (data.paymentMethod || '').toLowerCase();
  const isBankTransfer = methodLower.includes('bank');
  const isPaid = data.paymentStatus === 'paid' || data.paymentStatus === 'approved';
  const isPending = data.paymentStatus === 'pending' || (isBankTransfer && !isPaid);

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

  // Resolved Customer Mobile Number
  const rawMobile = data.customer?.mobile || data.customerMobile || data.mobile || '';
  const resolvedMobile = formatMobileNumber(rawMobile);

  // ── 2. ORDER META INFO BANNER ─────────────────────────────────────────
  const bannerY = y;
  const bannerH = 24;
  const bannerW = pageWidth - (margin * 2); // 180mm

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, bannerY, bannerW, bannerH, 2, 2, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, bannerY, bannerW, bannerH, 2, 2, 'D');

  // Column 1: Order Ref (Left)
  const col1MetaX = margin + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('ORDER REFERENCE', col1MetaX, bannerY + 7);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.text(data.orderRef, col1MetaX, bannerY + 15.5);

  // Column 2: Date of Issuance (Center-Left)
  const col2MetaX = margin + 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('DATE OF ISSUANCE', col2MetaX, bannerY + 7);

  const formattedDate = data.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(formattedDate, col2MetaX, bannerY + 15.5);

  // Column 3: Customer Mobile Contact (Center-Right)
  const col3MetaX = margin + 104;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('CLIENT CONTACT', col3MetaX, bannerY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(resolvedMobile, col3MetaX, bannerY + 15.5);

  // Column 4: Payment Status Badge & Method (Far-Right)
  const badgeW = 38;
  const badgeH = 10;
  const badgeX = margin + bannerW - badgeW - 5;
  const badgeY = bannerY + 3.5;

  if (isPending) {
    doc.setFillColor(amberBg[0], amberBg[1], amberBg[2]);
    doc.setDrawColor(amberGold[0], amberGold[1], amberGold[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
    doc.text('PENDING PAYMENT', badgeX + (badgeW / 2), badgeY + 6.8, { align: 'center' });
  } else {
    doc.setFillColor(emeraldBg[0], emeraldBg[1], emeraldBg[2]);
    doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.text(isBankTransfer ? 'APPROVED & PAID' : 'CONFIRMED & PAID', badgeX + (badgeW / 2), badgeY + 6.8, { align: 'center' });
  }

  // Payment Method text neatly below status badge
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text(
    isBankTransfer ? 'Direct Bank Transfer' : 'PayHere Gateway',
    badgeX + (badgeW / 2),
    bannerY + 18.5,
    { align: 'center' }
  );

  y = bannerY + bannerH + 7; // 48 + 24 + 7 = 79mm

  // ── 3. CUSTOMER & DELIVERY INFORMATION BOX ────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text('DELIVERY & PATRON DETAILS', margin, y);

  y += 2.5;
  doc.setDrawColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 55, y);

  y += 5;
  const infoBoxH = 36;
  const infoBoxY = y;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, infoBoxY, bannerW, infoBoxH, 2, 2, 'DF');

  // Subtle vertical dividing line between Column 1 and Column 2
  const dividerX = pageWidth / 2; // 105mm
  doc.setDrawColor(232, 227, 218);
  doc.setLineWidth(0.3);
  doc.line(dividerX, infoBoxY + 5, dividerX, infoBoxY + infoBoxH - 5);

  // Column 1: Patron Contact Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.text('PATRON CONTACT DETAILS', margin + 6, infoBoxY + 8);

  const col1LabelX = margin + 6;
  const col1ValX = margin + 34;

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Customer Name:', col1LabelX, infoBoxY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text((data.customer?.name || 'Valued Customer').slice(0, 28), col1ValX, infoBoxY + 16);

  // Mobile (Bold for high clarity and visibility)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Mobile Number:', col1LabelX, infoBoxY + 23.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(resolvedMobile, col1ValX, infoBoxY + 23.5);

  // Email
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Email Address:', col1LabelX, infoBoxY + 31);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text((data.customer?.email || 'N/A').slice(0, 30), col1ValX, infoBoxY + 31);

  // Column 2: Delivery Destination
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.text('DELIVERY DESTINATION', dividerX + 6, infoBoxY + 8);

  const col2LabelX = dividerX + 6;
  const col2ValX = dividerX + 34;

  // Address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Delivery Address:', col2LabelX, infoBoxY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text((data.customer?.address || 'N/A').slice(0, 34), col2ValX, infoBoxY + 16);

  // City & Postal
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('City & Postal:', col2LabelX, infoBoxY + 23.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  const cityPostal = `${data.customer?.city || ''} ${data.customer?.postalCode ? '- ' + data.customer?.postalCode : ''}`.trim() || 'N/A';
  doc.text(cityPostal.slice(0, 34), col2ValX, infoBoxY + 23.5);

  // Country
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Country:', col2LabelX, infoBoxY + 31);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentDark[0], accentDark[1], accentDark[2]);
  doc.text(data.customer?.country || 'Sri Lanka', col2ValX, infoBoxY + 31);

  y = infoBoxY + infoBoxH + 8;

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
  doc.text(isPending ? 'TRANSFER AMOUNT:' : 'TOTAL PAID:', totalsX, y + 4);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(lightGold[0], lightGold[1], lightGold[2]);
  doc.text(`LKR ${data.finalTotal.toLocaleString()}`, margin + tableW - 4, y + 4, { align: 'right' });

  // ── OFFICIAL STAMP SEAL (Positioned safely on the Left Side) ────────────
  const stampCenterX = margin + 35;
  const stampCenterY = y - 4;

  if (isPending) {
    // Outer circular stamp border (Amber Gold)
    doc.setDrawColor(amberGold[0], amberGold[1], amberGold[2]);
    doc.setLineWidth(1.2);
    doc.circle(stampCenterX, stampCenterY, 17, 'S');

    // Inner dotted/solid circular border
    doc.setLineWidth(0.4);
    doc.circle(stampCenterX, stampCenterY, 14.5, 'S');

    // Stamp text inside
    doc.setFont('times', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
    doc.text('W I N S O R   M A I S O N', stampCenterX, stampCenterY - 6.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('P E N D I N G', stampCenterX, stampCenterY + 1.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('WAITING APPROVAL', stampCenterX, stampCenterY + 7, { align: 'center' });
  } else {
    // Outer circular stamp border (Emerald Green)
    doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.setLineWidth(1.2);
    doc.circle(stampCenterX, stampCenterY, 17, 'S');

    // Inner circular border
    doc.setLineWidth(0.4);
    doc.circle(stampCenterX, stampCenterY, 14.5, 'S');

    // Stamp text inside
    doc.setFont('times', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.text('W I N S O R   M A I S O N', stampCenterX, stampCenterY - 6.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('P A I D', stampCenterX, stampCenterY + 1.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isBankTransfer ? 5.8 : 6);
    doc.text(isBankTransfer ? 'VERIFIED & APPROVED' : 'VERIFIED & CONFIRMED', stampCenterX, stampCenterY + 7, { align: 'center' });
  }

  // ── 6. PAYMENT STATUS NOTICE CARD ──────────────────────────────────────
  if (isPending) {
    const noticeY = Math.max(y + 14, stampCenterY + 22);
    const noticeW = pageWidth - (margin * 2);
    const noticeH = 21;

    // Background card (Amber)
    doc.setFillColor(amberNoticeBg[0], amberNoticeBg[1], amberNoticeBg[2]);
    doc.setDrawColor(amberGold[0], amberGold[1], amberGold[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, noticeY, noticeW, noticeH, 2, 2, 'FD');

    // Decorative left accent pill bar
    doc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
    doc.rect(margin, noticeY, 3.5, noticeH, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
    doc.text('PAYMENT STATUS: WAITING FOR ADMIN APPROVAL', margin + 8, noticeY + 6.2);

    // Explanatory Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(80, 60, 30);
    doc.text(
      'Your bank transfer receipt has been successfully uploaded and is currently waiting for admin verification & approval.',
      margin + 8,
      noticeY + 11.2
    );
    doc.text(
      'Our administrative team will verify your payment within 24 hours. Your timepiece order will be processed immediately upon approval.',
      margin + 8,
      noticeY + 16
    );
  } else if (isBankTransfer) {
    const noticeY = Math.max(y + 14, stampCenterY + 22);
    const noticeW = pageWidth - (margin * 2);
    const noticeH = 17;

    // Background card (Soft Emerald)
    doc.setFillColor(240, 253, 244); // #F0FDF4
    doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, noticeY, noticeW, noticeH, 2, 2, 'FD');

    // Decorative left accent pill bar
    doc.setFillColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.rect(margin, noticeY, 3.5, noticeH, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 118, 110);
    doc.text('PAYMENT STATUS: DIRECT BANK TRANSFER VERIFIED & APPROVED', margin + 8, noticeY + 6.2);

    // Explanatory Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(20, 80, 50);
    doc.text(
      'Your direct bank transfer has been officially verified and approved by Winsor Maison administration. Thank you for your patronage.',
      margin + 8,
      noticeY + 11.5
    );
  }

  // ── 6. FOOTER SECTION ──────────────────────────────────────────────────
  const footerY = pageHeight - 16;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Thank you for choosing Winsor Maison. For order inquiries or support, visit winsorbrand.com or email support@winsorbrand.com', pageWidth / 2, footerY, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  doc.text(`Official Computer Generated Receipt · Reference Code: ${data.orderRef}`, pageWidth / 2, footerY + 4, { align: 'center' });

  // Save the PDF
  const filename = `Winsor_Receipt_${data.orderRef.replace(/[^A-Za-z0-9\-]/g, '_')}.pdf`;
  doc.save(filename);
}
