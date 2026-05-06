import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  logger.error('Request failed', {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    message: error.message,
    stack: error.stack
  });

  const response = {
    success: false,
    message: error.message || getReasonPhrase(statusCode)
  };

  if (error.details) {
    response.details = error.details;
  }

  if (env.nodeEnv !== 'production') {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};
