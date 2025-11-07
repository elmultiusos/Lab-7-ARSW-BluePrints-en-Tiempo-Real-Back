import { Router } from 'express';
import { BlueprintController } from '../controllers/blueprint.controller.js';
import { validate } from '../middleware/validation.js';
import { authenticateToken, authorizeOwner } from '../middleware/auth.js';
import { CreateBlueprintSchema, UpdateBlueprintSchema } from '../models/schemas.js';

export const createBlueprintRoutes = (io) => {
  const router = Router();
  const blueprintController = new BlueprintController();
  
  // GET all blueprints by author (PROTECTED - only own blueprints)
  router.get('/:author', authenticateToken, authorizeOwner, (req, res) =>
    blueprintController.getAllByAuthor(req, res)
  );
  
  // GET specific blueprint (PROTECTED - only own blueprints)
  router.get('/:author/:name', authenticateToken, authorizeOwner, (req, res) =>
    blueprintController.getByAuthorAndName(req, res)
  );
  
  // POST - Create new blueprint (PROTECTED - only own blueprints)
  router.post('/', authenticateToken, validate(CreateBlueprintSchema), (req, res) =>
    blueprintController.create(req, res, io)
  );
  
  // PUT - Update/Save blueprint (PROTECTED - only own blueprints)
  router.put('/:author/:name', authenticateToken, authorizeOwner, validate(UpdateBlueprintSchema), (req, res) =>
    blueprintController.update(req, res, io)
  );
  
  // DELETE blueprint (PROTECTED - only own blueprints)
  router.delete('/:author/:name', authenticateToken, authorizeOwner, (req, res) =>
    blueprintController.delete(req, res, io)
  );
  
  return router;
};
