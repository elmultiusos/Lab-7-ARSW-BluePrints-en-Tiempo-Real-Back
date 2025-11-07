export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

// Validate production environment
if (!process.env.JWT_SECRET && config.IS_PRODUCTION) {
  throw new Error('JWT_SECRET must be set in production!');
}
