import mongoose, { Schema, Document } from 'mongoose';

export interface IVacancy extends Document {
  title: string;
  description: string;
  salary?: string;
  locations: string[];
  transportProvided: boolean;
  accommodationProvided: boolean;
  accommodationDetails?: string;
  status: 'active' | 'closed';
  applicantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const VacancySchema = new Schema<IVacancy>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    salary: {
      type: String,
      trim: true,
    },
    locations: {
      type: [String],
      required: [true, 'At least one location is required'],
      validate: {
        validator: function (val: string[]) {
          return val.length > 0;
        },
        message: 'At least one location must be specified',
      },
    },
    transportProvided: {
      type: Boolean,
      default: true,
    },
    accommodationProvided: {
      type: Boolean,
      default: false,
    },
    accommodationDetails: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    applicantCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

VacancySchema.index({ status: 1 });
VacancySchema.index({ locations: 1 });

delete (mongoose.models as any).Vacancy;

export default mongoose.models.Vacancy || mongoose.model<IVacancy>('Vacancy', VacancySchema);
