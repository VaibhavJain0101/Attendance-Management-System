import { Notification } from '../models/Notification.js';

export const createNotifications = async (documents) => {
  if (!documents.length) {
    return [];
  }
  return Notification.insertMany(documents, { ordered: false });
};

export const listNotificationsByUser = ({ userId, isRead, type, page = 1, limit = 20 }) => {
  const filter = { user: userId };

  if (typeof isRead === 'boolean') {
    filter.isRead = isRead;
  }

  if (type) {
    filter.type = type;
  }

  const skip = (page - 1) * limit;

  return Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false })
  ]);
};

export const findNotificationById = (notificationId) => Notification.findById(notificationId);

export const markNotificationReadById = (notificationId) =>
  Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  );

export const markAllNotificationsReadByUser = (userId) =>
  Notification.updateMany({ user: userId, isRead: false }, { isRead: true, readAt: new Date() });
