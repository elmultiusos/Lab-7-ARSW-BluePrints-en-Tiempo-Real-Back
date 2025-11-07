import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { z } from 'zod';

const app = express();

// ============================================
// ENVIRONMENT & SECURITY CONFIGURATION
// ============================================
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = NODE_ENV === 'production';

// CORS Configuration - Restrict origins in production
const allowedOrigins = IS_PRODUCTION 
  ? [
      'https://tuapp.com',
      'https://www.tuapp.com',
      // Agrega aquí tus dominios de producción
    ]
  : ['http://localhost:5173', 'http://localhost:3000']; // Development

// ============================================
// LOGGING UTILITIES (Must be defined early)
// ============================================
const log = {
  info: (msg, data = {}) => console.log(`ℹ️  [INFO] ${msg}`, data),
  success: (msg, data = {}) => console.log(`✅ [SUCCESS] ${msg}`, data),
  error: (msg, data = {}) => console.error(`❌ [ERROR] ${msg}`, data),
  warn: (msg, data = {}) => console.warn(`⚠️  [WARN] ${msg}`, data),
  debug: (msg, data = {}) => console.log(`🔍 [DEBUG] ${msg}`, data),
  socket: (msg, data = {}) => console.log(`🔌 [SOCKET] ${msg}`, data),
  api: (method, path, status, data = {}) => console.log(`📡 [API] ${method} ${path} → ${status}`, data)
}

app.use(cors({ 
  origin: IS_PRODUCTION ? allowedOrigins : '*',
  credentials: true 
}));

log.info(`CORS configured for ${NODE_ENV}`, { 
  allowedOrigins: IS_PRODUCTION ? allowedOrigins : 'ALL (*)'
});

app.use(express.json({ limit: '1mb' })); // Limit payload size

// ============================================
// VALIDATION SCHEMAS (Zod)
// ============================================

// Point schema
const PointSchema = z.object({
  x: z.number().int().min(0).max(600),
  y: z.number().int().min(0).max(400)
});

// Blueprint creation schema
const CreateBlueprintSchema = z.object({
  author: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Author must be alphanumeric'),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Name must be alphanumeric'),
  points: z.array(PointSchema).optional().default([])
});

// Blueprint update schema
const UpdateBlueprintSchema = z.object({
  points: z.array(PointSchema).max(1000, 'Maximum 1000 points allowed')
});

// Draw event schema
const DrawEventSchema = z.object({
  author: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  point: PointSchema,
  room: z.string().optional()
});

