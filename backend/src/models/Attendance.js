import mongoose from 'mongoose';
import { OVERTIME_STATUS, VALIDATION_STATUS, WORKING_STATUS } from '../constants/attendance.js';

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    time: { type: Date, required: true },
    selfie: { type: String, required: true },
    location: { type: locationSchema, required: true }
  },
  { _id: false }
);

const validationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(VALIDATION_STATUS),
      default: VALIDATION_STATUS.PENDING
    },
    remarks: { type: String, default: '' },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    validatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const overtimeSchema = new mongoose.Schema(
  {
    requestedHours: { type: Number, default: 0 },
    approvedHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(OVERTIME_STATUS),
      default: OVERTIME_STATUS.PENDING
    }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    user: {
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
    punchIn: {
      type: eventSchema,
      required: true
    },
    punchOut: {
      type: eventSchema,
      default: null
    },
    totalWorkingHours: {
      type: Number,
      default: 0
    },
    workingStatus: {
      type: String,
      enum: Object.values(WORKING_STATUS),
      default: WORKING_STATUS.PENDING
    },
    overtime: {
      type: overtimeSchema,
      default: () => ({})
    },
    validation: {
      type: validationSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

attendanceSchema.index({ user: 1, dateKey: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
