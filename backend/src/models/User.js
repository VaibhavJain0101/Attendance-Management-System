import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ALL_ROLES, ROLES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.EMPLOYEE
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedOffice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OfficeLocation',
      default: null
    },
    workFromHomeBypass: {
      enabled: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null },
      reason: { type: String, default: '' }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function saveHash(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
