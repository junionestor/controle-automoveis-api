import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { logger } from '../../src/shared/logger';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ISO_UTC_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

describe('App', () => {
  const app = createApp();

  it('GET /health responde que a API está disponível, com data/hora e tempo no ar', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.body).toEqual({
      status: 'ok',
      timestamp: expect.stringMatching(ISO_UTC_DATE_TIME),
      uptimeSeconds: expect.any(Number),
    });
  });

  describe('log de acesso', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('registra cada requisição com requestId, status e duração', async () => {
      const logInfo = vi.spyOn(logger, 'info');

      const response = await request(app).get('/cars');

      expect(logInfo).toHaveBeenCalledWith('Requisição concluída', {
        requestId: response.headers['x-request-id'],
        method: 'GET',
        path: '/cars',
        statusCode: 200,
        durationMs: expect.any(Number),
      });
    });

    it('não registra as consultas ao /health, feitas a cada 30s pelo HEALTHCHECK do Docker', async () => {
      const logInfo = vi.spyOn(logger, 'info');

      await request(app).get('/health');

      expect(logInfo).not.toHaveBeenCalled();
    });
  });

  it('serve a documentação Swagger em /docs', async () => {
    const response = await request(app).get('/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });

  it('responde 404 padronizado para rotas inexistentes', async () => {
    const response = await request(app).get('/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Rota GET /unknown não encontrada.',
        timestamp: expect.stringMatching(ISO_UTC_DATE_TIME),
        path: '/unknown',
        requestId: response.headers['x-request-id'],
      },
    });
  });

  it('responde 400 quando o corpo não é um JSON válido', async () => {
    const response = await request(app)
      .post('/cars')
      .set('Content-Type', 'application/json')
      .send('{ invalid json');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  it('responde 400 quando o corpo não é enviado', async () => {
    const response = await request(app).post('/drivers');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('responde 413 quando o corpo excede o tamanho máximo', async () => {
    const response = await request(app)
      .post('/drivers')
      .send({ name: 'x'.repeat(20_000) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('responde 415 quando o corpo não é JSON', async () => {
    const response = await request(app)
      .post('/drivers')
      .set('Content-Type', 'text/plain')
      .send('name=João');

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  describe('X-Request-Id', () => {
    it('gera um identificador para cada requisição', async () => {
      const [first, second] = await Promise.all([
        request(app).get('/health'),
        request(app).get('/health'),
      ]);

      expect(first.headers['x-request-id']).toMatch(UUID);
      expect(second.headers['x-request-id']).toMatch(UUID);
      expect(first.headers['x-request-id']).not.toBe(second.headers['x-request-id']);
    });

    it('reaproveita o identificador enviado pelo cliente', async () => {
      const response = await request(app).get('/unknown').set('X-Request-Id', 'gateway-42');

      expect(response.headers['x-request-id']).toBe('gateway-42');
      expect(response.body.error.requestId).toBe('gateway-42');
    });

    it('substitui identificadores com caracteres não permitidos', async () => {
      const response = await request(app).get('/health').set('X-Request-Id', 'abc"} injected');

      expect(response.headers['x-request-id']).toMatch(UUID);
    });
  });
});
