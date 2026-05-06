import { StatusCodes } from 'http-status-codes';
import { evaluateGeofenceForAttendance, logGeoViolation } from './geoFence.service.js';
import { ApiError } from '../utils/ApiError.js';

const normalizeIp = (value = '') => {
  if (!value) return '';
  const ipv6Prefix = '::ffff:';
  if (value.startsWith(ipv6Prefix)) {
    return value.slice(ipv6Prefix.length);
  }
  return value;
};

export const extractRequestClientInfo = (req) => {
  const userAgent = String(req.headers['user-agent'] || '');
  const ipAddress = normalizeIp(req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '');

  return {
    deviceInfo: userAgent,
    browserInfo: userAgent,
    ipAddress
  };
};

export const validateAttendanceGeo = async ({ actor, payload, attendanceId = null }) => {
  if (payload?.isMockedLocation) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Mocked GPS location detected. Attendance blocked.');
  }

  const latitude = Number(payload?.location?.latitude);
  const longitude = Number(payload?.location?.longitude);
  const gpsAccuracy = payload?.gpsAccuracy !== undefined ? Number(payload.gpsAccuracy) : null;

  const geofenceResult = await evaluateGeofenceForAttendance({
    actor,
    latitude,
    longitude,
    gpsAccuracy
  });

  await logGeoViolation({
    actor,
    attendanceId,
    office: geofenceResult.office,
    employeeLatitude: latitude,
    employeeLongitude: longitude,
    distance: geofenceResult.distanceFromOffice,
    geoStatus: geofenceResult.geoStatus,
    decision: geofenceResult.decision,
    reason: geofenceResult.reason
  });

  if (!geofenceResult.allowed) {
    throw new ApiError(StatusCodes.FORBIDDEN, geofenceResult.reason);
  }

  return geofenceResult;
};
