import { Router } from 'express';
import type { CarUsageController } from './car-usage.controller';

export function createCarUsageRoutes(controller: CarUsageController): Router {
  const router = Router();

  router.post('/', controller.start);
  router.get('/', controller.list);
  router.get('/:id', controller.findById);
  router.patch('/:id/finish', controller.finish);

  return router;
}
