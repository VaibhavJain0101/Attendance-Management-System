import { Router } from 'express';
import { createUserController } from '../controllers/user.controller.js';
import { ROLES } from '../constants/roles.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema } from '../validations/user.validation.js';

const router = Router();

router.post('/create-user', authenticate, authorize(ROLES.ADMIN), validate(createUserSchema), createUserController);

export default router;
