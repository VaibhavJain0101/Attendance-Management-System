import { Router } from 'express';
import {
  getAttendanceController,
  punchInController,
  punchOutController,
  validateAttendanceController
} from '../controllers/attendance.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
  attendanceQuerySchema,
  attendanceValidationSchema,
  punchInSchema,
  punchOutSchema
} from '../validations/attendance.validation.js';

const router = Router();

router.use(authenticate);

router.post('/punch-in', authorize(ROLES.EMPLOYEE), validate(punchInSchema), punchInController);
router.post('/punch-out', authorize(ROLES.EMPLOYEE), validate(punchOutSchema), punchOutController);
router.post('/checkin', authorize(ROLES.EMPLOYEE), validate(punchInSchema), punchInController);
router.post('/checkout', authorize(ROLES.EMPLOYEE), validate(punchOutSchema), punchOutController);
router.get('/', validate(attendanceQuerySchema, 'query'), getAttendanceController);
router.patch(
  '/:attendanceId/validate',
  authorize(ROLES.MANAGER, ROLES.ADMIN),
  validate(attendanceValidationSchema),
  validateAttendanceController
);

export default router;
