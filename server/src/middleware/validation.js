import { sendError } from '../utils/response.js';

/**
 * Creates a Zod validation middleware for the given schema.
 * Validates req.body by default; pass 'query' or 'params' to validate those.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        reason: issue.message,
      }));
      return sendError(res, 400, 'VALIDATION_ERROR', 'One or more fields are invalid.', details);
    }
    req[source] = result.data;
    next();
  };
};

export default validate;
