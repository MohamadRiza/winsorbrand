import mongoose, { Schema, Document } from 'mongoose';

export interface IJobApplication extends Document {
  vacancyId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  dob: Date;
  age: number;
  gender: 'male' | 'female' | 'prefer_not_say';
  address: string;
  hasExperience: boolean;
  experienceYears?: number;
  referred: boolean;
  refereeName?: string;
  refereeEmail?: string;
  refereeMobile?: string;
  email: string;
  mobile: string;
  resumeUrl: string;
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'offered' | 'rejected';
  ipAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    vacancyId: {
      type: Schema.Types.ObjectId,
      ref: 'Vacancy',
      required: [true, 'Vacancy ID is required'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'prefer_not_say'],
      required: [true, 'Gender selection is required'],
    },
    address: {
      type: String,
      required: [true, 'Residential address is required'],
      trim: true,
    },
    hasExperience: {
      type: Boolean,
      default: false,
    },
    experienceYears: {
      type: Number,
      validate: {
        validator: function (v: number) {
          if (v === undefined || v === null) return true;
          return Number.isInteger(v) && v >= 0 && v <= 99;
        },
        message: 'Experience years must be a positive 2-digit integer',
      },
    },
    referred: {
      type: Boolean,
      default: false,
    },
    refereeName: {
      type: String,
      trim: true,
    },
    refereeEmail: {
      type: String,
      trim: true,
    },
    refereeMobile: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Applicant email address is required'],
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: [true, 'Applicant mobile number is required'],
      trim: true,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume document path is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'interview_scheduled', 'offered', 'rejected'],
      default: 'pending',
    },
    ipAddress: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

JobApplicationSchema.index({ vacancyId: 1 });
JobApplicationSchema.index({ status: 1 });
JobApplicationSchema.index({ email: 1 });
JobApplicationSchema.index({ ipAddress: 1, createdAt: -1 });

delete (mongoose.models as any).JobApplication;

export default mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
