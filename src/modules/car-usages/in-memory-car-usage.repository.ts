import { InMemoryRepository } from '../../shared/repositories/in-memory.repository';
import type { CarUsage } from './car-usage.entity';
import type { CarUsageRepository } from './car-usage.repository';

/**
 * Uma nova utilização começa em `startDate` e ainda não tem término, ou seja,
 * ocupa o intervalo [startDate, ∞). Ela se sobrepõe a uma utilização existente
 * se esta ainda estiver em aberto ou só terminar depois de `startDate`.
 *
 * Isso bloqueia tanto o uso simultâneo "agora" quanto registros retroativos que
 * cairiam no meio de uma utilização já finalizada.
 */
function overlapsNewUsageStartingAt(usage: CarUsage, startDate: Date): boolean {
  return usage.endDate === null || usage.endDate > startDate;
}

export class InMemoryCarUsageRepository
  extends InMemoryRepository<CarUsage>
  implements CarUsageRepository
{
  async findAll(): Promise<CarUsage[]> {
    const usages = await this.findWhere(() => true);
    return usages.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  existsByCarId(carId: string): Promise<boolean> {
    return this.existsWhere((usage) => usage.carId === carId);
  }

  existsByDriverId(driverId: string): Promise<boolean> {
    return this.existsWhere((usage) => usage.driverId === driverId);
  }

  findOverlappingByCarId(carId: string, startDate: Date): Promise<CarUsage | null> {
    return this.findFirstWhere(
      (usage) => usage.carId === carId && overlapsNewUsageStartingAt(usage, startDate),
    );
  }

  findOverlappingByDriverId(driverId: string, startDate: Date): Promise<CarUsage | null> {
    return this.findFirstWhere(
      (usage) => usage.driverId === driverId && overlapsNewUsageStartingAt(usage, startDate),
    );
  }
}