// Validation middleware factory
const validate = (schema) => (req, res, next) => {
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

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusEmoji = res.statusCode < 400 ? '✅' : '❌';
    log.api(req.method, req.path, `${statusEmoji} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// In-memory storage for blueprints
const blueprints = new Map();

// Helper to get blueprint key
const getBpKey = (author, name) => `${author}:${name}`;

// Initialize with some sample data
blueprints.set(getBpKey('juan', 'plano-1'), {
  author: 'juan',
  name: 'plano-1',
  points: [{ x: 10, y: 10 }, { x: 40, y: 50 }, { x: 100, y: 100 }],
});

log.info('Database initialized', { totalBlueprints: blueprints.size });

// ============================================
// HEALTH CHECK & MONITORING ENDPOINTS
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    },
    database: {
      type: 'in-memory',
      blueprints: blueprints.size,
      authors: new Set([...blueprints.values()].map(bp => bp.author)).size
    }
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const stats = {
    blueprints: {
      total: blueprints.size,
      byAuthor: {}
    },
    points: {
      total: 0,
      average: 0
    }
  };
  
  blueprints.forEach((bp) => {
    // Count by author
    if (!stats.blueprints.byAuthor[bp.author]) {
      stats.blueprints.byAuthor[bp.author] = 0;
    }
    stats.blueprints.byAuthor[bp.author]++;
    
    // Count points
    stats.points.total += bp.points?.length || 0;
  });
  
  stats.points.average = blueprints.size > 0 
    ? Math.round(stats.points.total / blueprints.size * 10) / 10 
    : 0;
  
  res.json(stats);
});

// GET all blueprints by author
app.get('/api/blueprints/:author', (req, res) => {
  const { author } = req.params;
  
  // Validate author parameter
  if (!author || !/^[a-zA-Z0-9_-]+$/.test(author)) {
    log.warn('Invalid author parameter', { author });
    return res.status(400).json({ error: 'Invalid author name' });
  }
  
  const authorBlueprints = [];
  
  blueprints.forEach((bp, key) => {
    if (bp.author === author) {
      authorBlueprints.push(bp);
    }
  });
  
  log.info(`Fetching blueprints for author: ${author}`, { count: authorBlueprints.length });
  res.json(authorBlueprints);
});

// GET specific blueprint
app.get('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  
  // Validate parameters
  if (!author || !/^[a-zA-Z0-9_-]+$/.test(author)) {
    return res.status(400).json({ error: 'Invalid author name' });
  }
  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    return res.status(400).json({ error: 'Invalid blueprint name' });
  }
  
  const key = getBpKey(author, name);
  const bp = blueprints.get(key);
  
  if (bp) {
    log.info(`Blueprint found: ${author}/${name}`, { points: bp.points.length });
    res.json(bp);
  } else {
    log.warn(`Blueprint not found: ${author}/${name}, returning empty`);
    res.json({ author, name, points: [] });
  }
});

// POST - Create new blueprint (WITH VALIDATION)
app.post('/api/blueprints', validate(CreateBlueprintSchema), (req, res) => {
  const { author, name, points } = req.body; // Already validated by middleware
  
  const key = getBpKey(author, name);
  
  if (blueprints.has(key)) {
    log.warn(`Blueprint already exists: ${author}/${name}`);
    return res.status(409).json({ error: 'Blueprint already exists' });
  }
  
  const newBp = { author, name, points };
  blueprints.set(key, newBp);
  
  log.success(`Blueprint created: ${author}/${name}`, { points: points.length });
  
  // Notify all clients about the new blueprint
  io.emit('blueprints-list-update', { author });
  log.socket(`Broadcasted blueprints-list-update for author: ${author}`);
  
  res.status(201).json(newBp);
});

// PUT - Update/Save blueprint (WITH VALIDATION)
app.put('/api/blueprints/:author/:name', validate(UpdateBlueprintSchema), (req, res) => {
  const { author, name } = req.params;
  const { points } = req.body; // Already validated by middleware
  
  // Validate parameters
  if (!author || !/^[a-zA-Z0-9_-]+$/.test(author)) {
    return res.status(400).json({ error: 'Invalid author name' });
  }
  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    return res.status(400).json({ error: 'Invalid blueprint name' });
  }
  
  const key = getBpKey(author, name);
  const bp = { author, name, points };
  blueprints.set(key, bp);
  
  log.success(`Blueprint updated: ${author}/${name}`, { points: points.length });
  
  // Notify all clients in the room
  const room = `blueprints.${author}.${name}`;
  io.to(room).emit('blueprint-update', { author, name, points });
  log.socket(`Broadcasted blueprint-update to room: ${room}`, { points: points.length });
  
  res.json(bp);
});

// DELETE blueprint
app.delete('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  
  // Validate parameters
  if (!author || !/^[a-zA-Z0-9_-]+$/.test(author)) {
    return res.status(400).json({ error: 'Invalid author name' });
  }
  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    return res.status(400).json({ error: 'Invalid blueprint name' });
  }
  
  const key = getBpKey(author, name);
  
  if (!blueprints.has(key)) {
    log.warn(`Blueprint not found for deletion: ${author}/${name}`);
    return res.status(404).json({ error: 'Blueprint not found' });
  }
  
  blueprints.delete(key);
  log.success(`Blueprint deleted: ${author}/${name}`, { remaining: blueprints.size });
  
  // Notify all clients about the deletion
  io.emit('blueprints-list-update', { author });
  log.socket(`Broadcasted blueprints-list-update after deletion for author: ${author}`);
  
  res.status(204).send();
});

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: IS_PRODUCTION ? allowedOrigins : '*',
    credentials: true
  },
  maxHttpBufferSize: 1e6 // 1MB max message size
});

// Track connected clients
let connectedClients = 0;
const clientRooms = new Map(); // socketId -> Set of rooms

io.on('connection', (socket) => {
  connectedClients++;
  clientRooms.set(socket.id, new Set());
  log.socket(`Client connected: ${socket.id}`, { 
    totalClients: connectedClients,
    transport: socket.conn.transport.name
  });
  
  socket.on('join-room', (room) => {
    // Validate room name
    if (typeof room !== 'string' || !/^blueprints\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(room)) {
      log.warn(`Invalid room name: ${room}`);
      socket.emit('error', { message: 'Invalid room name' });
      return;
    }
    
    socket.join(room);
    clientRooms.get(socket.id).add(room);
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    log.socket(`Client ${socket.id} joined room: ${room}`, { roomSize });
  });
  
  socket.on('draw-event', (data) => {
    // Validate draw event data
    try {
      const validated = DrawEventSchema.parse(data);
      const { room, point, author, name } = validated;
      
      const key = getBpKey(author, name);
      const bp = blueprints.get(key) || { author, name, points: [] };
      
      // Prevent too many points
      if (bp.points.length >= 1000) {
        log.warn(`Blueprint ${author}/${name} has reached max points`);
        socket.emit('error', { message: 'Maximum points limit reached' });
        return;
      }
      
      // Add the new point
      bp.points.push(point);
      blueprints.set(key, bp);
      
      log.debug(`Point added to ${author}/${name}`, { 
        point, 
        totalPoints: bp.points.length,
        room 
      });
      
      // Broadcast to all clients in the room (including sender)
      io.to(room).emit('blueprint-update', { author, name, points: bp.points });
      
      const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
      log.socket(`Broadcasted draw-event to room: ${room}`, { 
        recipients: roomSize,
        totalPoints: bp.points.length 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('Invalid draw-event data', { errors: error.errors });
        socket.emit('error', { message: 'Invalid draw event data' });
      } else {
        log.error('Error processing draw-event', error);
      }
    }
  });
  
  socket.on('disconnect', (reason) => {
    connectedClients--;
    const rooms = Array.from(clientRooms.get(socket.id) || []);
    clientRooms.delete(socket.id);
    log.socket(`Client disconnected: ${socket.id}`, { 
      reason,
      rooms,
      totalClients: connectedClients 
    });
  });
  
  socket.on('error', (error) => {
    log.error(`Socket error for ${socket.id}`, { error: error.message });
  });
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  log.success(`🚀 Socket.IO Server running on port ${PORT}`);
  log.info(`🌍 Environment: ${NODE_ENV}`);
  log.info(`🔒 CORS: ${IS_PRODUCTION ? 'RESTRICTED to ' + allowedOrigins.join(', ') : 'OPEN (development)'}`);
  log.info(`📡 REST API available at http://localhost:${PORT}/api`);
  log.info(`🏥 Health check: http://localhost:${PORT}/health`);
  log.info(`📊 Metrics: http://localhost:${PORT}/metrics`);
  log.info(`✅ Payload validation: ENABLED (Zod)`);
  log.info(`💾 Using in-memory storage (${blueprints.size} blueprints loaded)`);
  console.log('='.repeat(60) + '\n');
});
