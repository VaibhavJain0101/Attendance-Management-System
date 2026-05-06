import { Router } from 'express';
import { changePasswordController, loginController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { changePasswordSchema, loginSchema } from '../validations/auth.validation.js';

const router = Router();

router.post('/login', validate(loginSchema), loginController);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePasswordController);

export default router;
