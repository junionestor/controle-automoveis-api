import { describe, expect, it } from 'vitest';
import {
  equalsIgnoringCaseAndAccents,
  includesIgnoringCaseAndAccents,
  normalizeText,
} from '../../../src/shared/utils/text';

describe('normalizeText', () => {
  it('remove acentos, espaços nas extremidades e converte para minúsculas', () => {
    expect(normalizeText('  São JOÃO Ação ')).toBe('sao joao acao');
  });
});

describe('equalsIgnoringCaseAndAccents', () => {
  it('considera iguais textos que diferem apenas em caixa e acentuação', () => {
    expect(equalsIgnoringCaseAndAccents('Verde-Limão', 'verde-limao')).toBe(true);
  });

  it('não considera iguais textos diferentes', () => {
    expect(equalsIgnoringCaseAndAccents('Prata', 'Preto')).toBe(false);
  });
});

describe('includesIgnoringCaseAndAccents', () => {
  it('encontra trechos ignorando caixa e acentuação', () => {
    expect(includesIgnoringCaseAndAccents('José Antônio', 'antonio')).toBe(true);
  });

  it('retorna falso quando o trecho não existe', () => {
    expect(includesIgnoringCaseAndAccents('José Antônio', 'maria')).toBe(false);
  });
});
