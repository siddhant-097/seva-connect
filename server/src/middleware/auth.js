import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { sendError } from '../utils/response.js';
import User from '../models/User.js';

/**
 * Middleware: verifies JWT access token and attaches req.user.
 * Derives user from token — never trusts body.userId / query.userId.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'AUTHENTICATION_REQUIRED', 'Missing or invalid authentication token.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.sub).select('-password -__v');
    if (!user) {
      return sendError(res, 401, 'USER_NOT_FOUND', 'Authenticated user no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'TOKEN_EXPIRED', 'Access token has expired.');
    }
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid authentication token.');
  }
};

/**
 * Optional authentication — attaches req.user if token is present, but does not block.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.sub).select('-password -__v');
      if (user) req.user = user;
    }
  } catch {
    // silently continue without authentication
  }
  next();
};

/**
 * Role-based authorization guard.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.');
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to perform this action.');
    }
    next();
  };
};
