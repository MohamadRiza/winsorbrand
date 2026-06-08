import mongoose, { Schema, Document } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  ipAddress: string;
  clerkId?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim: true,
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      index: true,
    },
    clerkId: {
      type: String,
      trim: true,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index to optimize IP rate limit queries
ContactMessageSchema.index({ ipAddress: 1, createdAt: -1 });

// Clear cached model in dev to prevent schemas mismatch on rebuilds
delete (mongoose.models as any).ContactMessage;

export default mongoose.models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
