import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ROLES } from '../constants/roles.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const getTeamUserIds = async (managerId) => {
  const members = await User.find({ manager: managerId, isActive: true }).select('_id');
  return members.map((member) => member._id.toString());
};

export const ensureValidObjectId = (value, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`);
  }
};

export const resolveScopedUserIds = async (actor, requestedUserId = null) => {
  if (actor.role === ROLES.ADMIN) {
    if (!requestedUserId) {
      return null;
    }

    return [requestedUserId];
  }

  if (actor.role === ROLES.MANAGER) {
    const teamIds = await getTeamUserIds(actor.id);

    if (!requestedUserId) {
      return teamIds;
    }

    if (!teamIds.includes(requestedUserId)) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can access only your team data');
    }

    return [requestedUserId];
  }

  if (requestedUserId && requestedUserId !== actor.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can access only your own data');
  }

  return [actor.id];
};
