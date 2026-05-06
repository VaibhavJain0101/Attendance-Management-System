import { StatusCodes } from 'http-status-codes';
import {
  createOfficeLocation,
  deleteOfficeLocation,
  getActiveOfficeLocations,
  getGeofenceSettings,
  listGeoViolations,
  listOfficeLocations,
  updateGeofenceSettings,
  updateOfficeLocation,
  validateGeofencePreview
} from '../services/geoFence.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const createOfficeLocationController = asyncHandler(async (req, res) => {
  const data = await createOfficeLocation(req.user.id, req.body);

  return successResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Office geofence created successfully',
    data
  });
});

export const listOfficeLocationsController = asyncHandler(async (req, res) => {
  const includeInactive = String(req.query.includeInactive || 'true').toLowerCase() === 'true';
  const data = await listOfficeLocations({ includeInactive });

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Office geofences fetched successfully',
    data
  });
});

export const updateOfficeLocationController = asyncHandler(async (req, res) => {
  const data = await updateOfficeLocation(req.params.id, req.body);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Office geofence updated successfully',
    data
  });
});

export const deleteOfficeLocationController = asyncHandler(async (req, res) => {
  const data = await deleteOfficeLocation(req.params.id);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Office geofence deleted successfully',
    data
  });
});

export const getGeofenceSettingsController = asyncHandler(async (_req, res) => {
  const data = await getGeofenceSettings();

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Geofence settings fetched successfully',
    data
  });
});

export const updateGeofenceSettingsController = asyncHandler(async (req, res) => {
  const data = await updateGeofenceSettings(req.user.id, req.body);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Geofence settings updated successfully',
    data
  });
});

export const validateGeofenceController = asyncHandler(async (req, res) => {
  const data = await validateGeofencePreview({
    actor: req.user,
    latitude: Number(req.query.latitude),
    longitude: Number(req.query.longitude),
    gpsAccuracy: req.query.gpsAccuracy !== undefined ? Number(req.query.gpsAccuracy) : null
  });

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Geofence validation completed',
    data
  });
});

export const getActiveOfficesController = asyncHandler(async (_req, res) => {
  const data = await getActiveOfficeLocations();

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Active office geofences fetched successfully',
    data
  });
});

export const listGeoViolationsController = asyncHandler(async (req, res) => {
  const result = await listGeoViolations({
    page: req.query.page,
    limit: req.query.limit,
    employeeId: req.query.employeeId || null,
    actionTaken: req.query.actionTaken || null
  });

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Geofence violations fetched successfully',
    data: result.data,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit
    }
  });
});
