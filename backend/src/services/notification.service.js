import { StatusCodes } from 'http-status-codes';
import {
  findNotificationById,
  listNotificationsByUser,
  markAllNotificationsReadByUser,
  markNotificationReadById
} from '../repositories/notification.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureValidObjectId } from './scope.service.js';

export const getNotifications = async (userId, query) => {
  const [rows, total, unreadCount] = await listNotificationsByUser({
    userId,
    isRead: query.isRead,
    type: query.type,
    page: query.page,
    limit: query.limit
  });

  return {
    data: rows,
    total,
    unreadCount,
    page: query.page,
    limit: query.limit
  };
};

export const markNotificationRead = async (userId, notificationId) => {
  ensureValidObjectId(notificationId, 'notificationId');

  const notification = await findNotificationById(notificationId);

  if (!notification) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }

  if (notification.user.toString() !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can modify only your own notifications');
  }

  if (notification.isRead) {
    return notification;
  }

  return markNotificationReadById(notificationId);
};

export const markAllNotificationsRead = async (userId) => {
  const result = await markAllNotificationsReadByUser(userId);
  return { modifiedCount: result.modifiedCount || 0 };
};
