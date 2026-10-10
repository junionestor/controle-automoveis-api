import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { logger } from '../logger';

interface ErrorDetail {
  field: string;
  message: string;
}

interface HttpErrorInfo {
  statusCode: number;
  code: string;
  message: string;
}

/** Erros lançados pelo `express.json()`, identificados pela propriedade `type`. */
const BODY_PARSER_ERRORS: Record<string, HttpErrorInfo> = {
  'entity.parse.failed': {
    statusCode: 400,
    code: 'INVALID_JSON',
    message: 'O corpo da requisição não é um JSON válido.',
  },
  'entity.too.large': {
    statusCode: 413,
    code: 'PAYLOAD_TOO_LARGE',
    message: 'O corpo da requisição excede o tamanho máximo permitido.',
  },
  'charset.unsupported': {
    statusCode: 415,
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'O corpo da requisição deve estar codificado em UTF-8.',
  },
};

function sendError(
  req: Request,
  res: Response,
  { statusCode, code, message }: HttpErrorInfo,
  details?: ErrorDetail[],
): void {
  res.status(statusCode).json({
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: req.id,
    },
  });
}

function bodyParserErrorOf(error: unknown): HttpErrorInfo | undefined {
  if (error instanceof Error && 'type' in error && typeof error.type === 'string') {
    return BODY_PARSER_ERRORS[error.type];
  }
  return undefined;
}

export const routeNotFoundHandler: RequestHandler = (req, res) => {
  sendError(req, res, {
    statusCode: 404,
    code: 'ROUTE_NOT_FOUND',
    message: `Rota ${req.method} ${req.path} não encontrada.`,
  });
};

/**
 * Converte qualquer erro lançado pelas rotas em uma resposta JSON padronizada:
 * `{ "error": { "code", "message", "details"?, "timestamp", "path", "requestId" } }`
 */
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    sendError(
      req,
      res,
      { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Os dados enviados são inválidos.' },
      details,
    );
    return;
  }

  if (error instanceof AppError) {
    sendError(req, res, error);
    return;
  }

  const bodyParserError = bodyParserErrorOf(error);
  if (bodyParserError) {
    sendError(req, res, bodyParserError);
    return;
  }

  // O `requestId` permite localizar no log o erro que o cliente recebeu como 500.
  logger.error('Erro inesperado', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    error: error instanceof Error ? error.stack : String(error),
  });
  sendError(req, res, {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Ocorreu um erro inesperado.',
  });
};
