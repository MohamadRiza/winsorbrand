// lib/models/Retailer.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRetailer extends Document {
  name: string;
  address: string;
  city: string;
  country: string;
  googleMapsLink: string;
  image?: {
    url: string;
    publicId: string;
  };
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RetailerSchema = new Schema<IRetailer>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    country: { type: String, required: true, trim: true, index: true },
    googleMapsLink: { type: String, required: true, trim: true },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    latitude: { type: Number },
    longitude: { type: Number },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Retailer ||
  mongoose.model<IRetailer>('Retailer', RetailerSchema);
