import { describe, expect, it } from 'vitest';
import { carBodySchema, listCarsQuerySchema } from '../../../src/modules/cars/car.schemas';

describe('carBodySchema', () => {
  it('normaliza a placa e remove espaços dos textos', () => {
    const result = carBodySchema.parse({ plate: 'abc-1d23', color: ' Prata ', brand: ' Fiat ' });

    expect(result).toEqual({ plate: 'ABC1D23', color: 'Prata', brand: 'Fiat' });
  });

  it('rejeita placa em formato inválido', () => {
    const result = carBodySchema.safeParse({ plate: 'AB-123', color: 'Prata', brand: 'Fiat' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['plate']);
  });

  it('exige todos os campos', () => {
    const result = carBodySchema.safeParse({});

    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['plate', 'color', 'brand']);
  });
});

describe('listCarsQuerySchema', () => {
  it('ignora filtros vazios', () => {
    expect(listCarsQuerySchema.parse({ color: '', brand: ' ' })).toEqual({
      color: undefined,
      brand: undefined,
    });
  });

  it('rejeita filtros informados mais de uma vez', () => {
    expect(listCarsQuerySchema.safeParse({ color: ['Prata', 'Preto'] }).success).toBe(false);
  });
});
