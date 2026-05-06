import mongoose from 'mongoose';
import { OVERTIME_STATUS } from '../constants/attendance.js';

const overtimeRequestSchema = new mongoose.Schema(
  {
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
      index: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    dateKey: {
      type: String,
      required: true,
      index: true
    },
    requestedHours: {
      type: Number,
      required: true,
      min: 0.5,
      max: 16
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500
    },
    status: {
      type: String,
      enum: Object.values(OVERTIME_STATUS),
      default: OVERTIME_STATUS.PENDING,
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewComment: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

overtimeRequestSchema.index({ employee: 1, attendance: 1 }, { unique: true });

export const OvertimeRequest = mongoose.model('OvertimeRequest', overtimeRequestSchema);
