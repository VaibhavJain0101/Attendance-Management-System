import mongoose from 'mongoose';

const officeLocationSchema = new mongoose.Schema(
  {
    officeName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    radiusInMeters: {
      type: Number,
      required: true,
      min: 10,
      max: 100000
    },
    address: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300
    },
    city: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    state: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    country: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    googleMapUrl: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

officeLocationSchema.pre('save', function buildGoogleMapUrl(next) {
  if (!this.googleMapUrl) {
    this.googleMapUrl = `https://www.google.com/maps?q=${this.latitude},${this.longitude}`;
  }
  next();
});

export const OfficeLocation = mongoose.model('OfficeLocation', officeLocationSchema);