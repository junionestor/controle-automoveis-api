import type { Car } from '../cars/car.entity';
import type { Driver } from '../drivers/driver.entity';
import type { CarUsage, CarUsageDetails } from './car-usage.entity';

export function toCarUsageDetails(usage: CarUsage, car: Car, driver: Driver): CarUsageDetails {
  return {
    id: usage.id,
    startDate: usage.startDate,
    endDate: usage.endDate,
    reason: usage.reason,
    driver: { id: driver.id, name: driver.name },
    car: { id: car.id, plate: car.plate, color: car.color, brand: car.brand },
    createdAt: usage.createdAt,
    updatedAt: usage.updatedAt,
  };
}
