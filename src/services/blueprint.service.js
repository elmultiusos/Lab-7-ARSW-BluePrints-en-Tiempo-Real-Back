import { blueprints, getBpKey } from '../models/database.js';
import { log } from '../utils/logger.js';

export class BlueprintService {
  getAllByAuthor(author) {
    const authorBlueprints = [];
    
    blueprints.forEach((bp) => {
      if (bp.author === author) {
        authorBlueprints.push(bp);
      }
    });
    
    log.info(`Fetching blueprints for author: ${author}`, { count: authorBlueprints.length });
    return authorBlueprints;
  }
  
  getByAuthorAndName(author, name) {
    const key = getBpKey(author, name);
    const bp = blueprints.get(key);
    
    if (bp) {
      log.info(`Blueprint found: ${author}/${name}`, { points: bp.points.length });
      return bp;
    } else {
      log.warn(`Blueprint not found: ${author}/${name}, returning empty`);
      return { author, name, points: [] };
    }
  }
  
  create(author, name, points = []) {
    const key = getBpKey(author, name);
    
    if (blueprints.has(key)) {
      throw new Error('Blueprint already exists');
    }
    
    const newBp = { author, name, points };
    blueprints.set(key, newBp);
    
    log.success(`Blueprint created: ${author}/${name}`, { points: points.length });
    return newBp;
  }
  
  update(author, name, points) {
    const key = getBpKey(author, name);
    const bp = { author, name, points };
    blueprints.set(key, bp);
    
    log.success(`Blueprint updated: ${author}/${name}`, { points: points.length });
    return bp;
  }
  
  delete(author, name) {
    const key = getBpKey(author, name);
    
    if (!blueprints.has(key)) {
      throw new Error('Blueprint not found');
    }
    
    blueprints.delete(key);
    log.success(`Blueprint deleted: ${author}/${name}`, { remaining: blueprints.size });
    return true;
  }
  
  addPoint(author, name, point) {
    const key = getBpKey(author, name);
    const bp = blueprints.get(key) || { author, name, points: [] };
    
    // Prevent too many points
    if (bp.points.length >= 1000) {
      throw new Error('Maximum points limit reached');
    }
    
    bp.points.push(point);
    blueprints.set(key, bp);
    
    log.debug(`Point added to ${author}/${name}`, { 
      point, 
      totalPoints: bp.points.length
    });
    
    return bp;
  }
  
  getStats() {
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
    
    return stats;
  }
}
