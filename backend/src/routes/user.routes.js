import { Router } from 'express';
import {
  createUserController,
  getTeamUsersController,
  getUsersController,
  resetUserPasswordController,
  updateUserController
} from '../controllers/user.controller.js';
import { ROLES } from '../constants/roles.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createUserSchema,
  resetUserPasswordSchema,
  updateUserSchema,
  userQuerySchema
} from '../validations/user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN), validate(userQuerySchema, 'query'), getUsersController);
router.get('/team', authorize(ROLES.MANAGER, ROLES.ADMIN), validate(userQuerySchema, 'query'), getTeamUsersController);
router.patch('/:userId', authorize(ROLES.ADMIN), validate(updateUserSchema), updateUserController);
router.patch(
  '/:userId/reset-password',
  authorize(ROLES.ADMIN),
  validate(resetUserPasswordSchema),
  resetUserPasswordController
);

export default router;
