import { StatusCodes } from 'http-status-codes';
import { findUserById } from '../repositories/user.repository.js';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

const normalizeRole = (role) => String(role || '').toLowerCase();

export const authenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication token is required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);

    if (!user || !user.isActive) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'User is not active or no longer exists'));
    }

    req.user = {
      id: user._id.toString(),
      role: normalizeRole(user.role),
      name: user.name,
      email: user.email,
      manager: user.manager ? user.manager.toString() : null
    };

    return next();
  } catch (_error) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired authentication token'));
  }
};
