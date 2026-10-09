import logger from '../utils/logger.js';
import { sendError } from '../utils/response.js';

/**
 * Global error handler — never expose stack traces, SQL errors, or secrets.
 */
const errorHandler = (err, req, res, _next) => {
  const requestId = res.requestId || 'unknown';

  logger.error('Unhandled error', {
    requestId,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    route: `${req.method} ${req.originalUrl}`,
  });

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      reason: e.message,
    }));
    return sendError(res, 422, 'VALIDATION_ERROR', 'One or more fields are invalid.', details);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, 'DUPLICATE_ENTRY', `A record with this ${field} already exists.`);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      reason: issue.message,
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'One or more fields are invalid.', details);
  }

  // Default 500
  return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
};

export default errorHandler;
