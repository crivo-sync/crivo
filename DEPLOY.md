# Deploy — Railway (API) + Supabase (banco) + Vercel (front)

Guia para publicar o Crivo Sync pela primeira vez. As variáveis estão prontas
para colar; o que você precisa substituir aparece como `COLE_AQUI`.

> **Ordem importa.** Banco → API → front. Cada etapa produz um valor que a
> seguinte precisa (a URL do banco, depois a URL da API).

---

## 1. Supabase (banco)

1. Crie o projeto em [supabase.com](https://supabase.com) — região **South
   America (São Paulo)**, que é onde estão as clínicas.
2. Guarde a senha do banco: ela só aparece na criação.
3. **Project Settings → Database → Connection string → URI.**

Você precisa de **duas** URLs, e elas são diferentes:

| Variável | Porta | Para quê |
| --- | --- | --- |
| `DATABASE_URL` | **6543** (Transaction pooler) | A aplicação em si |
| `DIRECT_URL` | **5432** (Direct connection) | `prisma migrate deploy` |

Por que duas: o pooler (PgBouncer) multiplexa conexões — essencial para uma
API com muitas requisições curtas —, mas **não suporta os comandos DDL** que
a migration usa. Com só a do pooler, o deploy falha no meio da migration,
deixando o banco pela metade. O `prisma.config.ts` já lê `DIRECT_URL`.

```bash
# Note o ?pgbouncer=true na primeira — sem ele o Prisma tenta usar prepared
# statements, que o pooler não suporta ("prepared statement s0 already exists").
DATABASE_URL="postgresql://postgres.COLE_AQUI:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.COLE_AQUI:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

> Se a senha tiver caractere especial (`@`, `/`, `#`), escape-a na URL:
> `@` vira `%40`, `/` vira `%2F`. Senha crua quebra a conexão com um erro
> que não menciona a senha.

---

## 2. Railway (API)

**Serviços:** adicione o repositório (`crivo-be` como root) **e** um serviço
**Redis** (New → Database → Redis). O Redis é obrigatório: a fila de
mensagens (BullMQ) roda nele. O Supabase não fornece Redis.

**Settings → Build/Deploy:**

| Campo | Valor |
| --- | --- |
| Root Directory | `crivo-be` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start:migrate:prod` |
| Healthcheck Path | `/health` |

O start roda `prisma migrate deploy` antes de subir a API — assim o banco
sempre acompanha o código, sem passo manual. O `prisma generate` sai de
graça pelo `postinstall` (o client é gerado em `node_modules`, que não vai
no git).

> ⚠️ **Se o build falhar em `@emnapi`** (`npm ci` quebrando ao resolver
> `@emnapi/core`): é o npm do Railway, mais novo que o local, discordando do
> `package-lock.json`. Já aconteceu neste projeto e em outros. Solução: leia
> a versão exigida **no log do build** (ela sobe com o tempo — não reutilize
> um número antigo) e fixe-a localmente antes de commitar:
>
> ```bash
> npm i -D @emnapi/core@<versão-do-log> --package-lock-only
> ```
>
> Nunca rode `npm install` puro aqui para "resolver" — é o que gera o
> desencontro em primeiro lugar.

### Variáveis (Railway → Variables → Raw Editor)

```bash
NODE_ENV=production

# Do passo 1 (Supabase)
DATABASE_URL=postgresql://postgres.COLE_AQUI:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.COLE_AQUI:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

# Redis: referência ao serviço do próprio Railway, resolvida no deploy.
# Não cole a URL à mão — assim ela acompanha rotação de senha sozinha.
REDIS_URL=${{Redis.REDIS_URL}}

# Segredos gerados para este deploy. NÃO reutilize em outro ambiente.
JWT_SECRET=ba61f8f55790c3fc30ef5e6a822958d86457a24dd7abd0cbeba492a7b39e32bc47f36eb985fb2b78f601ad138ff3cf09
JWT_EXPIRES_IN_SECONDS=900
REFRESH_TOKEN_EXPIRES_IN_SECONDS=2592000
INBOUND_WEBHOOK_TOKEN=d40a8b7f9650fcc5f1edda0fdab23b103a5ed15d255f8addf1d4ee985cdfae3d

# ⚠️ Preencher DEPOIS do passo 3, quando a Vercel der o domínio.
# São os dois pontos que quebram silenciosamente se ficarem errados:
# CORS_ORIGINS  → o navegador bloqueia toda chamada
# PUBLIC_APP_URL → e-mail, link de confirmação e retorno do Stripe vão para
#                  o lugar errado (já aconteceu com um túnel morto)
CORS_ORIGINS=https://COLE_AQUI.vercel.app
PUBLIC_APP_URL=https://COLE_AQUI.vercel.app

# WhatsApp: comece em `fake` (não envia nada, só registra).
# Trocar para `meta` só com as credenciais oficiais — `evolution` em
# produção tem risco de banimento permanente do número (ver ROADMAP).
MESSAGING_PROVIDER=fake
REMINDER_HOURS_BEFORE=24

# Painel da fila em /admin/queues. Sem os dois, a rota fica 404 — ele
# mostra dado real de paciente, então nunca fica aberto por padrão.
BULL_BOARD_USER=admin
BULL_BOARD_PASSWORD=zAfeiOoHqY-lMVLl

# Documentação da API. `false` em produção: /docs é o mapa completo das
# rotas. Ligue temporariamente se precisar depurar.
SWAGGER_ENABLED=false
```

**Opcionais** — cada bloco desliga sozinho se ficar vazio, sem quebrar nada:

```bash
# E-mail (boas-vindas, assinatura, aviso de trial). Sem isto vira log.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=Crivo <nao-responda@crivo.app>

# Stripe. Sem isto, assinatura não funciona (o resto do painel funciona).
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Upload de logo/avatar. Sem isto, o upload falha; o resto segue.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# IA nas mensagens. Sem chave, cai no template fixo automaticamente.
DEEPSEEK_API_KEY=
DEEPSEEK_API_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
AI_TIMEOUT_MS=5000
```

Ao final, copie o domínio gerado (`https://crivo-be-production.up.railway.app`).

---

## 3. Vercel (front)

**Root Directory:** `crivo-fe` (o framework é detectado sozinho).

```bash
NEXT_PUBLIC_API_URL=https://COLE_AQUI.up.railway.app
```

> `NEXT_PUBLIC_*` é embutida **no build**, não lida em runtime: mudar o
> valor exige um redeploy, não só reiniciar.

Com o domínio da Vercel em mãos, **volte ao Railway** e preencha
`CORS_ORIGINS` e `PUBLIC_APP_URL`. A API reinicia sozinha.

---

## 4. Primeiro acesso

O banco sobe vazio — as migrations criam as tabelas, mas **não** criam
clínica nem usuário. Duas opções:

- **Cadastro pelo site** (recomendado): acesse `/cadastro` no domínio da
  Vercel e crie a clínica real. É o mesmo fluxo que um cliente faria.
- **Seed de demonstração**: `DATABASE_URL="<a DIRECT_URL>" npm run prisma:seed`
  do seu computador. Cria duas clínicas fictícias com dados de exemplo —
  bom para demonstração, **nunca** num banco que já tem cliente real.

### Conferir se subiu de pé

```bash
curl https://SEU-BACKEND.up.railway.app/health     # {"status":"ok"}
curl https://SEU-BACKEND.up.railway.app/plans      # lista os 4 planos
```

`/health` consulta o banco: se responder `ok`, a conexão com o Supabase
está funcionando.

---

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| Deploy reinicia sem parar | Healthcheck falhando — confira `/health` e se `DATABASE_URL` está certa |
| `prepared statement "s0" already exists` | Faltou `?pgbouncer=true` na `DATABASE_URL` |
| Migration falha no deploy | `DIRECT_URL` ausente ou apontando para a porta 6543 (precisa ser 5432) |
| Tela em branco, erro de CORS no console | `CORS_ORIGINS` vazia ou com barra no fim / domínio errado |
| Login funciona, mas nada carrega | `NEXT_PUBLIC_API_URL` errada — precisa de redeploy na Vercel, não só reiniciar |
| E-mail e link de confirmação apontando para o lugar errado | `PUBLIC_APP_URL` com o valor de desenvolvimento |
| Fila de mensagens parada | `REDIS_URL` ausente — confirme que o serviço Redis existe no projeto |

---

## Depois de publicar

1. **Trocar o WhatsApp para oficial** (`MESSAGING_PROVIDER=meta`) antes de
   ter cliente pagando — hoje em `fake`, nada é enviado de verdade.
2. **Webhook do Stripe**: aponte para
   `https://SEU-BACKEND.up.railway.app/billing/webhook` no painel do Stripe
   e cole o `STRIPE_WEBHOOK_SECRET` gerado lá.
3. **Backup do banco**: o Supabase faz backup diário no plano pago; no
   gratuito, não. Vale saber disso antes de ter dado real de paciente.
