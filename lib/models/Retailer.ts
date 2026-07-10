// lib/models/Retailer.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IOperatingHours {
  weekdays: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  saturday: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  sunday: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

export interface IRetailer extends Document {
  name: string;
  address: string;
  city: string;
  country: string;
  googleMapsLink: string;
  phone?: string;
  websiteUrl?: string;
  operatingHours?: IOperatingHours;
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
    phone: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
    operatingHours: {
      weekdays: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '09:30' },
        closeTime: { type: String, default: '19:00' },
      },
      saturday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '09:30' },
        closeTime: { type: String, default: '19:00' },
      },
      sunday: {
        isOpen: { type: Boolean, default: false },
        openTime: { type: String, default: '10:00' },
        closeTime: { type: String, default: '18:00' },
      },
    },
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
