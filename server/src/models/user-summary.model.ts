import mongoose, { Schema, Document } from 'mongoose';

/**
 * User activity summary document interface
 */
export interface IUserActivitySummary extends Document {
  username: string;
  date: string;
  totalTypedLines: number;
  totalPastedLines: number;
  typingToPastingRatio: number;
  totalFilesEdited: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User activity summary schema
 */
const UserActivitySummarySchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    totalTypedLines: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalPastedLines: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    typingToPastingRatio: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalFilesEdited: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint for username + date combination
UserActivitySummarySchema.index({ username: 1, date: 1 }, { unique: true });

export const UserActivitySummary = mongoose.model<IUserActivitySummary>(
  'UserActivitySummary',
  UserActivitySummarySchema
);
