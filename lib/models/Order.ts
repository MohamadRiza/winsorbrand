import mongoose, { Schema, Document } from 'mongoose';
import { IOrder } from '@/types';

export interface IOrderDocument extends Omit<IOrder, '_id'>, Document {}

const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  productTitle: { type: String, required: true },
  productModelNo: { type: String, required: true },
  productThumbnail: { type: String, required: true },
  colorVariant: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  isGift: { type: Boolean, default: false },
  giftNote: { type: String, trim: true, default: '' },
  canvaLink: { type: String, trim: true, default: '' },
  giftAttachmentUrl: { type: String, trim: true, default: '' },
  giftAttachmentName: { type: String, trim: true, default: '' },
}, { _id: false });

const OrderShippingAddressSchema = new Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  mobile: { type: String, required: true },
  mobileCode: { type: String, required: true },
}, { _id: false });

const OrderSchema = new Schema<IOrderDocument>({
  clerkId: {
    type: String,
    required: [true, 'Clerk ID is required'],
    index: true,
  },
  orderRef: {
    type: String,
    required: [true, 'Order reference is required'],
    unique: true,
    index: true,
  },
  items: {
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: (v: any[]) => v.length >= 1,
      message: 'An order must contain at least one timepiece',
    }
  },
  shippingAddress: {
    type: OrderShippingAddressSchema,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cancel_requested'],
    default: 'pending',
    required: true,
    index: true,
  },
  cancelReason: {
    type: String,
    trim: true,
  },
  isGift: {
    type: Boolean,
    default: false,
  },
  // ── Coupon / Discount Fields ───────────────────────────────
  couponCode: {
    type: String,
    trim: true,
    uppercase: true,
    default: null,
  },
  couponDiscountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  couponDiscountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  finalTotal: {
    type: Number,
    default: null,  // null means no coupon applied, equals subtotal
    min: 0,
  },
  // ── Delivery Tracking ─────────────────────────────────────
  deliveredAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });


// Clear cached model in dev
delete (mongoose.models as any).Order;

export default mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);
