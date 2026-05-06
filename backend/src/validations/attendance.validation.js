import Joi from 'joi';

const eventSchema = Joi.object({
  selfie: Joi.string().required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  gpsAccuracy: Joi.number().min(0).max(10000).optional(),
  deviceFingerprint: Joi.string().max(500).allow('').optional(),
  isMockedLocation: Joi.boolean().optional(),
  time: Joi.date().optional()
});

export const punchInSchema = eventSchema;
export const punchOutSchema = eventSchema;

export const attendanceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  userId: Joi.string().length(24).optional(),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'INCOMPLETE').optional()
});

export const attendanceValidationSchema = Joi.object({
  status: Joi.string().valid('VALID', 'INVALID').required(),
  remarks: Joi.string().max(500).allow('').default('')
});
