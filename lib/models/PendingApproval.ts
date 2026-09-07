import mongoose, { Schema, Document } from 'mongoose';

export type ApprovalActionType =
  | 'product_create'
  | 'product_update'
  | 'fake_review_create';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface IPendingApproval extends Document {
  staffId: mongoose.Types.ObjectId;
  staffUsername: string;
  actionType: ApprovalActionType;
  targetId?: string;
  payload: Record<string, any>;
  status: ApprovalStatus;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PendingApprovalSchema = new Schema<IPendingApproval>(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    staffUsername: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      enum: ['product_create', 'product_update', 'fake_review_create'],
      required: true,
    },
    targetId: {
      type: String,
      default: null,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

PendingApprovalSchema.index({ status: 1, createdAt: -1 });
PendingApprovalSchema.index({ staffId: 1, status: 1 });

delete (mongoose.models as any).PendingApproval;

export default mongoose.models.PendingApproval ||
  mongoose.model<IPendingApproval>('PendingApproval', PendingApprovalSchema);
