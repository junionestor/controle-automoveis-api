import type { Entity } from '../../shared/domain/entity';
import type { Car } from '../cars/car.entity';
import type { Driver } from '../drivers/driver.entity';

export interface CarUsage extends Entity {
  carId: string;
  driverId: string;
  reason: string;
  startDate: Date;
  /** `null` enquanto a utilização estiver em andamento. */
  endDate: Date | null;
}

/** Utilização com os dados do motorista e do automóvel: formato devolvido pela API. */
export interface CarUsageDetails extends Omit<CarUsage, 'carId' | 'driverId'> {
  driver: Pick<Driver, 'id' | 'name'>;
  car: Pick<Car, 'id' | 'plate' | 'color' | 'brand'>;
}
