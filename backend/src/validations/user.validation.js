import Joi from 'joi';

const objectId = Joi.string()
  .length(24)
  .hex()
  .messages({
    'string.length': '{{#label}} must be a valid 24-character ObjectId',
    'string.hex': '{{#label}} must be a valid ObjectId'
  });

export const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().trim().lowercase().valid('employee', 'manager', 'admin').optional(),
  managerId: objectId.optional()
});

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(64).required(),
  role: Joi.string().trim().lowercase().valid('employee', 'manager', 'admin').required(),
  managerId: objectId.allow('', null).optional(),
  assignedOfficeId: objectId.allow('', null).optional()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  role: Joi.string().trim().lowercase().valid('employee', 'manager', 'admin').optional(),
  managerId: objectId.allow('', null).optional(),
  isActive: Joi.boolean().optional(),
  assignedOfficeId: objectId.allow('', null).optional(),
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
