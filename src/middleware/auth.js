import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { log } from '../utils/logger.js';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    log.warn('Missing JWT token', { path: req.path });
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      log.warn('Invalid JWT token', { error: err.message });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user; // { username, iat, exp }
    log.debug(`User authenticated: ${user.username}`);
    next();
  });
};

// Middleware to check if user is the author of a blueprint
export const authorizeOwner = (req, res, next) => {
  const { author } = req.params;
  const username = req.user.username;
  
  if (author !== username) {
    log.warn(`Authorization failed: ${username} tried to access ${author}'s blueprint`);
    return res.status(403).json({ 
      error: 'Forbidden: You can only access your own blueprints' 
    });
  }
  
  next();
};

// WebSocket authentication middleware
export const authenticateSocket = (JWT_SECRET) => (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    log.warn('WebSocket connection rejected: No token provided');
    return next(new Error('Authentication required'));
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      log.warn('WebSocket connection rejected: Invalid token', { error: err.message });
      return next(new Error('Invalid or expired token'));
    }
    
    socket.user = decoded; // Attach user info to socket
    log.debug(`WebSocket authenticated for user: ${decoded.username}`);
    next();
  });
};
