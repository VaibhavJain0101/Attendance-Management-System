import { StatusCodes } from 'http-status-codes';
import { GeofenceSetting } from '../models/GeofenceSetting.js';
import { GeoViolation } from '../models/GeoViolation.js';
import { OfficeLocation } from '../models/OfficeLocation.js';
import { User } from '../models/User.js';
import { GEO_STATUS, GEOFENCE_DECISION, GEO_VIOLATION_ACTION } from '../constants/geofence.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateHaversineDistanceMeters, isWithinRadius } from './distanceCalculation.service.js';

const normalizeGoogleMapUrl = (payload) => {
  if (payload.googleMapUrl) {
    return payload.googleMapUrl;
  }

  if (payload.latitude !== undefined && payload.longitude !== undefined) {
    return `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`;
  }

  return '';
};

export const ensureGeofenceSettings = async () => {
  let settings = await GeofenceSetting.findOne().sort({ createdAt: -1 });

  if (!settings) {
    settings = await GeofenceSetting.create({});
  }

  return settings;
};

export const getGeofenceSettings = async () => ensureGeofenceSettings();

export const updateGeofenceSettings = async (actorId, payload) => {
  const settings = await ensureGeofenceSettings();

  Object.assign(settings, {
    ...payload,
    updatedBy: actorId
  });

  await settings.save();
  return settings;
};

export const createOfficeLocation = async (actorId, payload) => {
  const settings = await ensureGeofenceSettings();

  if (payload.radiusInMeters > settings.maximumAllowedRadius) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `radiusInMeters cannot exceed configured maximumAllowedRadius (${settings.maximumAllowedRadius})`
    );
  }

  return OfficeLocation.create({
    ...payload,
    googleMapUrl: normalizeGoogleMapUrl(payload),
    createdBy: actorId
  });
};

export const listOfficeLocations = async ({ includeInactive = true } = {}) =>
  OfficeLocation.find(includeInactive ? {} : { isActive: true }).sort({ createdAt: -1 });

export const getOfficeLocationById = async (officeId) => {
  const office = await OfficeLocation.findById(officeId);
  if (!office) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Office location not found');
  }
  return office;
};

export const updateOfficeLocation = async (officeId, payload) => {
  const office = await getOfficeLocationById(officeId);
  const settings = await ensureGeofenceSettings();

  if (payload.radiusInMeters !== undefined && payload.radiusInMeters > settings.maximumAllowedRadius) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `radiusInMeters cannot exceed configured maximumAllowedRadius (${settings.maximumAllowedRadius})`
    );
  }

  Object.assign(office, {
    ...payload,
    ...(payload.latitude !== undefined || payload.longitude !== undefined
      ? {
          googleMapUrl: normalizeGoogleMapUrl({
            latitude: payload.latitude ?? office.latitude,
            longitude: payload.longitude ?? office.longitude,
            googleMapUrl: payload.googleMapUrl
          })
        }
      : {})
  });

  await office.save();
  return office;
};

export const deleteOfficeLocation = async (officeId) => {
  const office = await getOfficeLocationById(officeId);
  await office.deleteOne();
  return { id: officeId };
};

const hasWfhBypass = (actor) => {
  if (!actor?.workFromHomeBypass?.enabled) {
    return false;
  }

  if (!actor.workFromHomeBypass.expiresAt) {
    return true;
  }

  return new Date(actor.workFromHomeBypass.expiresAt) > new Date();
};

const getOfficeCandidatesForActor = async (actor) => {
  const actorFromDb = await User.findById(actor.id).select('assignedOffice workFromHomeBypass').populate('assignedOffice');

  if (!actorFromDb) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authenticated user not found');
  }

  const actorWithFreshData = {
    ...actor,
    workFromHomeBypass: actorFromDb.workFromHomeBypass,
    assignedOffice: actorFromDb.assignedOffice ? actorFromDb.assignedOffice._id.toString() : null
  };

  if (actorFromDb.assignedOffice && actorFromDb.assignedOffice.isActive) {
    return {
      actor: actorWithFreshData,
      offices: [actorFromDb.assignedOffice]
    };
  }

  const offices = await OfficeLocation.find({ isActive: true }).sort({ createdAt: -1 });

  return {
    actor: actorWithFreshData,
    offices
  };
};

const getClosestOffice = (offices, latitude, longitude) => {
  if (!offices.length) {
    return null;
  }

  let closest = null;

  for (const office of offices) {
    const distance = calculateHaversineDistanceMeters(
      { latitude, longitude },
      { latitude: office.latitude, longitude: office.longitude }
    );

    if (!closest || distance < closest.distanceFromOffice) {
      closest = {
        office,
        distanceFromOffice: Number(distance.toFixed(2))
      };
    }
  }

  if (!closest) {
    return null;
  }

  return {
    ...closest,
    isInsideRadius: isWithinRadius(closest.distanceFromOffice, closest.office.radiusInMeters)
  };
};

