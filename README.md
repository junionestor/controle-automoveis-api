# Controle de Automóveis API

[![CI](https://github.com/junionestor/controle-automoveis-api/actions/workflows/ci.yml/badge.svg)](https://github.com/junionestor/controle-automoveis-api/actions/workflows/ci.yml)

WebAPI para controlar a utilização dos automóveis de uma empresa: cadastro de automóveis,
cadastro de motoristas e registro de utilização de um automóvel por um motorista.

**Stack:** Node.js 24 · TypeScript · Express 5 · Zod · Vitest + Supertest · Docker

## Sumário

- [Como executar](#como-executar)
- [Como testar](#como-testar)
- [Endpoints](#endpoints)
- [Exemplo de uso](#exemplo-de-uso)
- [Regras de negócio e decisões](#regras-de-negócio-e-decisões)
- [Estrutura do projeto](#estrutura-do-projeto)

## Como executar

```bash
git clone https://github.com/junionestor/controle-automoveis-api.git
cd controle-automoveis-api
```

### Com Docker (recomendado)

Pré-requisito: Docker com Docker Compose.

```bash
docker compose up --build
```

A API sobe em `http://localhost:3000` e a documentação interativa (Swagger) fica em
**http://localhost:3000/docs**. Se a porta 3000 estiver ocupada, escolha outra:

```bash
API_PORT=3100 docker compose up --build
```

### Localmente

Pré-requisito: Node.js 24 (há um `.nvmrc` na raiz).

```bash
npm ci
npm run dev                    # desenvolvimento, com reload automático
# ou
npm run build && npm start     # build de produção
```

A porta pode ser alterada com a variável `PORT` (veja `.env.example`).

> A persistência é **em memória**, como permitido no enunciado: os dados são perdidos quando a
> aplicação é reiniciada.

## Como testar

```bash
# Com Docker
docker compose run --rm test

# Localmente
npm test                # executa todos os testes
npm run test:coverage   # executa os testes com relatório de cobertura
```

A suíte de testes cobre ~99% do código:

- **`tests/unit`**: testes de unidade dos services (onde ficam as regras de negócio), do
  repositório em memória, da validação de placas, dos schemas e do tratamento de erros.
- **`tests/integration`**: testes das rotas HTTP com Supertest, cobrindo status, formato das
  respostas, filtros e cenários de erro.

Outras verificações de qualidade: `npm run lint`, `npm run typecheck` e `npm run format:check`
(executadas também no CI do GitHub Actions, em `.github/workflows/ci.yml`).

## Endpoints

A documentação completa, com schemas e exemplos, está em **`/docs`** (Swagger UI).

| Método   | Rota                     | Descrição                                                            |
| -------- | ------------------------ | -------------------------------------------------------------------- |
| `POST`   | `/cars`                  | Cadastra um automóvel                                                |
| `GET`    | `/cars?color=&brand=`    | Lista os automóveis (filtros opcionais por cor e marca)              |
| `GET`    | `/cars/:id`              | Recupera um automóvel                                                |
| `PUT`    | `/cars/:id`              | Atualiza um automóvel                                                |
| `DELETE` | `/cars/:id`              | Exclui um automóvel                                                  |
| `POST`   | `/drivers`               | Cadastra um motorista                                                |
| `GET`    | `/drivers?name=`         | Lista os motoristas (filtro opcional por nome)                       |
| `GET`    | `/drivers/:id`           | Recupera um motorista                                                |
| `PUT`    | `/drivers/:id`           | Atualiza um motorista                                                |
| `DELETE` | `/drivers/:id`           | Exclui um motorista                                                  |
| `POST`   | `/car-usages`            | Inicia a utilização de um automóvel por um motorista                 |
| `PATCH`  | `/car-usages/:id/finish` | Finaliza uma utilização                                              |
| `GET`    | `/car-usages`            | Lista as utilizações com o nome do motorista e os dados do automóvel |
| `GET`    | `/car-usages/:id`        | Recupera uma utilização                                              |
| `GET`    | `/health`                | Verifica se a API está no ar (com `timestamp` e `uptimeSeconds`)     |

### Erros

Todos os erros seguem o mesmo formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Os dados enviados são inválidos.",
    "details": [{ "field": "plate", "message": "O campo \"plate\" deve ser uma placa válida..." }],
    "timestamp": "2024-05-10T11:30:00.000Z",
    "path": "/cars",
    "requestId": "3f9a7c52-1d4e-4b8a-9c2f-6e5d4c3b2a10"
  }
}
```

`details` aparece apenas em erros de validação. `timestamp` (UTC), `path` e `requestId` aparecem em
todos os erros e permitem localizar a falha nos logs.

| Status | `code`                             | Quando                                                      |
| ------ | ---------------------------------- | ----------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`, `INVALID_JSON` | Dados inválidos (`details` indica cada campo com problema)  |
| 404    | `NOT_FOUND`, `ROUTE_NOT_FOUND`     | Recurso ou rota inexistente                                 |
| 409    | `CONFLICT`                         | Violação de regra de negócio (ex.: automóvel já em uso)     |
| 413    | `PAYLOAD_TOO_LARGE`                | Corpo da requisição maior que 10 KB                         |
| 415    | `UNSUPPORTED_MEDIA_TYPE`           | Corpo enviado em um formato diferente de JSON               |
| 500    | `INTERNAL_SERVER_ERROR`            | Erro inesperado (os detalhes são registrados apenas no log) |

### Rastreabilidade e logs

- **`X-Request-Id`:** toda resposta traz esse cabeçalho. Se o cliente (ou um gateway) já enviar
  um, o valor é reaproveitado; senão, a API gera um UUID. O mesmo valor aparece no `requestId`
  dos erros e nos logs, então basta ele para encontrar o que aconteceu em uma requisição.
- **Logs estruturados:** a API escreve uma linha JSON por evento (com `timestamp`, `level`,
  `requestId`, método, rota, status e `durationMs`), formato pronto para ferramentas como
  Elasticsearch, Loki ou CloudWatch. As consultas ao `/health` (feitas a cada 30s pelo
  `HEALTHCHECK` do Docker) não são registradas, e os logs ficam desligados durante os testes.

## Exemplo de uso

```bash
# 1. Cadastrar um automóvel e um motorista
curl -X POST localhost:3000/cars -H 'Content-Type: application/json' \
  -d '{ "plate": "ABC-1D23", "color": "Prata", "brand": "Fiat" }'

curl -X POST localhost:3000/drivers -H 'Content-Type: application/json' \
  -d '{ "name": "João da Silva" }'

# 2. Iniciar a utilização (startDate é opcional; o padrão é a data/hora atual)
curl -X POST localhost:3000/car-usages -H 'Content-Type: application/json' \
  -d '{ "carId": "<id do automóvel>", "driverId": "<id do motorista>",
        "reason": "Visita a cliente", "startDate": "2024-05-10T08:30:00-03:00" }'

# 3. Finalizar a utilização (endDate é opcional; o padrão é a data/hora atual)
curl -X PATCH localhost:3000/car-usages/<id da utilização>/finish \
  -H 'Content-Type: application/json' -d '{ "endDate": "2024-05-10T18:00:00-03:00" }'

# 4. Listar as utilizações
curl localhost:3000/car-usages
```

Resposta da listagem:

```json
[
  {
    "id": "8f0c1c1e-5a3b-4b8e-9a51-0d6c3c2f7a10",
    "startDate": "2024-05-10T11:30:00.000Z",
    "endDate": "2024-05-10T21:00:00.000Z",
    "reason": "Visita a cliente",
    "driver": { "id": "…", "name": "João da Silva" },
    "car": { "id": "…", "plate": "ABC1D23", "color": "Prata", "brand": "Fiat" },
    "createdAt": "…",
    "updatedAt": "…"
  }
]
```

## Regras de negócio e decisões

- **Um automóvel só pode ser utilizado por um motorista por vez, e um motorista não pode
  utilizar dois automóveis ao mesmo tempo** (`409 Conflict`). Como uma nova utilização ainda não
  tem término, ela ocupa o intervalo `[startDate, ∞)` e conflita com qualquer utilização do mesmo
  automóvel (ou motorista) que esteja em aberto ou que termine depois de `startDate`. Assim, além
  do uso simultâneo, também são barrados registros retroativos que cairiam no meio de uma
  utilização já finalizada.
- **Finalização:** uma utilização só pode ser finalizada uma vez (`409`), e a data de término não
  pode ser anterior à de início (`400`).
- **Exclusão:** automóveis e motoristas que possuem registros de utilização não podem ser
  excluídos (`409`), preservando a integridade do histórico — o mesmo efeito de uma chave
  estrangeira `RESTRICT` em um banco relacional.
- **Placas:** aceitas no padrão antigo (`ABC-1234`) e no Mercosul (`ABC1D23`), armazenadas em
  maiúsculas e sem hífen. Não é possível cadastrar duas vezes a mesma placa (`409`).
- **Filtros:** ignoram maiúsculas/minúsculas e acentos. Cor e marca usam comparação exata
  (`?brand=citroen` encontra "Citroën"); nome usa busca parcial (`?name=joa` encontra "João" e
  "Joana"). Filtros vazios são ignorados.
- **Datas:** formato ISO 8601 com fuso horário explícito (ex.: `2024-05-10T08:30:00-03:00`), para
  evitar ambiguidade. As respostas são sempre em UTC. Todos os recursos têm `createdAt` e
  `updatedAt`, preenchidos pela própria API (o cliente não consegue alterá-los).
- **Atualização:** `PUT` substitui o recurso por completo, então todos os campos são obrigatórios.

## Estrutura do projeto

```
src/
├── app.ts                  # Montagem do Express (middlewares, rotas, tratamento de erros)
├── server.ts               # Inicialização do servidor HTTP e encerramento gracioso
├── container.ts            # Composition root: instancia repositórios, services e controllers
├── config/env.ts           # Variáveis de ambiente validadas
├── docs/openapi.ts         # Especificação OpenAPI servida em /docs
├── modules/
│   ├── cars/               # Automóveis
│   ├── drivers/            # Motoristas
│   └── car-usages/         # Utilização de automóveis
└── shared/                 # Erros, middlewares HTTP, logger, repositório em memória e validação
```

Cada módulo é organizado em camadas com responsabilidades bem definidas:

| Arquivo                     | Responsabilidade                                                |
| --------------------------- | --------------------------------------------------------------- |
| `*.routes.ts`               | Mapeia as rotas HTTP para o controller                          |
| `*.controller.ts`           | Valida a entrada (schemas Zod) e monta a resposta HTTP          |
| `*.service.ts`              | Regras de negócio; não conhece HTTP nem a forma de persistência |
| `*.repository.ts`           | Interface de persistência da qual o service depende             |
| `in-memory-*.repository.ts` | Implementação da persistência em memória                        |
| `*.schemas.ts`              | Validação e normalização dos dados de entrada                   |
| `*.entity.ts`               | Tipos do domínio                                                |

Os services dependem apenas das **interfaces** dos repositórios, e as implementações concretas são
escolhidas em um único lugar (`container.ts`). Trocar a persistência em memória por um banco de
dados exigiria apenas novas implementações dessas interfaces, sem alterar regras de negócio ou
rotas.
