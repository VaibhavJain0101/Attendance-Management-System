import { Router } from 'express';
import { ROLES } from '../constants/roles.js';
import {
  getActiveOfficesController,
  getGeofenceSettingsController,
  validateGeofenceController
} from '../controllers/geofence.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { geofenceValidationQuerySchema } from '../validations/geofence.validation.js';

const router = Router();

router.use(authenticate);

router.get('/offices', authorize(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN), getActiveOfficesController);
router.get('/settings', authorize(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN), getGeofenceSettingsController);
router.get(
  '/validate',
  authorize(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN),
  validate(geofenceValidationQuerySchema, 'query'),
  validateGeofenceController
);

export default router;