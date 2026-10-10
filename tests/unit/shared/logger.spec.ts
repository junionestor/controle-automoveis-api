import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../../../src/shared/logger';

const env = vi.hoisted(() => ({ NODE_ENV: 'production' }));
vi.mock('../../../src/config/env', () => ({ env }));

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    env.NODE_ENV = 'production';
  });

  it('escreve uma linha JSON com timestamp, nível, mensagem e contexto', () => {
    vi.useFakeTimers({ now: new Date('2024-05-10T11:30:00.000Z') });
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.info('Requisição concluída', { requestId: 'req-1', statusCode: 200 });

    expect(JSON.parse(consoleLog.mock.calls[0]?.[0])).toEqual({
      timestamp: '2024-05-10T11:30:00.000Z',
      level: 'info',
      message: 'Requisição concluída',
      requestId: 'req-1',
      statusCode: 200,
    });
  });

  it('escreve os erros na saída de erro', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('Erro inesperado');

    expect(JSON.parse(consoleError.mock.calls[0]?.[0])).toMatchObject({
      level: 'error',
      message: 'Erro inesperado',
    });
  });

  it('fica silenciado durante os testes', () => {
    env.NODE_ENV = 'test';
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.info('Requisição concluída');

    expect(consoleLog).not.toHaveBeenCalled();
  });
});
