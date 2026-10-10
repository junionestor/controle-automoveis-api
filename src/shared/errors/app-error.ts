/**
 * Erro "esperado" da aplicação: representa uma falha de entrada ou de regra de
 * negócio que deve ser devolvida ao cliente com um status HTTP específico.
 * Erros que não herdam desta classe são tratados como falhas inesperadas (500).
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** O recurso solicitado não existe. */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
}

/** A operação conflita com o estado atual de um recurso (ex.: automóvel já em uso). */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
}

/** Os dados enviados são inválidos. */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
}

/** O corpo da requisição está em um formato que a API não aceita (ela só aceita JSON). */
export class UnsupportedMediaTypeError extends AppError {
  readonly statusCode = 415;
  readonly code = 'UNSUPPORTED_MEDIA_TYPE';
}
