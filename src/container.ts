import { CarUsageController } from './modules/car-usages/car-usage.controller';
import { CarUsageService } from './modules/car-usages/car-usage.service';
import { InMemoryCarUsageRepository } from './modules/car-usages/in-memory-car-usage.repository';
import { CarController } from './modules/cars/car.controller';
import { CarService } from './modules/cars/car.service';
import { InMemoryCarRepository } from './modules/cars/in-memory-car.repository';
import { DriverController } from './modules/drivers/driver.controller';
import { DriverService } from './modules/drivers/driver.service';
import { InMemoryDriverRepository } from './modules/drivers/in-memory-driver.repository';

export interface Container {
  carController: CarController;
  driverController: DriverController;
  carUsageController: CarUsageController;
}

/**
 * Composition root: único lugar que conhece as implementações concretas.
 * Para usar um banco de dados, basta trocar os repositórios em memória aqui.
 */
export function createContainer(): Container {
  const carRepository = new InMemoryCarRepository();
  const driverRepository = new InMemoryDriverRepository();
  const carUsageRepository = new InMemoryCarUsageRepository();

  const carService = new CarService(carRepository, carUsageRepository);
  const driverService = new DriverService(driverRepository, carUsageRepository);
  const carUsageService = new CarUsageService(carUsageRepository, carRepository, driverRepository);

  return {
    carController: new CarController(carService),
    driverController: new DriverController(driverService),
    carUsageController: new CarUsageController(carUsageService),
  };
}
