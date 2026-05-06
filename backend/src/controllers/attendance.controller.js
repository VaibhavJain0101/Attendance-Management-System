import { StatusCodes } from 'http-status-codes';
import {
  getAttendanceList,
  markPunchIn,
  markPunchOut,
  validateAttendance
} from '../services/attendance.service.js';
import { extractRequestClientInfo } from '../services/attendanceValidation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const punchInController = asyncHandler(async (req, res) => {
  const data = await markPunchIn(req.user, req.body, extractRequestClientInfo(req));

  return successResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Punch-in recorded successfully',
    data
  });
});

export const punchOutController = asyncHandler(async (req, res) => {
  const data = await markPunchOut(req.user, req.body, extractRequestClientInfo(req));

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Punch-out recorded successfully',
    data
  });
});

export const getAttendanceController = asyncHandler(async (req, res) => {
  const result = await getAttendanceList(req.user, req.query, true);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Attendance records fetched successfully',
    data: result.data,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit
    }
  });
});

export const validateAttendanceController = asyncHandler(async (req, res) => {
  const data = await validateAttendance(req.user, req.params.attendanceId, req.body);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Attendance validation updated successfully',
    data
  });
});
