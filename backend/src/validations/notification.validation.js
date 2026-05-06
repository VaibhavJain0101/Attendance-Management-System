import Joi from 'joi';

export const notificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().optional(),
  isRead: Joi.boolean().optional()
});
