import Joi from 'joi';

export const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid('employee', 'manager', 'admin').optional(),
  managerId: Joi.string().length(24).optional()
});

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(64).required(),
  role: Joi.string().valid('employee', 'manager', 'admin').required(),
  managerId: Joi.string().length(24).allow('', null).optional(),
  assignedOfficeId: Joi.string().length(24).allow('', null).optional()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  role: Joi.string().valid('employee', 'manager', 'admin').optional(),
  managerId: Joi.string().length(24).allow('', null).optional(),
  isActive: Joi.boolean().optional(),
  assignedOfficeId: Joi.string().length(24).allow('', null).optional(),
  workFromHomeBypassEnabled: Joi.boolean().optional(),
  workFromHomeBypassExpiresAt: Joi.date().allow(null).optional(),
  workFromHomeBypassReason: Joi.string().max(500).allow('').optional()
}).min(1);

export const resetUserPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).max(64).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'confirmPassword must match newPassword'
  })
});
