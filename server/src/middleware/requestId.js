import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a unique requestId to every request for tracing and correlation.
 * Reads X-Request-ID header if provided by client, otherwise generates one.
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.requestId = id;
  res.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

export default requestId;
