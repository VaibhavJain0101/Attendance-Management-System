import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError.js';

const SENSITIVE_FIELDS = new Set(['password', 'newPassword', 'confirmPassword', 'currentPassword']);

const sanitizeValue = (path, value) => {
  const lastPathToken = path.split('.').pop();
  if (lastPathToken && SENSITIVE_FIELDS.has(lastPathToken)) {
    return '[REDACTED]';
  }
  return value;
};

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map((item) => {
      const path = item.path.join('.');
      return {
        field: path || source,
        message: item.message,
        expectedType: item.type,
        receivedValue: sanitizeValue(path, item.context?.value)
      };
    });

    return next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        'Validation failed',
        details
      )
    );
  }

  req[source] = value;
  return next();
};
