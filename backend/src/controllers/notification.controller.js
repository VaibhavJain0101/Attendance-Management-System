import { StatusCodes } from 'http-status-codes';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const getNotificationsController = asyncHandler(async (req, res) => {
  const result = await getNotifications(req.user.id, req.query);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Notifications fetched successfully',
    data: result.data,
    meta: {
      total: result.total,
      unreadCount: result.unreadCount,
      page: result.page,
      limit: result.limit
    }
  });
});

export const markNotificationReadController = asyncHandler(async (req, res) => {
  const data = await markNotificationRead(req.user.id, req.params.notificationId);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Notification marked as read',
    data
  });
});

export const markAllNotificationsReadController = asyncHandler(async (req, res) => {
  const data = await markAllNotificationsRead(req.user.id);

  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'All notifications marked as read',
    data
  });
});
