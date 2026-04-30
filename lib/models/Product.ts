// lib/models/Product.ts
import mongoose, { Schema, Document } from 'mongoose';
import { WarrantyOption, IProduct } from '@/types';

const CloudinaryAssetSchema = new Schema({
  url:      { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false });

const ColorVariantSchema = new Schema({
  colorName: { type: String, required: true },
  colorHex:  { type: String, required: true, default: '#000000' },
  qty:       { type: Number, required: true, min: 0, default: 0 },
  inStock:   { type: Boolean, default: true },
  image:     { type: CloudinaryAssetSchema, required: true },
}, { _id: true });

ColorVariantSchema.pre('save', function () {
  this.inStock = this.qty > 0;
});

const warrantyValues: WarrantyOption[] = [
  'no_warranty', '3_months', '6_months', '1_year', '2_years',
];

const ProductSchema = new Schema<IProduct & Document>(
  {
    // ── Identity ────────────────────────────────────────────────────────────
    title:      { type: String, required: true, trim: true },
    brand:      { type: String, default: 'Winsor', immutable: true },
    modelNo:    { type: String, required: true, trim: true },
    watchShape: { type: String, required: true, trim: true },

    // ── Pricing & Info ──────────────────────────────────────────────────────
    price: { type: Number, required: true, min: 0 },
    description: {
      type:     String,
      required: true,
      validate: {
        validator: (v: string) => v.trim().split(/\s+/).length <= 500,
        message:   'Description must not exceed 500 words',
      },
    },
    warranty: {
      type:    String,
      enum:    warrantyValues,
      default: 'no_warranty',
    },
    specifications: {
      type:    Map,
      of:      String,
      default: {},
    },
    colorVariants: {
      type:     [ColorVariantSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v.length >= 1,
        message:   'At least one color variant is required',
      },
    },

    // ── Media ───────────────────────────────────────────────────────────────
    thumbnail: { type: CloudinaryAssetSchema, required: true },
    images: {
      type:     [CloudinaryAssetSchema],
      default:  [],
      validate: {
        validator: (v: unknown[]) => v.length <= 10,
        message:   'Maximum 10 gallery images allowed',
      },
    },
    video: { type: CloudinaryAssetSchema, default: null },

    // ── Admin controls ──────────────────────────────────────────────────────
    isActive:       { type: Boolean, default: false },
    showOnHome:     { type: Boolean, default: false },
    stickerEnabled: { type: Boolean, default: false },
    stickerText:    { type: String,  default: '', trim: true, maxlength: 40 },

    // ── Collections section (Sports / New / Luxury / Limited / Bestsellers) ─
    collectionSections: {
      type:    [String],
      enum:    ['sports', 'new', 'luxury', 'limited', 'bestsellers'],
      default: [],
    },

    // ── Gift categories (slugs from GiftCategory collection) ────────────────
    // e.g. ["christmas", "valentines-day", "graduation"]
    giftCategories: {
      type:    [String],
      default: [],
    },
  },
  { timestamps: true }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
ProductSchema.index({ showOnHome: 1, isActive: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ collectionSections: 1, isActive: 1, showOnHome: 1 });
ProductSchema.index({ giftCategories: 1, isActive: 1 });

// Clear cached model to avoid stale schema errors in development
delete (mongoose.models as any).Product;

export default mongoose.model<IProduct & Document>('Product', ProductSchema);