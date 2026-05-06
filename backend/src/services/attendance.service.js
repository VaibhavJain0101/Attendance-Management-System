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
import { emitNotificationToManagersAndAdmins } from '../realtime/socket.js';
import { ApiError } from '../utils/ApiError.js';
import { getDateKey, hoursBetween } from '../utils/date.js';
import { resolveScopedUserIds } from './scope.service.js';
import { validateAttendanceGeo } from './attendanceValidation.service.js';

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

const maybeNotifyGeoViolation = async (userId, geofenceResult) => {
  if (!geofenceResult?.isSuspicious) {
    return;
  }

  await emitNotificationToManagersAndAdmins({
    type: 'GEOFENCE_VIOLATION',
    title: 'Geofence Policy Alert',
    message: `Attendance location anomaly detected for user ${userId}. ${geofenceResult.reason}`,
    metadata: {
      userId,
      decision: geofenceResult.decision,
      geoStatus: geofenceResult.geoStatus,
      distanceFromOffice: geofenceResult.distanceFromOffice,
      officeLocationId: geofenceResult.office?._id?.toString() || null
    }
  });
};

export const markPunchIn = async (actor, payload, clientInfo = {}) => {
  const event = toEvent(payload);
  const dateKey = getDateKey(event.time);

  const existing = await findAttendanceByUserDate(actor.id, dateKey);
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Punch-in already recorded for today');
  }
  const geofenceResult = await validateAttendanceGeo({ actor, payload });

  const data = await createAttendance({
    user: actor.id,
    dateKey,
    punchIn: event,
    workingStatus: WORKING_STATUS.PENDING,
    geofence: {
      officeLocation: geofenceResult.office?._id || null,
      officeLatitude: geofenceResult.office?.latitude ?? null,
      officeLongitude: geofenceResult.office?.longitude ?? null,
      distanceFromOffice: geofenceResult.distanceFromOffice,
      geoStatus: geofenceResult.geoStatus,
      decision: geofenceResult.decision,
      isSuspicious: geofenceResult.isSuspicious,
      gpsAccuracy: payload?.gpsAccuracy ?? null
    },
    geoMeta: {
      checkInLatitude: payload.location.latitude,
      checkInLongitude: payload.location.longitude
    },
    clientInfo: {
      deviceInfo: payload.deviceFingerprint || clientInfo.deviceInfo || '',
      browserInfo: clientInfo.browserInfo || '',
      ipAddress: clientInfo.ipAddress || ''
    }
  });

  await maybeNotifyGeoViolation(actor.id, geofenceResult);
  return data;
};

export const markPunchOut = async (actor, payload, clientInfo = {}) => {
  const event = toEvent(payload);

  const attendance = await Attendance.findOne({ user: actor.id, punchOut: null }).sort({ createdAt: -1 });
  if (!attendance) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No active punch-in found for punch-out');
  }
  const geofenceResult = await validateAttendanceGeo({ actor, payload, attendanceId: attendance._id });

  if (event.time < attendance.punchIn.time) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Punch-out time cannot be before punch-in time');
  }

  attendance.punchOut = event;
  attendance.totalWorkingHours = hoursBetween(attendance.punchIn.time, event.time);
  attendance.geofence = {
    officeLocation: geofenceResult.office?._id || attendance.geofence?.officeLocation || null,
    officeLatitude: geofenceResult.office?.latitude ?? attendance.geofence?.officeLatitude ?? null,
    officeLongitude: geofenceResult.office?.longitude ?? attendance.geofence?.officeLongitude ?? null,
    distanceFromOffice: geofenceResult.distanceFromOffice,
    geoStatus: geofenceResult.geoStatus,
    decision: geofenceResult.decision,
    isSuspicious: Boolean(attendance.geofence?.isSuspicious || geofenceResult.isSuspicious),
    gpsAccuracy: payload?.gpsAccuracy ?? attendance.geofence?.gpsAccuracy ?? null
  };
  attendance.geoMeta = {
    checkInLatitude: attendance.geoMeta?.checkInLatitude ?? null,
    checkInLongitude: attendance.geoMeta?.checkInLongitude ?? null,
    checkOutLatitude: payload.location.latitude,
    checkOutLongitude: payload.location.longitude
  };
  attendance.clientInfo = {
    deviceInfo: payload.deviceFingerprint || clientInfo.deviceInfo || attendance.clientInfo?.deviceInfo || '',
    browserInfo: clientInfo.browserInfo || attendance.clientInfo?.browserInfo || '',
    ipAddress: clientInfo.ipAddress || attendance.clientInfo?.ipAddress || ''
  };
  updateWorkingStatus(attendance);

  await attendance.save();
  const validated = await findAttendanceById(attendance._id);
  await maybeNotifyGeoViolation(actor.id, geofenceResult);

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

