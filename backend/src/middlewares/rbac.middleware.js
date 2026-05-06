import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError.js';

export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access'));
  }

  const normalizedRole = String(req.user.role || '').toLowerCase();
  const normalizedAllowed = allowedRoles.map((role) => String(role || '').toLowerCase());

  if (!normalizedAllowed.includes(normalizedRole)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to perform this action'));
  }

  return next();
};
