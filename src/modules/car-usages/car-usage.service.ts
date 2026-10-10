import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/app-error';
import type { Car } from '../cars/car.entity';
import type { CarRepository } from '../cars/car.repository';
import type { Driver } from '../drivers/driver.entity';
import type { DriverRepository } from '../drivers/driver.repository';
import type { CarUsage, CarUsageDetails } from './car-usage.entity';
import { toCarUsageDetails } from './car-usage.mapper';
import type { CarUsageRepository } from './car-usage.repository';
import type { FinishCarUsageInput, StartCarUsageInput } from './car-usage.schemas';

/**
 * Automóveis e motoristas com utilizações não podem ser excluídos, então uma
 * referência ausente indica dados inconsistentes (erro inesperado, HTTP 500).
 */
function ensureReferenceExists<T>(entity: T | null | undefined, description: string): T {
  if (!entity) {
    throw new Error(`Referência inexistente: ${description}.`);
  }
  return entity;
}

export class CarUsageService {
  constructor(
    private readonly carUsageRepository: CarUsageRepository,
    private readonly carRepository: CarRepository,
    private readonly driverRepository: DriverRepository,
  ) {}

  /**
   * Registra a utilização de um automóvel por um motorista. Regras de negócio:
   * - um automóvel só pode ser utilizado por um motorista por vez;
   * - um motorista não pode utilizar mais de um automóvel ao mesmo tempo.
   *
   * Com um banco de dados real, verificação e inserção deveriam ocorrer em uma
   * transação (ou ser garantidas por constraint) para evitar condições de corrida.
   * Na persistência em memória não há I/O entre as etapas, então nenhuma outra
   * requisição é processada no meio deste método.
   */
  async start(input: StartCarUsageInput): Promise<CarUsageDetails> {
    const startDate = input.startDate ?? new Date();
    const car = await this.findCar(input.carId);
    const driver = await this.findDriver(input.driverId);

    if (await this.carUsageRepository.findOverlappingByCarId(car.id, startDate)) {
      throw new ConflictError(
        `O automóvel ${car.plate} já está em utilização por um motorista no período informado.`,
      );
    }

    if (await this.carUsageRepository.findOverlappingByDriverId(driver.id, startDate)) {
      throw new ConflictError(
        `O motorista ${driver.name} já está utilizando um automóvel no período informado.`,
      );
    }

    const usage = await this.carUsageRepository.create({
      carId: car.id,
      driverId: driver.id,
      reason: input.reason,
      startDate,
      endDate: null,
    });

    return toCarUsageDetails(usage, car, driver);
  }

  /** Finaliza uma utilização em andamento, liberando o automóvel e o motorista. */
  async finish(id: string, input: FinishCarUsageInput): Promise<CarUsageDetails> {
    const usage = await this.findUsage(id);

    if (usage.endDate !== null) {
      throw new ConflictError('Esta utilização já foi finalizada.');
    }

    const endDate = input.endDate ?? new Date();
    if (endDate < usage.startDate) {
      throw new ValidationError(
        'A data de término não pode ser anterior à data de início da utilização.',
      );
    }

    const finishedUsage = await this.carUsageRepository.update(id, { endDate });
    return this.loadDetails(finishedUsage);
  }

  async findById(id: string): Promise<CarUsageDetails> {
    return this.loadDetails(await this.findUsage(id));
  }

  /** Lista as utilizações com o nome do motorista e os dados do automóvel. */
  async list(): Promise<CarUsageDetails[]> {
    const usages = await this.carUsageRepository.findAll();

    // Busca todos os automóveis e motoristas de uma vez, evitando uma consulta por utilização (N+1).
    const [cars, drivers] = await Promise.all([
      this.carRepository.findByIds(usages.map((usage) => usage.carId)),
      this.driverRepository.findByIds(usages.map((usage) => usage.driverId)),
    ]);
    const carsById = new Map(cars.map((car) => [car.id, car]));
    const driversById = new Map(drivers.map((driver) => [driver.id, driver]));

    return usages.map((usage) =>
      toCarUsageDetails(
        usage,
        ensureReferenceExists(carsById.get(usage.carId), `automóvel ${usage.carId}`),
        ensureReferenceExists(driversById.get(usage.driverId), `motorista ${usage.driverId}`),
      ),
    );
  }

  private async loadDetails(usage: CarUsage): Promise<CarUsageDetails> {
    const [car, driver] = await Promise.all([
      this.carRepository.findById(usage.carId),
      this.driverRepository.findById(usage.driverId),
    ]);

    return toCarUsageDetails(
      usage,
      ensureReferenceExists(car, `automóvel ${usage.carId}`),
      ensureReferenceExists(driver, `motorista ${usage.driverId}`),
    );
  }

  private async findUsage(id: string): Promise<CarUsage> {
    const usage = await this.carUsageRepository.findById(id);
    if (!usage) {
      throw new NotFoundError('Utilização não encontrada.');
    }
    return usage;
  }

  private async findCar(id: string): Promise<Car> {
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new NotFoundError('Automóvel não encontrado.');
    }
    return car;
  }

  private async findDriver(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findById(id);
    if (!driver) {
      throw new NotFoundError('Motorista não encontrado.');
    }
    return driver;
  }
}
