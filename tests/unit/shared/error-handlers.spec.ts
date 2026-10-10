import type { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ConflictError, NotFoundError } from '../../../src/shared/errors/app-error';
import { errorHandler } from '../../../src/shared/http/error-handlers';
import { logger } from '../../../src/shared/logger';

const req = { id: 'req-123', method: 'POST', path: '/cars', originalUrl: '/cars' };

function handle(error: unknown) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  errorHandler(error, req as Request, res as unknown as Response, vi.fn() as NextFunction);
  return res;
}

/** Campos de rastreabilidade presentes em todas as respostas de erro. */
const traceFields = { timestamp: expect.any(String), path: '/cars', requestId: 'req-123' };

/** Simula um erro do `express.json()`, que é identificado pela propriedade `type`. */
function bodyParserError(type: string) {
  return Object.assign(new Error('body-parser'), { type });
}

describe('errorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [new NotFoundError('Automóvel não encontrado.'), 404, 'NOT_FOUND'],
    [new ConflictError('Automóvel em uso.'), 409, 'CONFLICT'],
  ])('converte %s no status HTTP correspondente', (error, status, code) => {
    const res = handle(error);

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({
      error: { code, message: error.message, ...traceFields },
    });
  });

  it('inclui o momento do erro em ISO 8601 (UTC)', () => {
    vi.useFakeTimers({ now: new Date('2024-05-10T11:30:00.000Z') });

    const res = handle(new NotFoundError('Automóvel não encontrado.'));

    expect(res.json.mock.calls[0]?.[0].error.timestamp).toBe('2024-05-10T11:30:00.000Z');
    vi.useRealTimers();
  });

  it('converte erros de validação do Zod em 400 com os detalhes de cada campo', () => {
    const result = z
      .object({ name: z.string().min(1, 'Nome obrigatório.') })
      .safeParse({ name: '' });

    const res = handle(result.error);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Os dados enviados são inválidos.',
        details: [{ field: 'name', message: 'Nome obrigatório.' }],
        ...traceFields,
      },
    });
  });

  it.each([
    ['entity.parse.failed', 400, 'INVALID_JSON'],
    ['entity.too.large', 413, 'PAYLOAD_TOO_LARGE'],
    ['charset.unsupported', 415, 'UNSUPPORTED_MEDIA_TYPE'],
  ])('converte o erro "%s" do express.json() em %i', (type, status, code) => {
    const res = handle(bodyParserError(type));

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json.mock.calls[0]?.[0].error.code).toBe(code);
  });

  it('responde 500 sem expor detalhes internos e registra o erro com o requestId', () => {
    const logError = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const error = new Error('connection refused at 10.0.0.1');

    const res = handle(error);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ocorreu um erro inesperado.',
        ...traceFields,
      },
    });
    expect(logError).toHaveBeenCalledWith('Erro inesperado', {
      requestId: 'req-123',
      method: 'POST',
      path: '/cars',
      error: error.stack,
    });
  });

  it('trata como erro inesperado (500) um erro desconhecido do express.json()', () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {});

    const res = handle(bodyParserError('stream.not.readable'));

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
