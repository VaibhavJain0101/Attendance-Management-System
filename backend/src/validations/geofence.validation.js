import Joi from 'joi';

const latSchema = Joi.number().min(-90).max(90);
const lngSchema = Joi.number().min(-180).max(180);

export const createOfficeLocationSchema = Joi.object({
  officeName: Joi.string().min(2).max(120).required(),
  latitude: latSchema.required(),
  longitude: lngSchema.required(),
  radiusInMeters: Joi.number().min(10).max(100000).required(),
  address: Joi.string().max(300).allow('').default(''),
  city: Joi.string().max(120).allow('').default(''),
  state: Joi.string().max(120).allow('').default(''),
  country: Joi.string().max(120).allow('').default(''),
  googleMapUrl: Joi.string().uri().allow('').optional(),
  isActive: Joi.boolean().default(true)
});

export const updateOfficeLocationSchema = Joi.object({
  officeName: Joi.string().min(2).max(120).optional(),
  latitude: latSchema.optional(),
  longitude: lngSchema.optional(),
  radiusInMeters: Joi.number().min(10).max(100000).optional(),
  address: Joi.string().max(300).allow('').optional(),
  city: Joi.string().max(120).allow('').optional(),
  state: Joi.string().max(120).allow('').optional(),
  country: Joi.string().max(120).allow('').optional(),
  googleMapUrl: Joi.string().uri().allow('').optional(),
  isActive: Joi.boolean().optional()
}).min(1);

export const geofenceSettingsSchema = Joi.object({
  strictGeofenceMode: Joi.boolean().optional(),
  allowOutsideAttendance: Joi.boolean().optional(),
  autoMarkSuspicious: Joi.boolean().optional(),
  maximumAllowedRadius: Joi.number().min(50).max(100000).optional(),
  gpsAccuracyThreshold: Joi.number().min(10).max(1000).optional(),
  geofenceEnabled: Joi.boolean().optional(),
  allowWfhBypass: Joi.boolean().optional()
}).min(1);

export const geofenceValidationQuerySchema = Joi.object({
  latitude: latSchema.required(),
  longitude: lngSchema.required(),
  gpsAccuracy: Joi.number().min(0).max(10000).optional()
});

export const geofenceViolationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  employeeId: Joi.string().length(24).optional(),
  actionTaken: Joi.string()
    .valid('BLOCKED', 'ALLOWED', 'MARKED_SUSPICIOUS', 'GPS_ACCURACY_FAILED', 'WFH_BYPASS')
    .optional()
});
