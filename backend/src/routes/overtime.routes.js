import { Router } from 'express';
import {
  getOvertimeController,
  requestOvertimeController,
  reviewOvertimeController
} from '../controllers/overtime.controller.js';
import { ROLES } from '../constants/roles.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  overtimeQuerySchema,
  overtimeRequestSchema,
  overtimeReviewSchema
} from '../validations/overtime.validation.js';

const router = Router();

router.use(authenticate);

router.post('/request', authorize(ROLES.EMPLOYEE), validate(overtimeRequestSchema), requestOvertimeController);
router.get('/', validate(overtimeQuerySchema, 'query'), getOvertimeController);
router.patch(
  '/:overtimeId/review',
  authorize(ROLES.MANAGER, ROLES.ADMIN),
  validate(overtimeReviewSchema),
  reviewOvertimeController
);

export default router;
