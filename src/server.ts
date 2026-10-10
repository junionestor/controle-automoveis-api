import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/logger';

const server = createApp().listen(env.PORT, (error) => {
  if (error) {
    logger.error('Falha ao iniciar o servidor', { error: error.stack });
    process.exit(1);
  }
  logger.info('API disponível', {
    url: `http://localhost:${env.PORT}`,
    docs: `http://localhost:${env.PORT}/docs`,
  });
});

// Encerramento gracioso: para de aceitar conexões e aguarda as requisições em andamento.
function shutdown(signal: NodeJS.Signals): void {
  logger.info('Sinal recebido, encerrando o servidor', { signal });
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
