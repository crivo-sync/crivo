# syntax=docker/dockerfile:1
#
# Build da API (crivo-be) para o Fly.io.
#
# O contexto de build é a RAIZ do repositório — o Fly define isso por padrão e
# a opção `dockerfile` do fly.toml não muda o contexto. Por isso todo caminho
# aqui começa com `crivo-be/`. Para deploy: `fly deploy` a partir da raiz.

# ---------------------------------------------------------------------------
# 1. Dependências + build
# ---------------------------------------------------------------------------
FROM node:26-bookworm-slim AS build
WORKDIR /app

# openssl: o Prisma escolhe o engine pela versão de OpenSSL da imagem; sem o
# pacote ele não identifica a lib e falha ao abrir conexão.
# python3/make/g++: só entram em ação se um módulo nativo (bcrypt) não tiver
# prebuild para a plataforma — sem isso o `npm ci` quebra no meio.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       openssl ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# `prisma/` e `prisma.config.ts` vêm antes do `npm ci` porque o postinstall do
# package.json roda `prisma generate` — o client é gerado dentro de
# node_modules e não existe no git.
COPY crivo-be/package.json crivo-be/package-lock.json ./
COPY crivo-be/prisma ./prisma
COPY crivo-be/prisma.config.ts ./

# O lock foi gerado pelo npm 11.6.2 (o da máquina de dev). O npm que vem na
# imagem node:24 é mais novo e recusa esse lock no `npm ci` — "Missing:
# @emnapi/core@2.0.0-beta.2 from lock file", por causa de um peerDependency
# opcional do @napi-rs/wasm-runtime. Fixar o npm aqui deixa o build
# reprodutível e igual ao ambiente onde o lock é gerado.
RUN npm install -g npm@11.6.2
RUN npm ci

COPY crivo-be/nest-cli.json crivo-be/tsconfig.json crivo-be/tsconfig.build.json ./
COPY crivo-be/src ./src
RUN npm run build

# ---------------------------------------------------------------------------
# 2. Runtime
# ---------------------------------------------------------------------------
FROM node:26-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# A API escuta nesta porta (main.ts lê process.env.PORT) e o proxy do Fly
# encaminha o tráfego público para ela. Tem de ser igual ao `internal_port`
# do fly.toml — números diferentes = healthcheck falhando em loop.
ENV PORT=8080

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# node_modules inteiro, e não só as dependências de produção: o
# `start:migrate:prod` chama o CLI do Prisma, que está em devDependencies.
# Um `npm prune --omit=dev` aqui deixaria o container sem como migrar.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY crivo-be/package.json crivo-be/prisma.config.ts ./

# O usuário `node` já existe na imagem oficial; nada aqui precisa de root.
USER node

EXPOSE 8080

# Aplica as migrations pendentes e só então sobe a API — mesmo comando usado no
# Render, para os dois ambientes não divergirem no jeito de publicar.
CMD ["npm", "run", "start:migrate:prod"]
