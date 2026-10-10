import { env } from '../config/env';

type LogLevel = 'info' | 'error';
type LogContext = Record<string, unknown>;

/**
 * Escreve um log estruturado: uma linha JSON por evento, com `timestamp` e
 * `level`, pronta para ser indexada por ferramentas de observabilidade.
 * Fica silenciado durante os testes para não poluir a saída.
 */
function log(level: LogLevel, message: string, context: LogContext = {}): void {
  if (env.NODE_ENV === 'test') {
    return;
  }

  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...context });
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
};