const getSignedUrlExpiry = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    const params = parsed.searchParams;

    const amzDate = params.get('X-Amz-Date');
    const amzExpires = params.get('X-Amz-Expires');
    if (amzDate && amzExpires) {
      const yyyy = Number(amzDate.slice(0, 4));
      const mm = Number(amzDate.slice(4, 6)) - 1;
      const dd = Number(amzDate.slice(6, 8));
      const hh = Number(amzDate.slice(9, 11));
      const min = Number(amzDate.slice(11, 13));
      const ss = Number(amzDate.slice(13, 15));
      const start = Date.UTC(yyyy, mm, dd, hh, min, ss);
      const expiresAt = new Date(start + Number(amzExpires) * 1000);
      if (!Number.isNaN(expiresAt.getTime())) {
        return expiresAt;
      }
    }

    const unixExpiry = params.get('Expires');
    if (unixExpiry && /^\d+$/.test(unixExpiry)) {
      const asNumber = Number(unixExpiry);
      const ms = asNumber > 9999999999 ? asNumber : asNumber * 1000;
      const expiresAt = new Date(ms);
      if (!Number.isNaN(expiresAt.getTime())) {
        return expiresAt;
      }
    }

    const azureExpiry = params.get('se');
    if (azureExpiry) {
      const expiresAt = new Date(azureExpiry);
      if (!Number.isNaN(expiresAt.getTime())) {
        return expiresAt;
      }
    }

    return null;
  } catch {
    return null;
  }
};

const canActorAccessAttendance = (actor, attendance) => {
  const attendanceUserId = attendance.user?._id?.toString?.() || attendance.user?.toString?.() || null;

  if (actor.role === ROLES.ADMIN) return true;
  if (actor.role === ROLES.EMPLOYEE) return attendanceUserId === actor.id;

  if (actor.role === ROLES.MANAGER) {
    const managerId = attendance.user?.manager ? attendance.user.manager.toString() : null;
    return attendanceUserId === actor.id || managerId === actor.id;
  }

  return false;
};

export const getAttendanceSelfiePreview = async (actor, attendanceId, eventType = 'punchIn') => {
  if (!['punchIn', 'punchOut'].includes(eventType)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'event must be either punchIn or punchOut');
  }

  const attendance = await findAttendanceById(attendanceId);
  if (!attendance) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Attendance record not found');
  }

  if (!canActorAccessAttendance(actor, attendance)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to preview this selfie');
  }

  const selfie = attendance?.[eventType]?.selfie || '';
  if (!selfie) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Selfie not available for this attendance event');
  }

  const isDataUrl = /^data:image\//i.test(selfie);
  const isHttpUrl = /^https?:\/\//i.test(selfie);
  const expiresAt = isHttpUrl ? getSignedUrlExpiry(selfie) : null;

  return {
    url: selfie,
    eventType,
    isDataUrl,
    isHttpUrl,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    isExpired: expiresAt ? expiresAt.getTime() <= Date.now() : false
  };
};
