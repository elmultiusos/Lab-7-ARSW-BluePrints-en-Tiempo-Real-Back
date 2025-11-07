import { AuthService } from '../services/auth.service.js';
import { log } from '../utils/logger.js';

const authService = new AuthService();

export class AuthController {
  async register(req, res) {
    const { username, password } = req.body;
    
    try {
      const result = await authService.register(username, password);
      res.status(201).json({
        message: 'User registered successfully',
        ...result
      });
    } catch (error) {
      if (error.message === 'Username already exists') {
        log.warn(`Registration failed: username '${username}' already exists`);
        return res.status(409).json({ error: error.message });
      }
      log.error('Registration error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  async login(req, res) {
    const { username, password } = req.body;
    
    try {
      const result = await authService.login(username, password);
      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        log.warn(`Login failed: ${error.message} for user '${username}'`);
        return res.status(401).json({ error: error.message });
      }
      log.error('Login error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  verify(req, res) {
    res.json(authService.verifyToken(req.user.username));
  }
}
