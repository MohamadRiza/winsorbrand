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