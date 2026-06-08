import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  clerkId: string;
  email: string;
  mobileCode?: string;
  mobile?: string;
  profileImage?: string;
  country?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    clerkId: {
      type: String,
      required: [true, 'Clerk ID is required'],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    mobileCode: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Clear cached model in dev to prevent schemas mismatch on rebuilds
delete (mongoose.models as any).Customer;

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
