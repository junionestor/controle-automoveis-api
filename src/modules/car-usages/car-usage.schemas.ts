import { z } from 'zod';
import { isoDateTime, requiredText, uuid } from '../../shared/validation/fields';

export const startCarUsageSchema = z.object({
  carId: uuid('carId'),
  driverId: uuid('driverId'),
  reason: requiredText('reason', 500),
  /** Opcional: quando omitida, a utilização começa no momento da requisição. */
  startDate: isoDateTime('startDate').optional(),
});

export const finishCarUsageSchema = z.object({
  /** Opcional: quando omitida, a utilização termina no momento da requisição. */
  endDate: isoDateTime('endDate').optional(),
});

export type StartCarUsageInput = z.infer<typeof startCarUsageSchema>;
export type FinishCarUsageInput = z.infer<typeof finishCarUsageSchema>;
