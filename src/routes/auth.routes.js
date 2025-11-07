import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { RegisterSchema, LoginSchema } from '../models/schemas.js';

const router = Router();
const authController = new AuthController();

// Register new user
router.post('/register', validate(RegisterSchema), (req, res) => 
  authController.register(req, res)
);

// Login user
router.post('/login', validate(LoginSchema), (req, res) => 
  authController.login(req, res)
);

// Verify token
router.get('/verify', authenticateToken, (req, res) => 
  authController.verify(req, res)
);

export default router;
