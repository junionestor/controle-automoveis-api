function jsonContent(schemaName: string) {
  return { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } };
}

function jsonArrayContent(schemaName: string) {
  return {
    'application/json': {
      schema: { type: 'array', items: { $ref: `#/components/schemas/${schemaName}` } },
    },
  };
}

function responseRef(responseName: string) {
  return { $ref: `#/components/responses/${responseName}` };
}

/** Especificação OpenAPI servida pelo Swagger UI em `/docs`. */
export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Controle de Automóveis API',
    version: '1.0.0',
    description:
      'WebAPI para controlar a utilização dos automóveis de uma empresa.\n\n' +
      '**Regras de negócio:** um automóvel só pode ser utilizado por um motorista por vez, ' +
      'e um motorista não pode utilizar mais de um automóvel ao mesmo tempo.\n\n' +
      '**Rastreabilidade:** toda resposta traz o cabeçalho `X-Request-Id`. Se o cliente enviar ' +
      'esse cabeçalho, o valor é reaproveitado; caso contrário, um novo UUID é gerado. O mesmo ' +
      'identificador aparece no corpo das respostas de erro e nos logs da API.\n\n' +
      '**Formato:** os corpos devem ser JSON (`415` caso contrário) com no máximo 10 KB (`413`).',
  },
  tags: [
    { name: 'Automóveis' },
    { name: 'Motoristas' },
    { name: 'Utilizações' },
    { name: 'Health' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica se a API está no ar',
        responses: { '200': { description: 'API disponível', content: jsonContent('Health') } },
      },
    },
    '/cars': {
      get: {
        tags: ['Automóveis'],
        summary: 'Lista os automóveis',
        description: 'Filtros por cor e marca ignoram maiúsculas/minúsculas e acentos.',
        parameters: [
          { name: 'color', in: 'query', schema: { type: 'string' }, example: 'Prata' },
          { name: 'brand', in: 'query', schema: { type: 'string' }, example: 'Fiat' },
        ],
        responses: {
          '200': {
            description: 'Lista de automóveis',
            content: jsonArrayContent('Car'),
          },
        },
      },
      post: {
        tags: ['Automóveis'],
        summary: 'Cadastra um automóvel',
        requestBody: { required: true, content: jsonContent('CarInput') },
        responses: {
          '201': { description: 'Automóvel cadastrado', content: jsonContent('Car') },
          '400': responseRef('ValidationError'),
          '409': { ...responseRef('Conflict'), description: 'Placa já cadastrada' },
        },
      },
    },
    '/cars/{id}': {
      parameters: [{ $ref: '#/components/parameters/Id' }],
      get: {
        tags: ['Automóveis'],
        summary: 'Recupera um automóvel',
        responses: {
          '200': { description: 'Automóvel', content: jsonContent('Car') },
          '404': responseRef('NotFound'),
        },
      },
      put: {
        tags: ['Automóveis'],
        summary: 'Atualiza um automóvel',
        requestBody: { required: true, content: jsonContent('CarInput') },
        responses: {
          '200': { description: 'Automóvel atualizado', content: jsonContent('Car') },
          '400': responseRef('ValidationError'),
          '404': responseRef('NotFound'),
          '409': { ...responseRef('Conflict'), description: 'Placa pertence a outro automóvel' },
        },
      },
      delete: {
        tags: ['Automóveis'],
        summary: 'Exclui um automóvel',
        responses: {
          '204': { description: 'Automóvel excluído' },
          '404': responseRef('NotFound'),
          '409': {
            ...responseRef('Conflict'),
            description: 'Automóvel possui registros de utilização',
          },
        },
      },
    },
    '/drivers': {
      get: {
        tags: ['Motoristas'],
        summary: 'Lista os motoristas',
        description: 'Busca parcial pelo nome, ignorando maiúsculas/minúsculas e acentos.',
        parameters: [{ name: 'name', in: 'query', schema: { type: 'string' }, example: 'joao' }],
        responses: {
          '200': { description: 'Lista de motoristas', content: jsonArrayContent('Driver') },
        },
      },
      post: {
        tags: ['Motoristas'],
        summary: 'Cadastra um motorista',
        requestBody: { required: true, content: jsonContent('DriverInput') },
        responses: {
          '201': { description: 'Motorista cadastrado', content: jsonContent('Driver') },
          '400': responseRef('ValidationError'),
        },
      },
    },
    '/drivers/{id}': {
      parameters: [{ $ref: '#/components/parameters/Id' }],
      get: {
        tags: ['Motoristas'],
        summary: 'Recupera um motorista',
        responses: {
          '200': { description: 'Motorista', content: jsonContent('Driver') },
          '404': responseRef('NotFound'),
        },
      },
      put: {
        tags: ['Motoristas'],
        summary: 'Atualiza um motorista',
        requestBody: { required: true, content: jsonContent('DriverInput') },
        responses: {
          '200': { description: 'Motorista atualizado', content: jsonContent('Driver') },
          '400': responseRef('ValidationError'),
          '404': responseRef('NotFound'),
        },
      },
      delete: {
        tags: ['Motoristas'],
        summary: 'Exclui um motorista',
        responses: {
          '204': { description: 'Motorista excluído' },
          '404': responseRef('NotFound'),
          '409': {
            ...responseRef('Conflict'),
            description: 'Motorista possui registros de utilização',
          },
        },
      },
    },
    '/car-usages': {
      get: {
        tags: ['Utilizações'],
        summary: 'Lista as utilizações',
        description:
          'Retorna as utilizações (mais recentes primeiro) com o nome do motorista e os dados do automóvel.',
        responses: {
          '200': { description: 'Lista de utilizações', content: jsonArrayContent('CarUsage') },
        },
      },
      post: {
        tags: ['Utilizações'],
        summary: 'Inicia a utilização de um automóvel por um motorista',
        requestBody: { required: true, content: jsonContent('StartCarUsageInput') },
        responses: {
          '201': { description: 'Utilização registrada', content: jsonContent('CarUsage') },
          '400': responseRef('ValidationError'),
          '404': {
            ...responseRef('NotFound'),
            description: 'Automóvel ou motorista não encontrado',
          },
          '409': {
            ...responseRef('Conflict'),
            description: 'Automóvel já está em uso ou motorista já está utilizando outro automóvel',
          },
        },
      },
    },
    '/car-usages/{id}': {
      parameters: [{ $ref: '#/components/parameters/Id' }],
      get: {
        tags: ['Utilizações'],
        summary: 'Recupera uma utilização',
        responses: {
          '200': { description: 'Utilização', content: jsonContent('CarUsage') },
          '404': responseRef('NotFound'),
        },
      },
    },
    '/car-usages/{id}/finish': {
      parameters: [{ $ref: '#/components/parameters/Id' }],
      patch: {
        tags: ['Utilizações'],
        summary: 'Finaliza uma utilização',
        requestBody: { required: false, content: jsonContent('FinishCarUsageInput') },
        responses: {
          '200': { description: 'Utilização finalizada', content: jsonContent('CarUsage') },
          '400': {
            ...responseRef('ValidationError'),
            description: 'Dados inválidos ou data de término anterior à data de início',
          },
          '404': responseRef('NotFound'),
          '409': { ...responseRef('Conflict'), description: 'Utilização já finalizada' },
        },
      },
    },
  },
  components: {
    parameters: {
      Id: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    },
    schemas: {
      Car: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          plate: { type: 'string', example: 'ABC1D23' },
          color: { type: 'string', example: 'Prata' },
          brand: { type: 'string', example: 'Fiat' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CarInput: {
        type: 'object',
        required: ['plate', 'color', 'brand'],
        properties: {
          plate: {
            type: 'string',
            description:
              'Padrão antigo (ABC-1234) ou Mercosul (ABC1D23). É armazenada em maiúsculas e sem hífen.',
            example: 'ABC-1D23',
          },
          color: { type: 'string', maxLength: 30, example: 'Prata' },
          brand: { type: 'string', maxLength: 50, example: 'Fiat' },
        },
      },
      Driver: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'João da Silva' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DriverInput: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string', maxLength: 100, example: 'João da Silva' } },
      },
      CarUsage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: {
            type: ['string', 'null'],
            format: 'date-time',
            description: '`null` enquanto a utilização estiver em andamento',
          },
          reason: { type: 'string', example: 'Visita a cliente' },
          driver: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'João da Silva' },
            },
          },
          car: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              plate: { type: 'string', example: 'ABC1D23' },
              color: { type: 'string', example: 'Prata' },
              brand: { type: 'string', example: 'Fiat' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      StartCarUsageInput: {
        type: 'object',
        required: ['carId', 'driverId', 'reason'],
        properties: {
          carId: { type: 'string', format: 'uuid' },
          driverId: { type: 'string', format: 'uuid' },
          reason: { type: 'string', maxLength: 500, example: 'Visita a cliente' },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 com fuso horário. Padrão: data/hora atual.',
            example: '2024-05-10T08:30:00-03:00',
          },
        },
      },
      FinishCarUsageInput: {
        type: 'object',
        properties: {
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 com fuso horário. Padrão: data/hora atual.',
            example: '2024-05-10T18:00:00-03:00',
          },
        },
      },
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
          uptimeSeconds: { type: 'integer', description: 'Tempo, em segundos, desde o início' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message', 'timestamp', 'path', 'requestId'],
            properties: {
              code: { type: 'string', example: 'CONFLICT' },
              message: { type: 'string' },
              details: {
                type: 'array',
                description: 'Presente apenas em erros de validação: um item por campo inválido',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Momento em que o erro ocorreu (UTC)',
              },
              path: { type: 'string', example: '/cars/8f0c1c1e-5a3b-4b8e-9a51-0d6c3c2f7a10' },
              requestId: {
                type: 'string',
                description: 'Mesmo valor do cabeçalho `X-Request-Id`',
              },
            },
          },
        },
      },
    },
    responses: {
      NotFound: { description: 'Recurso não encontrado', content: jsonContent('Error') },
      Conflict: {
        description: 'Conflito com o estado atual do recurso',
        content: jsonContent('Error'),
      },
      ValidationError: { description: 'Dados inválidos', content: jsonContent('Error') },
    },
  },
};
