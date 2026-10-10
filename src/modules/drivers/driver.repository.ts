import type { Repository } from '../../shared/repositories/repository';
import type { Driver } from './driver.entity';

export interface DriverFilters {
  /** Busca parcial pelo nome, ignorando maiúsculas/minúsculas e acentos. */
  name?: string | undefined;
}

export interface DriverRepository extends Repository<Driver> {
  findMany(filters?: DriverFilters): Promise<Driver[]>;
}
