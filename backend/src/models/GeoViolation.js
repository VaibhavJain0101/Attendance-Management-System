import mongoose from 'mongoose';
import { GEO_VIOLATION_ACTION, GEO_STATUS } from '../constants/geofence.js';

const geoViolationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      default: null,
      index: true
    },
    officeLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OfficeLocation',
      default: null
    },
    employeeLatitude: {
      type: Number,
      required: true
    },
    employeeLongitude: {
      type: Number,
      required: true
    },
    officeLatitude: {
      type: Number,
      default: null
    },
    officeLongitude: {
      type: Number,
      default: null
    },
    distance: {
      type: Number,
      default: null
    },
    geoStatus: {
      type: String,
      enum: Object.values(GEO_STATUS),
      default: GEO_STATUS.OUTSIDE
    },
    actionTaken: {
      type: String,
      enum: Object.values(GEO_VIOLATION_ACTION),
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const GeoViolation = mongoose.model('GeoViolation', geoViolationSchema);