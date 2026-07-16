import mongoose, { Schema, Document } from 'mongoose';
import { IReview } from '@/types';

export interface IReviewDocument extends Omit<IReview, '_id'>, Document {}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    } as any,
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    userAvatar: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment description is required'],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 2,
        message: 'A review can have at most 2 images',
      },
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isFake: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, status: 1 });

delete (mongoose.models as any).Review;

export default mongoose.model<IReviewDocument>('Review', ReviewSchema);
