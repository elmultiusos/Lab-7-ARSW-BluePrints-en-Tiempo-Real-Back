import { blueprints } from '../models/database.js';
import { BlueprintService } from '../services/blueprint.service.js';

const blueprintService = new BlueprintService();

export class HealthController {
  getHealth(req, res) {
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
  }
  
  getMetrics(req, res) {
    const stats = blueprintService.getStats();
    res.json(stats);
  }
}
