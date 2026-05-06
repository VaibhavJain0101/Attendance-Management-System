import { StatusCodes } from 'http-status-codes';
import { changePassword, login } from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const loginController = asyncHandler(async (req, res) => {
  const data = await login(req.body);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Login successful',
    data
  });
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const data = await changePassword(req.user.id, req.body);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Password changed successfully',
    data
  });
});
