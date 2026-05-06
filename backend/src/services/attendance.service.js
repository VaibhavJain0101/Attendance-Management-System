import { StatusCodes } from 'http-status-codes';
import { SHIFT_HOURS, VALIDATION_STATUS, WORKING_STATUS } from '../constants/attendance.js';
import { ROLES } from '../constants/roles.js';
import { Attendance } from '../models/Attendance.js';
import {
  createAttendance,
  findAttendanceById,
  findAttendanceByUserDate,
  listAttendance,
  listAttendanceWithoutPagination
} from '../repositories/attendance.repository.js';
import { emitNotificationToUsers } from '../realtime/socket.js';
import { ApiError } from '../utils/ApiError.js';
import { getDateKey, hoursBetween } from '../utils/date.js';
import { resolveScopedUserIds } from './scope.service.js';

const toEvent = (payload) => ({
  time: payload.time ? new Date(payload.time) : new Date(),
  selfie: payload.selfie,
  location: {
    latitude: payload.location.latitude,
    longitude: payload.location.longitude
  }
});

const updateWorkingStatus = (attendance) => {
  const effectiveHours = attendance.totalWorkingHours + (attendance.overtime?.approvedHours || 0);
  attendance.workingStatus = effectiveHours >= SHIFT_HOURS ? WORKING_STATUS.COMPLETED : WORKING_STATUS.INCOMPLETE;
};

export const markPunchIn = async (userId, payload) => {
  const event = toEvent(payload);
  const dateKey = getDateKey(event.time);

  const existing = await findAttendanceByUserDate(userId, dateKey);
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Punch-in already recorded for today');
  }

  return createAttendance({
    user: userId,
    dateKey,
    punchIn: event,
    workingStatus: WORKING_STATUS.PENDING
  });
};

export const markPunchOut = async (userId, payload) => {
  const event = toEvent(payload);

  const attendance = await Attendance.findOne({ user: userId, punchOut: null }).sort({ createdAt: -1 });
  if (!attendance) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No active punch-in found for punch-out');
  }

  if (event.time < attendance.punchIn.time) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Punch-out time cannot be before punch-in time');
  }

  attendance.punchOut = event;
  attendance.totalWorkingHours = hoursBetween(attendance.punchIn.time, event.time);
  updateWorkingStatus(attendance);

  await attendance.save();
  const validated = await findAttendanceById(attendance._id);

  emitNotificationToUsers([validated.user._id.toString()], {
    type: 'ATTENDANCE_VALIDATED',
    title: 'Attendance Validation Updated',
    message: `Your attendance for ${validated.dateKey} was marked ${validated.validation.status}.`,
    metadata: {
      attendanceId: validated._id.toString(),
      status: validated.validation.status,
      remarks: validated.validation.remarks || ''
    }
  });

  return validated;
};

export const getAttendanceList = async (actor, query, withPagination = true) => {
  const scopedUserIds = await resolveScopedUserIds(actor, query.userId || null);
  const filter = {};

  if (scopedUserIds) {
    filter.user = scopedUserIds.length ? { $in: scopedUserIds } : null;
    if (!scopedUserIds.length) {
      return {
        data: [],
        total: 0,
        page: query.page,
        limit: query.limit
      };
    }
  }

  if (query.status) {
    filter.workingStatus = query.status;
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

  if (!withPagination) {
    const rows = await listAttendanceWithoutPagination({ filter, sort: { dateKey: -1 } });
    return { data: rows, total: rows.length };
  }

  const [data, total] = await listAttendance({
    filter,
    page: query.page,
    limit: query.limit,
    sort: { dateKey: -1 }
  });

  return {
    data,
    total,
    page: query.page,
    limit: query.limit
  };
};

export const validateAttendance = async (actor, attendanceId, payload) => {
  const attendance = await findAttendanceById(attendanceId);
  if (!attendance) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Attendance record not found');
  }

  if (actor.role === ROLES.MANAGER) {
    const ownerManagerId = attendance.user.manager ? attendance.user.manager.toString() : null;
    if (ownerManagerId !== actor.id) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can validate only team attendance records');
    }
  }

  attendance.validation = {
    status: payload.status === 'VALID' ? VALIDATION_STATUS.VALID : VALIDATION_STATUS.INVALID,
    remarks: payload.remarks,
    validatedBy: actor.id,
    validatedAt: new Date()
  };

  await attendance.save();
  return findAttendanceById(attendance._id);
};
