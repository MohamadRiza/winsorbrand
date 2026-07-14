// types/index.ts

export type WarrantyOption =
  | 'no_warranty'
  | '3_months'
  | '6_months'
  | '1_year'
  | '2_years';

export const WARRANTY_LABELS: Record<WarrantyOption, string> = {
  no_warranty: 'No Warranty',
  '3_months':  '3 Months',
  '6_months':  '6 Months',
  '1_year':    '1 Year',
  '2_years':   '2 Years',
};

export type CollectionSection =
  | 'sports'
  | 'new'
  | 'luxury'
  | 'limited'
  | 'bestsellers';

export type GiftCategorySlug = string;

export interface CloudinaryAsset {
  url:      string;
  publicId: string;
}

export interface ColorVariant {
  colorName: string;
  colorHex:  string;
  qty:       number;
  inStock:   boolean;
  image?:    CloudinaryAsset; // ✅ Optional to prevent validation errors
}

export interface IGiftCategory {
  _id:       string;
  slug:      string;
  label:     string;
  emoji:     string;
  isActive:  boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProduct {
  _id?:        string;
  title:       string;
  brand:       'Winsor';
  modelNo:     string;
  watchShape:  string;
  price:       number;
  description: string;
  warranty:    WarrantyOption;
  specifications: Record<string, string>;
  colorVariants:  ColorVariant[];

  collectionSections: CollectionSection[];
  giftCategories:     GiftCategorySlug[];

  thumbnail: CloudinaryAsset;
  images:    CloudinaryAsset[];
  video?:    CloudinaryAsset;

  isActive:       boolean;
  isSoldOut:      boolean; // ✅ NEW: Sold out status
  showOnHome:     boolean;
  stickerEnabled: boolean;
  stickerText:    string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'cancel_requested';

export interface IOrderItem {
  productId: string;
  productTitle: string;
  productModelNo: string;
  productThumbnail: string;
  colorVariant?: string;
  quantity: number;
  price: number;
  isGift?: boolean;
  giftNote?: string;
  canvaLink?: string;
  giftAttachmentUrl?: string;
  giftAttachmentName?: string;
}

export interface IOrderShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  mobile: string;
  mobileCode: string;
}

export interface IOrder {
  _id?: string;
  clerkId: string;
  orderRef: string;
  items: IOrderItem[];
  shippingAddress: IOrderShippingAddress;
  subtotal: number;
  status: OrderStatus;
  cancelReason?: string;
  isGift?: boolean;
  // Coupon / Discount fields
  couponCode?: string | null;
  couponDiscountPercent?: number;
  couponDiscountAmount?: number;
  finalTotal?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}