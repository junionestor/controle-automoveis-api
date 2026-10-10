import type { Repository } from '../../shared/repositories/repository';
import type { Car } from './car.entity';

export interface CarFilters {
  color?: string | undefined;
  brand?: string | undefined;
}

export interface CarRepository extends Repository<Car> {
  /** Lista os automóveis; os filtros ignoram maiúsculas/minúsculas e acentos. */
  findMany(filters?: CarFilters): Promise<Car[]>;
  findByPlate(plate: string): Promise<Car | null>;
}
