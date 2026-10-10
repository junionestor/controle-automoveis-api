import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import type { CarUsageRepository } from '../car-usages/car-usage.repository';
import type { Car } from './car.entity';
import type { CarFilters, CarRepository } from './car.repository';
import type { CarInput } from './car.schemas';

export class CarService {
  constructor(
    private readonly carRepository: CarRepository,
    private readonly carUsageRepository: CarUsageRepository,
  ) {}

  async create(input: CarInput): Promise<Car> {
    await this.ensurePlateIsAvailable(input.plate);
    return this.carRepository.create(input);
  }

  async update(id: string, input: CarInput): Promise<Car> {
    await this.findById(id);
    await this.ensurePlateIsAvailable(input.plate, id);
    return this.carRepository.update(id, input);
  }

  /**
   * Automóveis com registros de utilização não podem ser excluídos, para que o
   * histórico de utilizações continue íntegro (mesmo efeito de uma FK "RESTRICT").
   */
  async delete(id: string): Promise<void> {
    await this.findById(id);

    if (await this.carUsageRepository.existsByCarId(id)) {
      throw new ConflictError(
        'O automóvel possui registros de utilização e não pode ser excluído.',
      );
    }

    await this.carRepository.delete(id);
  }

  async findById(id: string): Promise<Car> {
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new NotFoundError('Automóvel não encontrado.');
    }
    return car;
  }

  list(filters: CarFilters = {}): Promise<Car[]> {
    return this.carRepository.findMany(filters);
  }

  /** Garante que a placa não pertence a outro automóvel (o próprio carro é ignorado em atualizações). */
  private async ensurePlateIsAvailable(plate: string, currentCarId?: string): Promise<void> {
    const carWithSamePlate = await this.carRepository.findByPlate(plate);

    if (carWithSamePlate && carWithSamePlate.id !== currentCarId) {
      throw new ConflictError(`Já existe um automóvel cadastrado com a placa ${plate}.`);
    }
  }
}
