import type { CarInput } from '../../src/modules/cars/car.schemas';
import type { DriverInput } from '../../src/modules/drivers/driver.schemas';

export function carInput(overrides: Partial<CarInput> = {}): CarInput {
  return { plate: 'ABC1D23', color: 'Prata', brand: 'Fiat', ...overrides };
}

export function driverInput(overrides: Partial<DriverInput> = {}): DriverInput {
  return { name: 'João da Silva', ...overrides };
}
