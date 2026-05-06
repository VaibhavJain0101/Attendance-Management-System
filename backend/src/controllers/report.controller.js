import { StatusCodes } from 'http-status-codes';
import { generateDailyReport, generateDailyReportExport } from '../services/report.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const getDailyReportController = asyncHandler(async (req, res) => {
  const result = await generateDailyReport(req.user, req.query);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Daily attendance report generated successfully',
    data: result.rows,
    meta: result.meta
  });
});

export const exportDailyReportController = asyncHandler(async (req, res) => {
  const result = await generateDailyReportExport(req.user, req.query);

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename=\"${result.fileName}\"`);
  return res.status(StatusCodes.OK).send(result.body);
});
