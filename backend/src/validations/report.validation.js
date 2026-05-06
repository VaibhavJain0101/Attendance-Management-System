import Joi from 'joi';

export const reportQuerySchema = Joi.object({
  date: Joi.date().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  userId: Joi.string().length(24).optional()
});

export const reportExportQuerySchema = Joi.object({
  date: Joi.date().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  userId: Joi.string().length(24).optional(),
  format: Joi.string().valid('csv', 'xlsx', 'pdf').default('csv')
});
