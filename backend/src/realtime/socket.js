import { Server } from 'socket.io';
import { ROLES } from '../constants/roles.js';
import { User } from '../models/User.js';
import { createNotifications } from '../repositories/notification.repository.js';
import { verifyToken } from '../utils/jwt.js';
import { logger } from '../config/logger.js';

let io;

const getTokenFromSocket = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  const header = socket.handshake.headers?.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  return null;
};

export const initializeSocket = (httpServer, corsOrigin) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      const payload = verifyToken(token);
      const user = await User.findById(payload.sub).select('name email role manager isActive');

      if (!user || !user.isActive) {
        return next(new Error('User is not active or no longer exists'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager ? user.manager.toString() : null
      };

      return next();
    } catch (error) {
      return next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);

    socket.emit('notification', {
      type: 'SYSTEM',
      title: 'Realtime Connected',
      message: 'Live notifications are active.',
      createdAt: new Date().toISOString()
    });

    logger.info('Socket client connected', {
      socketId: socket.id,
      userId: socket.user.id,
      role: socket.user.role
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket client disconnected', {
        socketId: socket.id,
        userId: socket.user.id,
        reason
      });
    });
  });

  return io;
};

export const getSocketIO = () => io;

const sendToUsers = (userIds, payload) => {
  return (async () => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return;
    }

    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const now = new Date();

    await createNotifications(
      uniqueIds.map((userId) => ({
        user: userId,
        type: payload.type || 'SYSTEM',
        title: payload.title || 'Notification',
        message: payload.message || '',
        metadata: payload.metadata || {},
        isRead: false,
        readAt: null,
        createdAt: now,
        updatedAt: now
      }))
    );

    const socketServer = getSocketIO();
    if (!socketServer) {
      return;
    }

    uniqueIds.forEach((userId) => {
      socketServer.to(`user:${userId}`).emit('notification', {
        ...payload,
        createdAt: now.toISOString()
      });
    });
  })();
};

export const emitNotificationToUsers = async (userIds, payload) => {
  try {
    await sendToUsers(userIds, payload);
  } catch (error) {
    logger.error('Failed to emit user notifications', { message: error.message });
  }
};

export const emitNotificationToRole = async (role, payload) => {
  try {
    if (!Object.values(ROLES).includes(role)) {
      return;
    }

    const users = await User.find({ role, isActive: true }).select('_id');
    await sendToUsers(
      users.map((user) => user._id.toString()),
      payload
    );
  } catch (error) {
    logger.error('Failed to emit role notification', { role, message: error.message });
  }
};

export const emitNotificationToManagersAndAdmins = async (payload) => {
  try {
    const users = await User.find({ role: { $in: [ROLES.MANAGER, ROLES.ADMIN] }, isActive: true }).select('_id');

    await sendToUsers(
      users.map((user) => user._id.toString()),
      payload
    );
  } catch (error) {
    logger.error('Failed to emit manager/admin notification', { message: error.message });
  }
};
