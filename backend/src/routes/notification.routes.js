import { Router } from 'express';
import {
  getNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { notificationQuerySchema } from '../validations/notification.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(notificationQuerySchema, 'query'), getNotificationsController);
router.patch('/read-all', markAllNotificationsReadController);
router.patch('/:notificationId/read', markNotificationReadController);

export default router;
