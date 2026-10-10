import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import type { CarUsageRepository } from '../car-usages/car-usage.repository';
import type { Driver } from './driver.entity';
import type { DriverFilters, DriverRepository } from './driver.repository';
import type { DriverInput } from './driver.schemas';

export class DriverService {
  constructor(
    private readonly driverRepository: DriverRepository,
    private readonly carUsageRepository: CarUsageRepository,
  ) {}

  create(input: DriverInput): Promise<Driver> {
    return this.driverRepository.create(input);
  }

  async update(id: string, input: DriverInput): Promise<Driver> {
    await this.findById(id);
    return this.driverRepository.update(id, input);
  }

  /**
   * Motoristas com registros de utilização não podem ser excluídos, para que o
   * histórico de utilizações continue íntegro (mesmo efeito de uma FK "RESTRICT").
   */
  async delete(id: string): Promise<void> {
    await this.findById(id);

    if (await this.carUsageRepository.existsByDriverId(id)) {
      throw new ConflictError(
        'O motorista possui registros de utilização e não pode ser excluído.',
      );
    }

    await this.driverRepository.delete(id);
  }

  async findById(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findById(id);
    if (!driver) {
      throw new NotFoundError('Motorista não encontrado.');
    }
    return driver;
  }

  list(filters: DriverFilters = {}): Promise<Driver[]> {
    return this.driverRepository.findMany(filters);
  }
}
