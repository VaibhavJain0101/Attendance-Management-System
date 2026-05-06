import http from 'http';
import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initializeSocket } from './realtime/socket.js';

const startServer = async () => {
  await connectDatabase();

  const httpServer = http.createServer(app);
  initializeSocket(httpServer, env.corsOrigin);

  const server = httpServer.listen(env.port, () => {
    logger.info(`Server started on port ${env.port}`);
  });

  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Gracefully shutting down.`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((error) => {
  logger.error('Failed to start server', { message: error.message, stack: error.stack });
  process.exit(1);
});
