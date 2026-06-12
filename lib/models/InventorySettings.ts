import mongoose, { Schema, Document } from 'mongoose';

export interface IInventorySettings extends Document {
  lowStockThreshold: number;
  outOfStockThreshold: number;
  alertNotificationsEnabled: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const InventorySettingsSchema = new Schema<IInventorySettings>(
  {
    lowStockThreshold: {
      type: Number,
      required: [true, 'Low stock threshold is required'],
      default: 10,
      min: [0, 'Threshold cannot be negative'],
    },
    outOfStockThreshold: {
      type: Number,
      required: [true, 'Out of stock threshold is required'],
      default: 0,
      min: [0, 'Threshold cannot be negative'],
      max: [5, 'Maximum out of stock threshold is 5'],
    },
    alertNotificationsEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent mongoose module cache issues in Next.js dev server
delete (mongoose.models as any).InventorySettings;

export default mongoose.models.InventorySettings || mongoose.model<IInventorySettings>('InventorySettings', InventorySettingsSchema);
