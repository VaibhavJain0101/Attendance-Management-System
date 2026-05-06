import { StatusCodes } from 'http-status-codes';
import {
  createUserByAdmin,
  getUsers,
  resetUserPasswordByAdmin,
  updateUserByAdmin
} from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const getUsersController = asyncHandler(async (req, res) => {
  const result = await getUsers(req.query);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Users fetched successfully',
    data: result.data,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit
    }
  });
});

export const getTeamUsersController = asyncHandler(async (req, res) => {
  const managerId = req.user.role === 'ADMIN' ? req.query.managerId || null : req.user.id;
  const result = await getUsers({
    ...req.query,
    managerId
  });

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Team users fetched successfully',
    data: result.data,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit
    }
  });
});

export const createUserController = asyncHandler(async (req, res) => {
  const data = await createUserByAdmin(req.body);

  return successResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'User created successfully',
    data
  });
});

export const updateUserController = asyncHandler(async (req, res) => {
  const data = await updateUserByAdmin(req.user.id, req.params.userId, req.body);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'User updated successfully',
    data
  });
});

export const resetUserPasswordController = asyncHandler(async (req, res) => {
  const data = await resetUserPasswordByAdmin(req.params.userId, req.body.newPassword);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'User password reset successfully',
    data
  });
});
