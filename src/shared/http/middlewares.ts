import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { RequestHandler } from 'express';
import { UnsupportedMediaTypeError } from '../errors/app-error';
import { logger } from '../logger';

declare module 'express-serve-static-core' {
  interface Request {
    /** Identificador da requisição (cabeçalho `X-Request-Id`), usado para correlacionar logs e erros. */
    id: string;
  }
}

export const REQUEST_ID_HEADER = 'X-Request-Id';

/** Caracteres seguros para registrar em log, evitando injeção de conteúdo arbitrário. */
const VALID_REQUEST_ID = /^[\w.:-]{1,128}$/;

/**
 * Reaproveita o `X-Request-Id` recebido (ex.: gerado por um gateway ou por outro
 * serviço) ou gera um novo, e o devolve na resposta. Assim, uma mesma requisição
 * pode ser rastreada de ponta a ponta nos logs de todos os sistemas envolvidos.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const received = req.get(REQUEST_ID_HEADER);
  req.id = received && VALID_REQUEST_ID.test(received) ? received : randomUUID();
  res.set(REQUEST_ID_HEADER, req.id);
  next();
};

/** Registra cada requisição concluída com status e tempo de resposta. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = performance.now();

  res.on('finish', () => {
    logger.info('Requisição concluída', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number((performance.now() - startedAt).toFixed(1)),
    });
  });

  next();
};

/**
 * A API só aceita corpos em JSON. Sem esta verificação, um corpo em outro
 * formato seria ignorado pelo `express.json()` e o cliente receberia um erro de
 * validação confuso ("campo obrigatório") em vez de `415 Unsupported Media Type`.
 * Requisições sem corpo (ex.: `PATCH /car-usages/:id/finish`) não são afetadas.
 */
export const requireJsonBody: RequestHandler = (req, _res, next) => {
  const hasBody =
    req.get('Transfer-Encoding') !== undefined || Number(req.get('Content-Length')) > 0;

  if (hasBody && !req.is('application/json')) {
    next(
      new UnsupportedMediaTypeError(
        'O corpo da requisição deve ser um JSON (Content-Type: application/json).',
      ),
    );
    return;
  }

  next();
};
