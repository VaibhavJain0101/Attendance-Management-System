import mongoose from 'mongoose';

const geofenceSettingSchema = new mongoose.Schema(
  {
    strictGeofenceMode: {
      type: Boolean,
      default: true
    },
    allowOutsideAttendance: {
      type: Boolean,
      default: false
    },
    autoMarkSuspicious: {
      type: Boolean,
      default: true
    },
    maximumAllowedRadius: {
      type: Number,
      default: 2000,
      min: 50,
      max: 100000
    },
    gpsAccuracyThreshold: {
      type: Number,
      default: 120,
      min: 10,
      max: 1000
    },
    geofenceEnabled: {
      type: Boolean,
      default: true
    },
    allowWfhBypass: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

export const GeofenceSetting = mongoose.model('GeofenceSetting', geofenceSettingSchema);