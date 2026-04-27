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

// ✅ ADD THIS (matches your schema exactly)
export type CollectionSection =
  | 'sports'
  | 'new'
  | 'luxury'
  | 'limited'
  | 'bestsellers';

export interface CloudinaryAsset {
  url:      string;
  publicId: string;
}

export interface ColorVariant {
  colorName: string;
  colorHex:  string;   // e.g. "#C5A028" for gold
  qty:       number;
  inStock:   boolean;  // auto: qty > 0
  image:     CloudinaryAsset;
}

export interface IProduct {
  _id?:        string;
  title:       string;
  brand:       'Winsor';           // always fixed
  modelNo:     string;
  watchShape:  string;
  price:       number;
  description: string;
  warranty:    WarrantyOption;
  specifications: Record<string, string>;
  colorVariants:  ColorVariant[];

  // ✅ ADD THIS (THIS FIXES YOUR ERROR)
  collectionSections: CollectionSection[];

  // Media
  thumbnail: CloudinaryAsset;
  images:    CloudinaryAsset[];
  video?:    CloudinaryAsset;

  // Admin controls
  isActive:       boolean;
  showOnHome:     boolean;
  stickerEnabled: boolean;
  stickerText:    string;

  createdAt?: Date;
  updatedAt?: Date;
}