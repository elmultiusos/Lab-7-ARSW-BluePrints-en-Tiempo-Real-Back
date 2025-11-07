import { config } from './env.js';

// CORS Configuration - Restrict origins in production
export const allowedOrigins = config.IS_PRODUCTION 
  ? [
      // Add production domains
    ]
  : ['http://localhost:5173', 'http://localhost:3000']; // Development

export const corsOptions = {
  origin: config.IS_PRODUCTION ? allowedOrigins : '*',
  credentials: true
};
