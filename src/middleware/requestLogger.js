import { log } from '../utils/logger.js';

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusEmoji = res.statusCode < 400 ? '✅' : '❌';
    log.api(req.method, req.path, `${statusEmoji} ${res.statusCode} (${duration}ms)`);
  });
  next();
};
