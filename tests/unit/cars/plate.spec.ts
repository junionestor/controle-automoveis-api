import { describe, expect, it } from 'vitest';
import { normalizePlate, PLATE_PATTERN } from '../../../src/modules/cars/plate';

describe('normalizePlate', () => {
  it.each([
    ['abc-1234', 'ABC1234'],
    [' abc 1d23 ', 'ABC1D23'],
    ['ABC1D23', 'ABC1D23'],
  ])('normaliza "%s" para "%s"', (plate, expected) => {
    expect(normalizePlate(plate)).toBe(expected);
  });
});

describe('PLATE_PATTERN', () => {
  it.each(['ABC1234', 'ABC1D23'])('aceita a placa válida %s', (plate) => {
    expect(PLATE_PATTERN.test(plate)).toBe(true);
  });

  it.each(['AB1234', 'ABCD123', 'ABC12345', '1BC1234', 'ABC12D3', ''])(
    'rejeita a placa inválida "%s"',
    (plate) => {
      expect(PLATE_PATTERN.test(plate)).toBe(false);
    },
  );
});
