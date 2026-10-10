import express, { type Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import { createContainer, type Container } from './container';
import { openApiDocument } from './docs/openapi';
import { createCarUsageRoutes } from './modules/car-usages/car-usage.routes';
import { createCarRoutes } from './modules/cars/car.routes';
import { createDriverRoutes } from './modules/drivers/driver.routes';
import { errorHandler, routeNotFoundHandler } from './shared/http/error-handlers';
import { requestId, requestLogger, requireJsonBody } from './shared/http/middlewares';

// Mensagens de validação padrão do Zod em português.
z.config(z.locales.pt());

/** Os maiores corpos aceitos pela API têm poucas centenas de bytes. */
const JSON_BODY_LIMIT = '10kb';

export function createApp(container: Container = createContainer()): Express {
  const app = express();

  app.use(requestId);
  app.use(
    helmet({
      // A API pode ser servida sem HTTPS (localhost/Docker); com esta diretiva
      // o navegador tentaria carregar os assets do Swagger UI via HTTPS.
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );

  // Registrada antes do log de acesso: o HEALTHCHECK do Docker consulta esta rota
  // a cada 30s, e registrar cada consulta só encheria o log de ruído.
  app.get('/health', (_req, res) => {
    // O estado da API muda a cada consulta, então a resposta nunca deve ser cacheada.
    res.set('Cache-Control', 'no-store').json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  app.use(requestLogger);
  app.use(requireJsonBody);
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/cars', createCarRoutes(container.carController));
  app.use('/drivers', createDriverRoutes(container.driverController));
  app.use('/car-usages', createCarUsageRoutes(container.carUsageController));

  app.use(routeNotFoundHandler);
  app.use(errorHandler);

  return app;
}
