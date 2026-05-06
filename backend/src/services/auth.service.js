import { StatusCodes } from 'http-status-codes';
import { User } from '../models/User.js';
import { findUserByEmail } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/jwt.js';

const normalizeRole = (role) => String(role || '').toLowerCase();

const buildAuthPayload = (user) => ({
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    manager: user.manager
  },
  token: signToken({ sub: user._id.toString(), role: normalizeRole(user.role) })
});

export const login = async ({ email, password }) => {
  const user = await findUserByEmail(email, true);

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const passwordMatched = await user.comparePassword(password);

  if (!passwordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User is deactivated');
  }

  return buildAuthPayload(user);
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (!user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User is deactivated');
  }

  const currentPasswordMatched = await user.comparePassword(currentPassword);
  if (!currentPasswordMatched) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Current password is incorrect');
  }

  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'New password must be different from current password');
  }

  user.password = newPassword;
  await user.save();

  return { userId: user._id };
};
