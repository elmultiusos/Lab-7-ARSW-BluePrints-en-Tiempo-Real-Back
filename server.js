import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './src/config/env.js';
import { corsOptions, allowedOrigins } from './src/config/cors.js';
import { log } from './src/utils/logger.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import authRoutes from './src/routes/auth.routes.js';
import { createBlueprintRoutes } from './src/routes/blueprint.routes.js';
import healthRoutes from './src/routes/health.routes.js';
import { setupSocketIO } from './src/sockets/blueprintSocket.js';
import { blueprints, users } from './src/models/database.js';

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();

app.use(cors(corsOptions));
log.info(`CORS configured for ${config.NODE_ENV}`, { 
  allowedOrigins: config.IS_PRODUCTION ? allowedOrigins : 'ALL (*)'
});

app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(requestLogger);

// ============================================
// HTTP SERVER & SOCKET.IO SETUP
// ============================================
const server = http.createServer(app);
const io = new Server(server, { 
  cors: corsOptions,
  maxHttpBufferSize: 1e6 // 1MB max message size
});

// Setup WebSocket handlers
setupSocketIO(io);

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/blueprints', createBlueprintRoutes(io));
app.use('/', healthRoutes);

// ============================================
// START SERVER
// ============================================
server.listen(config.PORT, () => {
  console.log('\n' + '='.repeat(60));
  log.success(`🚀 Socket.IO Server running on port ${config.PORT}`);
  log.info(`🌍 Environment: ${config.NODE_ENV}`);
  log.info(`🔒 CORS: ${config.IS_PRODUCTION ? 'RESTRICTED to ' + allowedOrigins.join(', ') : 'OPEN (development)'}`);
  log.info(`🔐 JWT Authentication: ENABLED`);
  log.info(`📡 REST API available at http://localhost:${config.PORT}/api`);
  log.info(`🔑 Auth endpoints: /api/auth/register, /api/auth/login`);
  log.info(`🏥 Health check: http://localhost:${config.PORT}/health`);
  log.info(`📊 Metrics: http://localhost:${config.PORT}/metrics`);
  log.info(`✅ Payload validation: ENABLED (Zod)`);
  log.info(`🛡️  Authorization: Per-blueprint ownership enforcement`);
  log.info(`💾 Using in-memory storage (${blueprints.size} blueprints, ${users.size} users)`);
  console.log('='.repeat(60) + '\n');
});
