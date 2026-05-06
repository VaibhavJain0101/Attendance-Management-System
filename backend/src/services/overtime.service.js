import { StatusCodes } from 'http-status-codes';
import { OVERTIME_STATUS, SHIFT_HOURS, WORKING_STATUS } from '../constants/attendance.js';
import { ROLES } from '../constants/roles.js';
import { Attendance } from '../models/Attendance.js';
import {
  createOvertime,
  findOvertimeByAttendanceEmployee,
  findOvertimeById,
  listOvertime
} from '../repositories/overtime.repository.js';
import { emitNotificationToManagersAndAdmins, emitNotificationToUsers } from '../realtime/socket.js';
import { ApiError } from '../utils/ApiError.js';
import { getDateKey } from '../utils/date.js';
import { getTeamUserIds, resolveScopedUserIds } from './scope.service.js';

export const requestOvertime = async (actor, payload) => {
  const attendance = await Attendance.findById(payload.attendanceId);

  if (!attendance) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Attendance record not found');
  }

  if (attendance.user.toString() !== actor.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can request overtime only for your own attendance');
  }

  if (!attendance.punchOut) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Punch-out is required before requesting overtime');
  }

  const existing = await findOvertimeByAttendanceEmployee(attendance._id, actor.id);
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Overtime request already exists for this attendance');
  }

  const request = await createOvertime({
    attendance: attendance._id,
    employee: actor.id,
    dateKey: attendance.dateKey,
    requestedHours: payload.requestedHours,
    reason: payload.reason,
    status: OVERTIME_STATUS.PENDING
  });

  attendance.overtime.requestedHours = payload.requestedHours;
  attendance.overtime.status = OVERTIME_STATUS.PENDING;
  await attendance.save();

  const requestWithRelations = await findOvertimeById(request._id);

  await emitNotificationToManagersAndAdmins({
    type: 'OVERTIME_REQUESTED',
    title: 'New Overtime Request',
    message: `${actor.name} requested ${payload.requestedHours} overtime hours for ${attendance.dateKey}.`,
    metadata: {
      overtimeId: request._id.toString(),
      attendanceId: attendance._id.toString(),
      employeeId: actor.id
    }
  });

  return requestWithRelations;
};

export const reviewOvertime = async (actor, overtimeId, payload) => {
  const overtime = await findOvertimeById(overtimeId);

  if (!overtime) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Overtime request not found');
  }

  if (actor.role === ROLES.MANAGER) {
    const teamIds = await getTeamUserIds(actor.id);
    if (!teamIds.includes(overtime.employee._id.toString())) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can review only your team overtime requests');
    }
  }

  if (overtime.status !== OVERTIME_STATUS.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Overtime request has already been reviewed');
  }

  overtime.status = payload.status;
  overtime.reviewComment = payload.reviewComment;
  overtime.reviewedBy = actor.id;
  overtime.reviewedAt = new Date();
  await overtime.save();

  const attendance = await Attendance.findById(overtime.attendance._id);

  if (payload.status === OVERTIME_STATUS.APPROVED) {
    attendance.overtime.status = OVERTIME_STATUS.APPROVED;
    attendance.overtime.approvedHours = overtime.requestedHours;
    const totalWithOvertime = attendance.totalWorkingHours + overtime.requestedHours;
    attendance.workingStatus =
      totalWithOvertime >= SHIFT_HOURS ? WORKING_STATUS.COMPLETED : WORKING_STATUS.INCOMPLETE;
  } else {
    attendance.overtime.status = OVERTIME_STATUS.REJECTED;
    attendance.overtime.approvedHours = 0;
  }

  await attendance.save();

  const reviewed = await findOvertimeById(overtime._id);

  emitNotificationToUsers([reviewed.employee._id.toString()], {
    type: 'OVERTIME_REVIEWED',
    title: 'Overtime Request Reviewed',
    message: `Your overtime request for ${reviewed.dateKey} was ${payload.status}.`,
    metadata: {
      overtimeId: reviewed._id.toString(),
      attendanceId: reviewed.attendance?._id?.toString() || null,
      reviewedBy: actor.id,
      status: payload.status
    }
  });

  return reviewed;
};

export const getOvertimeList = async (actor, query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate || query.endDate) {
    filter.dateKey = {};
    if (query.startDate) {
      filter.dateKey.$gte = getDateKey(new Date(query.startDate));
    }
    if (query.endDate) {
      filter.dateKey.$lte = getDateKey(new Date(query.endDate));
    }
  }

  const scopedUserIds = await resolveScopedUserIds(actor, query.employeeId || null);
  if (scopedUserIds) {
    if (!scopedUserIds.length) {
      return { data: [], total: 0, page: query.page, limit: query.limit };
    }
    filter.employee = { $in: scopedUserIds };
  }

  const [data, total] = await listOvertime({
    filter,
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 }
  });

  return {
    data,
    total,
    page: query.page,
    limit: query.limit
  };
};
