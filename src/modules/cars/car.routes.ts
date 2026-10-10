import { Router } from 'express';
import type { CarController } from './car.controller';

export function createCarRoutes(controller: CarController): Router {
  const router = Router();

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.findById);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
