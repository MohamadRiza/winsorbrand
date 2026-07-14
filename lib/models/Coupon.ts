// lib/models/Coupon.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountPercent: number;
  expiresAt: Date;
  isActive: boolean;
  usageLimit: number | null;   // null = unlimited
  usageCount: number;
  createdBy: string;           // admin ID
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [8, 'Code must be 8 characters or fewer'],
    match: [/^[A-Z0-9]{1,8}$/, 'Code must be alphanumeric (letters and numbers only)'],
    index: true,
  },
  discountPercent: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [1, 'Discount must be at least 1%'],
    max: [100, 'Discount cannot exceed 100%'],
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  usageLimit: {
    type: Number,
    default: null,   // null = unlimited uses
    min: [1, 'Usage limit must be at least 1 if set'],
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdBy: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Compound index: active + not expired lookup used by validation route
CouponSchema.index({ code: 1, isActive: 1, expiresAt: 1 });

// Clear cached model in dev hot-reload
delete (mongoose.models as any).Coupon;

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
