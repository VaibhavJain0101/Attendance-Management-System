import { StatusCodes } from 'http-status-codes';
import { getOvertimeList, requestOvertime, reviewOvertime } from '../services/overtime.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const requestOvertimeController = asyncHandler(async (req, res) => {
  const data = await requestOvertime(req.user, req.body);

  return successResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Overtime request submitted successfully',
    data
  });
});

export const reviewOvertimeController = asyncHandler(async (req, res) => {
  const data = await reviewOvertime(req.user, req.params.overtimeId, req.body);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Overtime request reviewed successfully',
    data
  });
});

export const getOvertimeController = asyncHandler(async (req, res) => {
  const result = await getOvertimeList(req.user, req.query);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Overtime requests fetched successfully',
    data: result.data,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit
    }
  });
});
