import { v4 as uuidv4 } from 'uuid';

/**
 * Standard success response following the API_CONTRACT.md envelope.
 */
export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      requestId: res.requestId || uuidv4(),
    },
  });
};

/**
 * Standard error response following the API_CONTRACT.md envelope.
 */
export const sendError = (res, statusCode, code, message, details = []) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 && { details }),
    },
    meta: {
      requestId: res.requestId || uuidv4(),
    },
  });
};
