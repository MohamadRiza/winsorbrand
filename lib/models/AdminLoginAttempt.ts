import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminLoginAttempt extends Document {
  ip: string;
  failedCount: number;
  blockedUntil: Date | null;
  previousBlockDuration: number; // Stores last block duration in hours (e.g., 24 or 48)
  lastAttemptAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminLoginAttemptSchema = new Schema<IAdminLoginAttempt>(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
    previousBlockDuration: {
      type: Number,
      default: 0, // 0 = not blocked yet
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Clear cached model in development hot-reloads
if (mongoose.models.AdminLoginAttempt) {
  delete (mongoose.models as any).AdminLoginAttempt;
}

export default mongoose.models.AdminLoginAttempt || mongoose.model<IAdminLoginAttempt>('AdminLoginAttempt', AdminLoginAttemptSchema);
