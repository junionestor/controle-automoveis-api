# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine

# ---- Dependências (incluindo as de desenvolvimento) ---------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: nenhuma dependência precisa de scripts de instalação, então
# não executamos código de terceiros durante o build.
RUN npm ci --ignore-scripts

# ---- Testes: docker compose run --rm test -------------------------------------
FROM deps AS test
COPY . .
CMD ["npm", "test"]

# ---- Build: TypeScript -> JavaScript ------------------------------------------
FROM deps AS build
COPY . .
RUN npm run build

# ---- Imagem final: apenas o JS compilado e as dependências de produção ---------
FROM node:${NODE_VERSION} AS production
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist

# Executa com usuário sem privilégios (já existente na imagem oficial do Node).
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT}/health" || exit 1

# Node diretamente (sem npm) para receber os sinais de encerramento (SIGTERM).
CMD ["node", "dist/server.js"]
