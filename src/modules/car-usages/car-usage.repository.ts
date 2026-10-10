import type { Repository } from '../../shared/repositories/repository';
import type { CarUsage } from './car-usage.entity';

export interface CarUsageRepository extends Repository<CarUsage> {
  /** Lista as utilizações da mais recente para a mais antiga (pela data de início). */
  findAll(): Promise<CarUsage[]>;
  existsByCarId(carId: string): Promise<boolean>;
  existsByDriverId(driverId: string): Promise<boolean>;
  /** Utilização do automóvel que se sobrepõe a uma nova utilização iniciada em `startDate`. */
  findOverlappingByCarId(carId: string, startDate: Date): Promise<CarUsage | null>;
  /** Utilização do motorista que se sobrepõe a uma nova utilização iniciada em `startDate`. */
  findOverlappingByDriverId(driverId: string, startDate: Date): Promise<CarUsage | null>;
}
