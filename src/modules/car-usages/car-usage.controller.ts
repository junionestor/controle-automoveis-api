import type { Request, Response } from 'express';
import type { IdParams } from '../../shared/http/types';
import { finishCarUsageSchema, startCarUsageSchema } from './car-usage.schemas';
import type { CarUsageService } from './car-usage.service';

export class CarUsageController {
  constructor(private readonly carUsageService: CarUsageService) {}

  start = async (req: Request, res: Response): Promise<void> => {
    const input = startCarUsageSchema.parse(req.body);
    const usage = await this.carUsageService.start(input);
    res.status(201).location(`/car-usages/${usage.id}`).json(usage);
  };

  finish = async (req: Request<IdParams>, res: Response): Promise<void> => {
    // O corpo é opcional: sem ele, a utilização é finalizada com a data/hora atual.
    const input = finishCarUsageSchema.parse(req.body ?? {});
    res.json(await this.carUsageService.finish(req.params.id, input));
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.carUsageService.list());
  };

  findById = async (req: Request<IdParams>, res: Response): Promise<void> => {
    res.json(await this.carUsageService.findById(req.params.id));
  };
}
