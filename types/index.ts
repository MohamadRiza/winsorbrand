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
  modelNo:     string;             // e.g. "WS:2019"
  watchShape:  string;             // e.g. "Round", "Square", "Oval"
  price:       number;             // LKR
  description: string;             // max 500 words
  warranty:    WarrantyOption;
  specifications: Record<string, string>; // dynamic key-value
  colorVariants:  ColorVariant[];

  // Media
  thumbnail: CloudinaryAsset;
  images:    CloudinaryAsset[];    // max 10
  video?:    CloudinaryAsset;

  // Admin controls
  isActive:       boolean;         // overall publish toggle
  showOnHome:     boolean;         // show in homepage section
  stickerEnabled: boolean;         // show badge sticker
  stickerText:    string;          // e.g. "New Year Offer"

  createdAt?: Date;
  updatedAt?: Date;
}