import { InMemoryRepository } from '../../shared/repositories/in-memory.repository';
import { equalsIgnoringCaseAndAccents } from '../../shared/utils/text';
import type { Car } from './car.entity';
import type { CarFilters, CarRepository } from './car.repository';

export class InMemoryCarRepository extends InMemoryRepository<Car> implements CarRepository {
  findMany({ color, brand }: CarFilters = {}): Promise<Car[]> {
    return this.findWhere(
      (car) =>
        (color === undefined || equalsIgnoringCaseAndAccents(car.color, color)) &&
        (brand === undefined || equalsIgnoringCaseAndAccents(car.brand, brand)),
    );
  }

  findByPlate(plate: string): Promise<Car | null> {
    return this.findFirstWhere((car) => car.plate === plate);
  }
}
