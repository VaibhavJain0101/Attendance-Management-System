import Joi from 'joi';

export const overtimeRequestSchema = Joi.object({
  attendanceId: Joi.string().length(24).required(),
  requestedHours: Joi.number().min(0.5).max(16).required(),
  reason: Joi.string().min(5).max(500).required()
});

export const overtimeReviewSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED').required(),
  reviewComment: Joi.string().max(500).allow('').default('')
});

export const overtimeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
  employeeId: Joi.string().length(24).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});
