import { z } from 'zod';
import { BlueprintService } from '../services/blueprint.service.js';
import { DrawEventSchema } from '../models/schemas.js';
import { log } from '../utils/logger.js';
import { authenticateSocket } from '../middleware/auth.js';
import { config } from '../config/env.js';

const blueprintService = new BlueprintService();

// Track connected clients
let connectedClients = 0;
const clientRooms = new Map(); // socketId -> Set of rooms

export const setupSocketIO = (io) => {
  // Middleware to authenticate WebSocket connections
  io.use(authenticateSocket(config.JWT_SECRET));
  
  io.on('connection', (socket) => {
    connectedClients++;
    clientRooms.set(socket.id, new Set());
    log.socket(`Client connected: ${socket.id} (user: ${socket.user.username})`, { 
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
      
      // Extract author from room name: blueprints.author.name
      const roomParts = room.split('.');
      const author = roomParts[1];
      
      // Authorization: User can only join rooms for their own blueprints
      if (author !== socket.user.username) {
        log.warn(`User ${socket.user.username} tried to join room for ${author}`);
        socket.emit('error', { message: 'You can only join rooms for your own blueprints' });
        return;
      }
      
      socket.join(room);
      clientRooms.get(socket.id).add(room);
      const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
      log.socket(`Client ${socket.id} (${socket.user.username}) joined room: ${room}`, { roomSize });
    });
    
    socket.on('draw-event', (data) => {
      // Validate draw event data
      try {
        const validated = DrawEventSchema.parse(data);
        const { room, point, author, name } = validated;
        
        // Authorization: User can only draw on their own blueprints
        if (author !== socket.user.username) {
          log.warn(`User ${socket.user.username} tried to draw on ${author}/${name}`);
          socket.emit('error', { message: 'You can only draw on your own blueprints' });
          return;
        }
        
        // Add point to blueprint
        const bp = blueprintService.addPoint(author, name, point);
        
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
        } else if (error.message === 'Maximum points limit reached') {
          log.warn(error.message);
          socket.emit('error', { message: error.message });
        } else {
          log.error('Error processing draw-event', error);
        }
      }
    });
    
    socket.on('disconnect', (reason) => {
      connectedClients--;
      const rooms = Array.from(clientRooms.get(socket.id) || []);
      clientRooms.delete(socket.id);
      log.socket(`Client disconnected: ${socket.id} (${socket.user.username})`, { 
        reason,
        rooms,
        totalClients: connectedClients 
      });
    });
    
    socket.on('error', (error) => {
      log.error(`Socket error for ${socket.id} (${socket.user.username})`, { error: error.message });
    });
  });
  
  return io;
};
