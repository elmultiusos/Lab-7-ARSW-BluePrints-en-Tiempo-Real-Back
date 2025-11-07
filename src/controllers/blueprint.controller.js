import { BlueprintService } from '../services/blueprint.service.js';
import { log } from '../utils/logger.js';

const blueprintService = new BlueprintService();

export class BlueprintController {
  getAllByAuthor(req, res) {
    const { author } = req.params;
    
    // Validate author parameter
    if (!author || !/^[a-zA-Z0-9_-]+$/.test(author)) {
      log.warn('Invalid author parameter', { author });
      return res.status(400).json({ error: 'Invalid author name' });
    }
    
    const blueprints = blueprintService.getAllByAuthor(author);
    res.json(blueprints);
  }
  
  getByAuthorAndName(req, res) {
    const { author, name } = req.params;
    
    // Validate parameters
    if (!author || !/^[a-zA-Z0-9_-]+$/.test(author)) {
      return res.status(400).json({ error: 'Invalid author name' });
    }
    if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
      return res.status(400).json({ error: 'Invalid blueprint name' });
    }
    
    const blueprint = blueprintService.getByAuthorAndName(author, name);
    res.json(blueprint);
  }
  
  create(req, res, io) {
    const { author, name, points } = req.body;
    const username = req.user.username;
    
    // Verify the author matches the authenticated user
    if (author !== username) {
      log.warn(`User ${username} tried to create blueprint for ${author}`);
      return res.status(403).json({ error: 'You can only create blueprints for yourself' });
    }
    
    try {
      const newBp = blueprintService.create(author, name, points);
      
      // Notify all clients about the new blueprint
      io.emit('blueprints-list-update', { author });
      log.socket(`Broadcasted blueprints-list-update for author: ${author}`);
      
      res.status(201).json(newBp);
    } catch (error) {
      if (error.message === 'Blueprint already exists') {
        log.warn(`Blueprint already exists: ${author}/${name}`);
        return res.status(409).json({ error: error.message });
      }
      log.error('Error creating blueprint', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  update(req, res, io) {
    const { author, name } = req.params;
    const { points } = req.body;
    
    // Validate parameters
    if (!author || !/^[a-zA-Z0-9_-]+$/.test(author)) {
      return res.status(400).json({ error: 'Invalid author name' });
    }
    if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
      return res.status(400).json({ error: 'Invalid blueprint name' });
    }
    
    const bp = blueprintService.update(author, name, points);
    
    // Notify all clients in the room
    const room = `blueprints.${author}.${name}`;
    io.to(room).emit('blueprint-update', { author, name, points });
    log.socket(`Broadcasted blueprint-update to room: ${room}`, { points: points.length });
    
    res.json(bp);
  }
  
  delete(req, res, io) {
    const { author, name } = req.params;
    
    // Validate parameters
    if (!author || !/^[a-zA-Z0-9_-]+$/.test(author)) {
      return res.status(400).json({ error: 'Invalid author name' });
    }
    if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
      return res.status(400).json({ error: 'Invalid blueprint name' });
    }
    
    try {
      blueprintService.delete(author, name);
      
      // Notify all clients about the deletion
      io.emit('blueprints-list-update', { author });
      log.socket(`Broadcasted blueprints-list-update after deletion for author: ${author}`);
      
      res.status(204).send();
    } catch (error) {
      if (error.message === 'Blueprint not found') {
        log.warn(`Blueprint not found for deletion: ${author}/${name}`);
        return res.status(404).json({ error: error.message });
      }
      log.error('Error deleting blueprint', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