export const evaluateGeofenceForAttendance = async ({ actor, latitude, longitude, gpsAccuracy }) => {
  const settings = await ensureGeofenceSettings();

  if (!settings.geofenceEnabled) {
    return {
      settings,
      office: null,
      distanceFromOffice: null,
      geoStatus: GEO_STATUS.INSIDE,
      isInsideRadius: true,
      isSuspicious: false,
      decision: GEOFENCE_DECISION.GEOFENCE_DISABLED,
      allowed: true,
      reason: 'Geofencing is disabled by admin'
    };
  }

  const { actor: actorWithFreshData, offices } = await getOfficeCandidatesForActor(actor);

  if (!offices.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No active office geofence found. Contact admin.');
  }

  if (settings.allowWfhBypass && hasWfhBypass(actorWithFreshData)) {
    return {
      settings,
      office: null,
      distanceFromOffice: null,
      geoStatus: GEO_STATUS.OUTSIDE,
      isInsideRadius: false,
      isSuspicious: false,
      decision: GEOFENCE_DECISION.WFH_BYPASS,
      allowed: true,
      reason: 'Attendance allowed due to active work-from-home bypass'
    };
  }

  const closest = getClosestOffice(offices, latitude, longitude);
  const isInsideRadius = Boolean(closest?.isInsideRadius);
  const geoStatus = isInsideRadius ? GEO_STATUS.INSIDE : GEO_STATUS.OUTSIDE;

  if (gpsAccuracy && gpsAccuracy > settings.gpsAccuracyThreshold) {
    const shouldBlock = settings.strictGeofenceMode && !settings.allowOutsideAttendance;

    return {
      settings,
      office: closest?.office || null,
      distanceFromOffice: closest?.distanceFromOffice ?? null,
      geoStatus,
      isInsideRadius,
      isSuspicious: true,
      decision: GEOFENCE_DECISION.GPS_ACCURACY_FAILED,
      allowed: !shouldBlock,
      reason: `GPS accuracy ${gpsAccuracy}m is above allowed threshold ${settings.gpsAccuracyThreshold}m`
    };
  }

  if (isInsideRadius) {
    return {
      settings,
      office: closest.office,
      distanceFromOffice: closest.distanceFromOffice,
      geoStatus,
      isInsideRadius: true,
      isSuspicious: false,
      decision: GEOFENCE_DECISION.ALLOWED,
      allowed: true,
      reason: 'Employee is inside geofence radius'
    };
  }

  if (settings.allowOutsideAttendance) {
    return {
      settings,
      office: closest.office,
      distanceFromOffice: closest.distanceFromOffice,
      geoStatus,
      isInsideRadius: false,
      isSuspicious: settings.autoMarkSuspicious,
      decision: settings.autoMarkSuspicious
        ? GEOFENCE_DECISION.MARKED_SUSPICIOUS
        : GEOFENCE_DECISION.ALLOWED,
      allowed: true,
      reason: settings.autoMarkSuspicious
        ? 'Outside geofence. Attendance allowed and marked suspicious.'
        : 'Outside geofence. Attendance allowed by admin policy.'
    };
  }

  if (!settings.strictGeofenceMode) {
    return {
      settings,
      office: closest.office,
      distanceFromOffice: closest.distanceFromOffice,
      geoStatus,
      isInsideRadius: false,
      isSuspicious: true,
      decision: GEOFENCE_DECISION.MARKED_SUSPICIOUS,
      allowed: true,
      reason: 'Outside geofence. Attendance allowed in non-strict mode and marked suspicious.'
    };
  }

  return {
    settings,
    office: closest.office,
    distanceFromOffice: closest.distanceFromOffice,
    geoStatus,
    isInsideRadius: false,
    isSuspicious: true,
    decision: GEOFENCE_DECISION.BLOCKED,
    allowed: false,
    reason: 'Outside geofence. Strict geofence mode blocked attendance.'
  };
};

const mapDecisionToViolationAction = (decision) => {
  if (decision === GEOFENCE_DECISION.BLOCKED) return GEO_VIOLATION_ACTION.BLOCKED;
  if (decision === GEOFENCE_DECISION.GPS_ACCURACY_FAILED) return GEO_VIOLATION_ACTION.GPS_ACCURACY_FAILED;
  if (decision === GEOFENCE_DECISION.MARKED_SUSPICIOUS) return GEO_VIOLATION_ACTION.MARKED_SUSPICIOUS;
  if (decision === GEOFENCE_DECISION.WFH_BYPASS) return GEO_VIOLATION_ACTION.WFH_BYPASS;
  return GEO_VIOLATION_ACTION.ALLOWED;
};

export const logGeoViolation = async ({
  actor,
  attendanceId = null,
  office = null,
  employeeLatitude,
  employeeLongitude,
  distance,
  geoStatus,
  decision,
  reason
}) => {
  if (geoStatus !== GEO_STATUS.OUTSIDE && decision === GEOFENCE_DECISION.ALLOWED) {
    return null;
  }

  return GeoViolation.create({
    employeeId: actor.id,
    attendanceId,
    officeLocationId: office?._id || null,
    employeeLatitude,
    employeeLongitude,
    officeLatitude: office?.latitude ?? null,
    officeLongitude: office?.longitude ?? null,
    distance: distance ?? null,
    geoStatus,
    actionTaken: mapDecisionToViolationAction(decision),
    notes: reason || ''
  });
};

export const getActiveOfficeLocations = async () => listOfficeLocations({ includeInactive: false });

export const validateGeofencePreview = async ({ actor, latitude, longitude, gpsAccuracy }) =>
  evaluateGeofenceForAttendance({ actor, latitude, longitude, gpsAccuracy });

export const listGeoViolations = async ({ page = 1, limit = 20, employeeId = null, actionTaken = null }) => {
  const filter = {};

  if (employeeId) {
    filter.employeeId = employeeId;
  }

  if (actionTaken) {
    filter.actionTaken = actionTaken;
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    GeoViolation.find(filter)
      .populate('employeeId', 'name email role')
      .populate('attendanceId', 'dateKey')
      .populate('officeLocationId', 'officeName radiusInMeters')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    GeoViolation.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit
  };
};
