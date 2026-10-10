import { InMemoryRepository } from '../../shared/repositories/in-memory.repository';
import { includesIgnoringCaseAndAccents } from '../../shared/utils/text';
import type { Driver } from './driver.entity';
import type { DriverFilters, DriverRepository } from './driver.repository';

export class InMemoryDriverRepository
  extends InMemoryRepository<Driver>
  implements DriverRepository
{
  findMany({ name }: DriverFilters = {}): Promise<Driver[]> {
    return this.findWhere(
      (driver) => name === undefined || includesIgnoringCaseAndAccents(driver.name, name),
    );
  }
}
