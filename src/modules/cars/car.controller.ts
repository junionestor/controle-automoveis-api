import type { Request, Response } from 'express';
import type { IdParams } from '../../shared/http/types';
import { carBodySchema, listCarsQuerySchema } from './car.schemas';
import type { CarService } from './car.service';

export class CarController {
  constructor(private readonly carService: CarService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = carBodySchema.parse(req.body);
    const car = await this.carService.create(input);
    res.status(201).location(`/cars/${car.id}`).json(car);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const filters = listCarsQuerySchema.parse(req.query);
    res.json(await this.carService.list(filters));
  };

  findById = async (req: Request<IdParams>, res: Response): Promise<void> => {
    res.json(await this.carService.findById(req.params.id));
  };

  update = async (req: Request<IdParams>, res: Response): Promise<void> => {
    const input = carBodySchema.parse(req.body);
    res.json(await this.carService.update(req.params.id, input));
  };

  delete = async (req: Request<IdParams>, res: Response): Promise<void> => {
    await this.carService.delete(req.params.id);
    res.status(204).send();
  };
}
