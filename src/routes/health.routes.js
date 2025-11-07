import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';

const router = Router();
const healthController = new HealthController();

// Health check endpoint
router.get('/health', (req, res) => 
  healthController.getHealth(req, res)
);

// Metrics endpoint
router.get('/metrics', (req, res) => 
  healthController.getMetrics(req, res)
);

export default router;
