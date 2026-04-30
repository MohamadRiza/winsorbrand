// types/index.ts

// ── Warranty ────────────────────────────────────────────────────────────────
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

// ── Collection sections ─────────────────────────────────────────────────────
export type CollectionSection =
  | 'sports'
  | 'new'
  | 'luxury'
  | 'limited'
  | 'bestsellers';

// ── Gift categories ─────────────────────────────────────────────────────────
// Stored as slugs referencing the GiftCategory collection
// e.g. "christmas" | "valentines-day" | "graduation" | any admin-created slug
export type GiftCategorySlug = string;

// ── Cloudinary ──────────────────────────────────────────────────────────────
export interface CloudinaryAsset {
  url:      string;
  publicId: string;
}

// ── Color variant ───────────────────────────────────────────────────────────
export interface ColorVariant {
  colorName: string;
  colorHex:  string;   // e.g. "#C5A028" for gold
  qty:       number;
  inStock:   boolean;  // auto-computed: qty > 0
  image:     CloudinaryAsset;
}

// ── Gift Category (from GiftCategory collection) ────────────────────────────
export interface IGiftCategory {
  _id:       string;
  slug:      string;   // e.g. "valentines-day"
  label:     string;   // e.g. "Valentine's Day"
  emoji:     string;   // e.g. "💝"
  isActive:  boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Product ─────────────────────────────────────────────────────────────────
export interface IProduct {
  _id?:        string;
  title:       string;
  brand:       'Winsor';           // always fixed — immutable in schema
  modelNo:     string;             // e.g. "WS:2019"
  watchShape:  string;             // e.g. "Round", "Square", "Oval"
  price:       number;             // stored in LKR always
  description: string;             // max 500 words
  warranty:    WarrantyOption;
  specifications: Record<string, string>;  // free-form key-value pairs
  colorVariants:  ColorVariant[];

  // ── Homepage sections ────────────────────────────────────────────────────
  collectionSections: CollectionSection[];   // Sports / New / Luxury / Limited / Bestsellers
  giftCategories:     GiftCategorySlug[];    // e.g. ["christmas", "valentines-day"]

  // ── Media (Cloudinary) ───────────────────────────────────────────────────
  thumbnail: CloudinaryAsset;
  images:    CloudinaryAsset[];    // max 10
  video?:    CloudinaryAsset;      // optional 1 video

  // ── Admin controls ───────────────────────────────────────────────────────
  isActive:       boolean;         // master publish toggle
  showOnHome:     boolean;         // show in collections section
  stickerEnabled: boolean;         // show badge sticker on card
  stickerText:    string;          // e.g. "New Year Offer" (max 40 chars)

  createdAt?: Date;
  updatedAt?: Date;
}

// ── API response wrapper ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}