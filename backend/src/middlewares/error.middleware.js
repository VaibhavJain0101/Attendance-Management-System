import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const SENSITIVE_FIELDS = new Set(['password', 'newPassword', 'confirmPassword', 'currentPassword']);

const sanitizeValue = (field, value) => {
  const lastPathToken = String(field || '').split('.').pop();
  if (SENSITIVE_FIELDS.has(lastPathToken)) {
    return '[REDACTED]';
  }
  return value;
};

const normalizeErrorDetails = (details) => {
  if (!Array.isArray(details)) {
    return [];
  }

  return details.map((item) => {
    const field = item.field || item.path || 'unknown';
    return {
      field,
      message: item.message || 'Invalid value',
      expectedType: item.expectedType || item.type || 'unknown',
      receivedValue: sanitizeValue(field, item.receivedValue)
    };
  });
};

const buildValidationDetailsFromMongooseError = (error) =>
  Object.values(error.errors || {}).map((validationError) => ({
    field: validationError.path || 'unknown',
    message: validationError.message || 'Invalid value',
    expectedType: validationError.kind || validationError.name || 'unknown',
    receivedValue: sanitizeValue(validationError.path, validationError.value)
  }));

export const errorHandler = (error, req, res, _next) => {
  let statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = error.message || getReasonPhrase(statusCode);
  let normalizedDetails = normalizeErrorDetails(error.details);

  if (error.name === 'ValidationError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation failed';
    normalizedDetails = buildValidationDetailsFromMongooseError(error);
  }

  if (error.name === 'CastError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation failed';
    normalizedDetails = [
      {
        field: error.path || 'id',
        message: `Invalid value for ${error.path || 'id'}`,
        expectedType: error.kind || 'ObjectId',
        receivedValue: sanitizeValue(error.path, error.value)
      }
    ];
  }

  if (error?.code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    message = 'Duplicate value violates a unique constraint';
    normalizedDetails = Object.entries(error.keyValue || {}).map(([field, value]) => ({
      field,
      message: `${field} already exists`,
      expectedType: 'unique',
      receivedValue: sanitizeValue(field, value)
    }));
  }

  logger.error('Request failed', {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    message,
    details: normalizedDetails,
    stack: error.stack
  });

  const response = {
    success: false,
    message
  };

  if (normalizedDetails.length) {
    response.details = normalizedDetails;
    response.errors = normalizedDetails.reduce((acc, item) => {
      acc[item.field] = item.message;
      return acc;
    }, {});
  }

  if (env.nodeEnv !== 'production') {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};
