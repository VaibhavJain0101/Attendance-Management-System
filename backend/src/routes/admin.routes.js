import { Router } from 'express';
import { createUserController } from '../controllers/user.controller.js';
import {
  createOfficeLocationController,
  deleteOfficeLocationController,
  getGeofenceSettingsController,
  listGeoViolationsController,
  listOfficeLocationsController,
  updateGeofenceSettingsController,
  updateOfficeLocationController
} from '../controllers/geofence.controller.js';
import { ROLES } from '../constants/roles.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema } from '../validations/user.validation.js';
import {
  createOfficeLocationSchema,
  geofenceSettingsSchema,
  geofenceViolationQuerySchema,
  updateOfficeLocationSchema
} from '../validations/geofence.validation.js';

const router = Router();

router.post('/create-user', authenticate, authorize(ROLES.ADMIN), validate(createUserSchema), createUserController);
router.use(authenticate, authorize(ROLES.ADMIN));

router.post('/geofence', validate(createOfficeLocationSchema), createOfficeLocationController);
router.get('/geofence', listOfficeLocationsController);
router.put('/geofence/:id', validate(updateOfficeLocationSchema), updateOfficeLocationController);
router.delete('/geofence/:id', deleteOfficeLocationController);
router.get('/geofence/settings', getGeofenceSettingsController);
router.patch('/geofence/settings', validate(geofenceSettingsSchema), updateGeofenceSettingsController);
router.get('/geofence/violations', validate(geofenceViolationQuerySchema, 'query'), listGeoViolationsController);

export default router;
