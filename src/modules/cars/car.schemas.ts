import { z } from 'zod';
import { optionalQueryFilter, requiredText } from '../../shared/validation/fields';
import { normalizePlate, PLATE_PATTERN } from './plate';

const plate = z
  .string({ error: 'O campo "plate" é obrigatório e deve ser um texto.' })
  .transform(normalizePlate)
  .pipe(
    z
      .string()
      .regex(
        PLATE_PATTERN,
        'O campo "plate" deve ser uma placa válida no padrão antigo (ABC-1234) ou Mercosul (ABC1D23).',
      ),
  );

/** Corpo usado tanto no cadastro quanto na atualização (PUT substitui todos os campos). */
export const carBodySchema = z.object({
  plate,
  color: requiredText('color', 30),
  brand: requiredText('brand', 50),
});

export const listCarsQuerySchema = z.object({
  color: optionalQueryFilter('color'),
  brand: optionalQueryFilter('brand'),
});

export type CarInput = z.infer<typeof carBodySchema>;
