import { z } from 'zod';
import { optionalQueryFilter, requiredText } from '../../shared/validation/fields';

/** Corpo usado tanto no cadastro quanto na atualização (PUT substitui todos os campos). */
export const driverBodySchema = z.object({
  name: requiredText('name', 100),
});

export const listDriversQuerySchema = z.object({
  name: optionalQueryFilter('name'),
});

export type DriverInput = z.infer<typeof driverBodySchema>;
