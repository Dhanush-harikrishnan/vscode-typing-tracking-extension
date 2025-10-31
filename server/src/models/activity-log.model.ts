import mongoose, { Schema, Document } from 'mongoose';

/**
 * Activity log document interface
 */
export interface IActivityLog extends Document {
  username: string;
  fileName: string;
  filePath: string;
  date: string;
  time: string;
  timestamp: Date;
  actionType: 'typing' | 'paste';
  typedLines: number;
  pastedLines: number;
  totalLines: number;
  contentSnippet?: string;
  editorVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Activity log schema
 */
const ActivityLogSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ['typing', 'paste'],
      required: true,
    },
    typedLines: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    pastedLines: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalLines: {
      type: Number,
      required: true,
      min: 0,
    },
    contentSnippet: {
      type: String,
      trim: true,
    },
    editorVersion: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
ActivityLogSchema.index({ username: 1, date: 1 });
ActivityLogSchema.index({ username: 1, timestamp: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
