import { z } from 'zod';
import { log } from '../utils/logger.js';

// Validation middleware factory
export const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse(req.body);
    req.body = validated; // Replace with validated data
    log.debug('Payload validated successfully');
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn('Validation failed', { errors: error.errors });
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};
