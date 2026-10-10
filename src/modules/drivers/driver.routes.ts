import { Router } from 'express';
import type { DriverController } from './driver.controller';

export function createDriverRoutes(controller: DriverController): Router {
  const router = Router();

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.findById);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
