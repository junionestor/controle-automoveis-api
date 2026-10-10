import type { Request, Response } from 'express';
import type { IdParams } from '../../shared/http/types';
import { driverBodySchema, listDriversQuerySchema } from './driver.schemas';
import type { DriverService } from './driver.service';

export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = driverBodySchema.parse(req.body);
    const driver = await this.driverService.create(input);
    res.status(201).location(`/drivers/${driver.id}`).json(driver);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const filters = listDriversQuerySchema.parse(req.query);
    res.json(await this.driverService.list(filters));
  };

  findById = async (req: Request<IdParams>, res: Response): Promise<void> => {
    res.json(await this.driverService.findById(req.params.id));
  };

  update = async (req: Request<IdParams>, res: Response): Promise<void> => {
    const input = driverBodySchema.parse(req.body);
    res.json(await this.driverService.update(req.params.id, input));
  };

  delete = async (req: Request<IdParams>, res: Response): Promise<void> => {
    await this.driverService.delete(req.params.id);
    res.status(204).send();
  };
}
