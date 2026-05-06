import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        'Validation failed',
        error.details.map((item) => ({
          message: item.message,
          path: item.path.join('.')
        }))
      )
    );
  }

  req[source] = value;
  return next();
};
