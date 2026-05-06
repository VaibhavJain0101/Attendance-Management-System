import { StatusCodes } from 'http-status-codes';
import { ROLES } from '../constants/roles.js';
import { OfficeLocation } from '../models/OfficeLocation.js';
import { User } from '../models/User.js';
import { createUser, findUserByEmail, findUserById, findUsers, updateUserById } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureValidObjectId } from './scope.service.js';

export const getUsers = async (query) => {
  const [users, total] = await findUsers(query);

  return {
    data: users,
    total,
    page: query.page,
    limit: query.limit
  };
};

const resolveManagerId = async (role, managerId) => {
  if (role !== ROLES.EMPLOYEE) {
    return null;
  }

  if (!managerId) {
    return null;
  }

  ensureValidObjectId(managerId, 'managerId');

  const manager = await findUserById(managerId);
  if (!manager || ![ROLES.MANAGER, ROLES.ADMIN].includes(manager.role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'managerId must reference a manager or admin');
  }

  return managerId;
};

const resolveAssignedOfficeId = async (assignedOfficeId) => {
  if (!assignedOfficeId) {
    return null;
  }

  ensureValidObjectId(assignedOfficeId, 'assignedOfficeId');

  const office = await OfficeLocation.findById(assignedOfficeId).select('_id isActive');
  if (!office || !office.isActive) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'assignedOfficeId must reference an active office location');
  }

  return assignedOfficeId;
};

export const createUserByAdmin = async (payload) => {
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
  }

  const manager = await resolveManagerId(payload.role, payload.managerId || null);

  const user = await createUser({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    manager,
    assignedOffice: await resolveAssignedOfficeId(payload.assignedOfficeId || null)
  });

  const created = await User.findById(user._id)
    .select('-password')
    .populate('manager', 'name email role')
    .populate('assignedOffice', 'officeName latitude longitude radiusInMeters');
  return created;
};

export const updateUserByAdmin = async (actorId, userId, payload) => {
  ensureValidObjectId(userId, 'userId');

  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (payload.isActive === false && actorId === userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot deactivate your own account');
  }

  const updateData = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }

  if (payload.role !== undefined) {
    updateData.role = payload.role;
  }

  if (payload.isActive !== undefined) {
    updateData.isActive = payload.isActive;
  }

  if (payload.managerId !== undefined || payload.role !== undefined) {
    const targetRole = payload.role || user.role;
    const targetManagerId =
      payload.managerId !== undefined ? payload.managerId || null : user.manager ? user.manager.toString() : null;
    updateData.manager = await resolveManagerId(targetRole, targetManagerId);
  }

  if (payload.assignedOfficeId !== undefined) {
    updateData.assignedOffice = await resolveAssignedOfficeId(payload.assignedOfficeId || null);
  }

  if (
    payload.workFromHomeBypassEnabled !== undefined ||
    payload.workFromHomeBypassExpiresAt !== undefined ||
    payload.workFromHomeBypassReason !== undefined
  ) {
    updateData.workFromHomeBypass = {
      enabled:
        payload.workFromHomeBypassEnabled !== undefined
          ? payload.workFromHomeBypassEnabled
          : user.workFromHomeBypass?.enabled || false,
      expiresAt:
        payload.workFromHomeBypassExpiresAt !== undefined
          ? payload.workFromHomeBypassExpiresAt
          : user.workFromHomeBypass?.expiresAt || null,
      reason:
        payload.workFromHomeBypassReason !== undefined
          ? payload.workFromHomeBypassReason
          : user.workFromHomeBypass?.reason || ''
    };
  }

  const updated = await updateUserById(userId, updateData);
  return updated;
};

export const resetUserPasswordByAdmin = async (userId, newPassword) => {
  ensureValidObjectId(userId, 'userId');

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'New password must be different from current password');
  }

  user.password = newPassword;
  await user.save();

  return { userId: user._id };
};
