import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId | string;
  quantity: number;
  colorVariant?: string;
}

export interface ICart extends Document {
  clerkId: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  colorVariant: {
    type: String,
    trim: true,
  },
}, { _id: false });

const CartSchema = new Schema<ICart>({
  clerkId: {
    type: String,
    required: [true, 'Clerk ID is required'],
    unique: true,
    index: true,
  },
  items: [CartItemSchema],
}, { timestamps: true });

// Clear cached model in dev to prevent schemas mismatch on rebuilds
delete (mongoose.models as any).Cart;

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
