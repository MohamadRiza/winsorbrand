// lib/models/GiftCategory.ts
// Standalone collection — admin creates/deletes gift categories freely.
// Products are linked via their giftCategories[] array (see Product model update).

import mongoose, { Schema, Document } from 'mongoose';

export interface IGiftCategory extends Document {
  slug:      string;   // auto-generated from label e.g. "valentines-day"
  label:     string;   // display name e.g. "Valentine's Day"
  emoji:     string;   // e.g. "💝"  — admin picks from a set list
  isActive:  boolean;  // admin can hide without deleting
  sortOrder: number;   // controls display order
  createdAt: Date;
  updatedAt: Date;
}

const GiftCategorySchema = new Schema<IGiftCategory>(
  {
    slug:      { type: String, required: true, unique: true, trim: true, lowercase: true },
    label:     { type: String, required: true, trim: true, maxlength: 60 },
    emoji:     { type: String, default: '🎁' },
    isActive:  { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug from label before saving
GiftCategorySchema.pre('validate', function () {
  if (this.isModified('label') && !this.slug) {
    this.slug = this.label
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
});

GiftCategorySchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.models.GiftCategory ||
  mongoose.model<IGiftCategory>('GiftCategory', GiftCategorySchema);