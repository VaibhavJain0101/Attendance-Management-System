import { Router } from 'express';
import { exportDailyReportController, getDailyReportController } from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { reportExportQuerySchema, reportQuerySchema } from '../validations/report.validation.js';

const router = Router();

router.use(authenticate);

router.get('/daily/export', validate(reportExportQuerySchema, 'query'), exportDailyReportController);
router.get('/daily', validate(reportQuerySchema, 'query'), getDailyReportController);

export default router;
