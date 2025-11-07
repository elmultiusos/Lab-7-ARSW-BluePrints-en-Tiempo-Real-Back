import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { users } from '../models/database.js';
import { config } from '../config/env.js';
import { log } from '../utils/logger.js';

export class AuthService {
  async register(username, password) {
    if (users.has(username)) {
      throw new Error('Username already exists');
    }
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users.set(username, user);
    
    // Generate JWT token
    const token = jwt.sign({ username }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    
    log.success(`User registered: ${username}`, { totalUsers: users.size });
    
    return {
      token,
      user: { username }
    };
  }
  
  async login(username, password) {
    const user = users.get(username);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Compare password with hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign({ username }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    
    log.success(`User logged in: ${username}`);
    
    return {
      token,
      user: { username }
    };
  }
  
  verifyToken(username) {
    return {
      valid: true,
      user: { username }
    };
  }
}
