# Crivo

API backend do Crivo — plataforma whitelabel de gestão para clínicas de estética, odontologia e afins.

## O core do sistema

O core não é "cadastro de paciente" nem "agenda" isoladamente — é o motor de decisão que liga **agendamento + comunicação + predição**. O sistema sabe quando um horário está em risco de virar buraco na agenda (falta, cancelamento) e age sozinho pra preencher ou evitar isso.

Na prática, o core é a tríade:

1. **Scheduling** (agenda) — gera o evento
2. **Prediction** (IA) — avalia o risco
3. **Messaging** (comunicação) — executa a ação

Todo o resto do sistema (pacientes, billing, tenants) existe pra sustentar essa tríade, não é o diferencial competitivo em si.

## Público-alvo

**Clínicas de estética e odontologia** — de consultório individual a redes com múltiplas unidades.

O nicho é estreito de propósito. O core do produto é predição de no-show, e um modelo de risco só fica bom quando o padrão de comportamento é homogêneo: quem falta numa consulta odontológica falta por motivos parecidos (medo do procedimento, tratamento longo, custo alto, procedimento eletivo). Misturar veterinária, psicologia ou barbearia na mesma base ensina ruído ao modelo e piora a previsão para todo mundo.

Além disso, "eu resolvo o no-show da sua clínica de odontologia" vende melhor do que "sirvo para qualquer agenda". Expandir para outras especialidades continua possível depois — mas com o modelo já calibrado, não antes.

### Perfil do cliente ideal

| Característica                          | Por quê                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| 2 a 15 profissionais                    | Abaixo disso a agenda cabe no papel; acima, já usa ERP robusto e a venda vira enterprise |
| Procedimentos eletivos e de ticket alto | Cada falta dói de verdade — é onde a predição se paga                                    |
| Agenda cheia com histórico de faltas    | Sem no-show recorrente, o diferencial não aparece                                        |
| Já usa WhatsApp para confirmar consulta | Faz na mão hoje; o produto automatiza um hábito existente em vez de criar um novo        |

### Quem **não** é público

- Clínicas sem recorrência de retorno (o modelo não tem histórico para aprender)
- Hospitais e redes grandes (exigem integração com sistemas legados, HL7, compliance pesado)
- Negócios de agenda avulsa e ticket baixo (o custo do software não se paga)

## Modelo de cobrança

> ⚠️ **Os valores abaixo são hipótese de trabalho, não pesquisa de mercado.** Servem para orientar a modelagem do módulo `billing` e precisam ser validados com clientes reais antes de virar oferta pública.
>
> 📊 Já existe uma primeira comparação com preço real de concorrente no [ROADMAP.md](./ROADMAP.md#impacto-no-modelo-de-cobrança) — e ela indica que **a cobrança por assento fica mais cara que a concorrência a partir de ~4 profissionais**. Reavaliar antes de implementar `billing`.

A cobrança é **por profissional ativo**, com assinatura mensal via Stripe. A lógica: o valor entregue cresce junto com o número de agendas gerenciadas, então o preço acompanha o tamanho da clínica em vez de punir quem está começando.

| Plano         | Preço (hipótese)                          | Profissionais      | O que inclui                                                                  |
| ------------- | ----------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| **Essencial** | R$ 149/mês                                | até 2              | Agenda, pacientes, lembretes automáticos de WhatsApp                          |
| **Clínica**   | R$ 289/mês + R$ 49 por profissional extra | a partir de 3      | Tudo do Essencial + predição de no-show e reativação inteligente              |
| **Rede**      | Sob consulta                              | múltiplas unidades | Tudo do Clínica + multi-unidade, relatórios consolidados, suporte prioritário |

### Decisões por trás dessa estrutura

- **A predição fica fora do plano de entrada.** É o diferencial competitivo e o que custa mais caro para operar (inferência + histórico). Deixá-la no plano mais barato entrega o core sem capturar valor.
- **Preço por profissional, não por agendamento.** Conta previsível no fim do mês; cobrar por volume pune justamente a clínica que mais usa o sistema.
- **Sem plano gratuito permanente.** O custo marginal por tenant não é zero (WhatsApp e inferência são pagos). Um trial por tempo limitado faz mais sentido do que free-forever.
- **WhatsApp pode virar custo repassado.** A Meta Cloud API cobra por conversa iniciada; se o volume crescer, vale separar em franquia + excedente em vez de embutir tudo na mensalidade.

### O que ainda precisa ser decidido

- [ ] Preço real, validado contra concorrentes e disposição a pagar
- [ ] Duração do trial (7/14/30 dias) e se exige cartão na entrada
- [ ] Franquia de mensagens WhatsApp por plano e preço do excedente
- [ ] Cobrança anual com desconto (melhora o caixa e reduz churn)
- [ ] O que acontece ao passar do limite de profissionais: bloqueia, cobra automático ou avisa?
- [ ] Política de downgrade e reembolso proporcional

## Módulos do sistema

| Módulo       | Responsabilidade                                                                 | É core?  | Status                                                             |
| ------------ | -------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `tenants`    | Cadastro de clínicas, planos, config de white-label                              | Suporte  | 🟢 CRUD do tenant + branding público (falta planos)                |
| `auth`       | Login, JWT, RBAC (dono, recepção, profissional)                                  | Suporte  | 🟢 Register, login, refresh/logout, RBAC por papel                 |
| `users`      | Gestão de usuários da clínica (recepção, profissionais)                          | Suporte  | 🟢 Listar, criar e atualizar (somente ADMIN)                       |
| `patients`   | Cadastro, histórico, prontuário básico                                           | Suporte  | 🟢 CRUD completo, busca, paginação, soft delete (falta prontuário) |
| `scheduling` | Agenda, profissionais, procedimentos                                             | **Core** | 🟢 Profissionais, procedimentos e agenda com conflito de horário   |
| `prediction` | Client HTTP pro serviço Python — risco de no-show, churn, sugestão de reativação | **Core** | ⚪ Não iniciado                                                    |
| `messaging`  | Disparo de WhatsApp, lembretes, confirmação, fila (BullMQ)                       | **Core** | 🟢 Lembrete D-1, confirmação por link, retry e lista de falhas     |
| `billing`    | Planos, assinatura Stripe, cobrança por profissional ativo                       | Suporte  | ⚪ Não iniciado                                                    |

## Como eles se relacionam

- `tenants` ← todo módulo consulta (multi-tenant)
- `auth` ← protege tudo
- `patients` → `scheduling` (agenda depende de saber quem é o paciente)
- `scheduling` → `prediction` (ao criar agendamento, pergunta o risco)
- `prediction` → `messaging` (se risco alto, dispara mensagem diferenciada)
- `scheduling` → `messaging` (lembrete padrão, confirmação, cancelamento)
- `billing` → `tenants` (plano ativo, limite de profissionais) e **gateia `prediction`**, que só é liberada a partir do plano Clínica

Regra prática que vale segurar: se você tirasse `prediction` e `messaging` do sistema, ainda sobraria um CRM de agenda genérico, sem diferencial. Isso confirma que são de fato o core — o resto é infraestrutura necessária mas replicável por qualquer concorrente.

## Ordem de construção

1. ~~**tenants + auth**~~ ✅ — sem isso nada funciona com segurança multi-tenant
2. ~~**patients**~~ ✅
3. ~~**scheduling**~~ ✅ — profissionais, procedimentos e agenda com conflito de horário
4. **messaging** — integração com WhatsApp (Meta Cloud API ou Evolution API), fila com BullMQ
5. **prediction** — só faz sentido depois de ter dado real de agendamento/no-show acontecendo em scheduling; no início pode até ser uma regra simples (ex: "mais de 2 faltas nos últimos 6 meses = risco alto") antes de virar modelo de ML de verdade
6. **billing** — último, porque não bloqueia o valor do produto sendo testado

## Stack

- NestJS + Prisma ORM v7 (driver adapter `@prisma/adapter-pg`) + PostgreSQL
- Auth via JWT (`@nestjs/jwt` + `passport-jwt`), senha com `bcrypt`
- Swagger em `/docs`

> 📐 **Vai escrever código aqui?** Leia [SKILLS.md](./SKILLS.md) — arquitetura em camadas, regras de multi-tenancy, padrão de DTOs/use-cases e as armadilhas já mapeadas (ordem de guards, timestamp de migration, `ConfigService` e tipos).
>
> 🗺️ **Quer saber o que vem a seguir?** O [ROADMAP.md](./ROADMAP.md) traz a análise competitiva e as prioridades revisadas.
>
> 🤖 **Trabalhando com IA neste repo?** O [SUBAGENTS.md](./SUBAGENTS.md) explica quando delegar tarefas a subagentes e quando isso só atrapalha.

## Rodando localmente

```bash
cp .env.example .env          # gere um JWT_SECRET novo (instrução no arquivo)
npm install
npx prisma migrate deploy     # aplica as migrations
npx prisma generate
npm run prisma:seed           # popula dados de desenvolvimento (opcional)
npm run start:dev
```

## Seed de desenvolvimento

```bash
npm run prisma:seed         # SEED_TYPE=full (padrão) — popula dados
npm run prisma:seed:clean   # SEED_TYPE=clean — zera as tabelas
npm run prisma:reset        # dropa o banco, reaplica migrations e roda o seed
```

O modo `full` cria **dois tenants de propósito** — é o mínimo para conseguir testar isolamento multi-tenant de verdade (garantir que uma clínica nunca enxerga dados da outra):

| Tenant          | Subdomain         | Usuários                    | Pacientes | Profissionais | Procedimentos | Agendamentos |
| --------------- | ----------------- | --------------------------- | --------- | ------------- | ------------- | ------------ |
| Clínica Sorriso | `clinica-sorriso` | 1 ADMIN, 2 STAFF, 1 inativo | 12        | 2             | 4             | 14           |
| Estética Bella  | `estetica-bella`  | 1 ADMIN, 1 STAFF            | 8         | 1             | 3             | 14           |

Os agendamentos misturam passado e futuro de propósito, incluindo `NO_SHOW` e `CANCELLED` — é esse histórico que o módulo `prediction` vai consumir, então o seed já o produz.

Todos os usuários usam a senha **`senha12345`**. Logins de ADMIN:

- `admin@clinicasorriso.com.br`
- `admin@esteticabella.com.br`
  recepcao@clinicasorriso.com.br — STAFF, senha senha12345 (mesma senha padrão de todos os usuários de seed)
  paulo@clinicasorriso.com.br — STAFF
  recepcao@esteticabella.com.br — STAFF (outro tenant)
  inativo@clinicasorriso.com.br — STAFF inativo (serve pra testar bloqueio de login)

O usuário `inativo@clinicasorriso.com.br` nasce com `isActive: false` — serve para verificar que login e access token são bloqueados. Os pacientes variam de propósito entre com/sem CPF e com/sem e-mail, cobrindo os campos opcionais.

> O seed é **idempotente**: faz upsert por chave natural (`subdomain`, `email`, `tenantId+cpf`), então rodar duas vezes não duplica nada nem apaga dados que você tenha criado à mão. Só o modo `clean` apaga.

## Quem é quem no sistema

| Entidade  | O que é                                                                   | Loga no sistema? |
| --------- | ------------------------------------------------------------------------- | ---------------- |
| `Tenant`  | A clínica. É a unidade de isolamento — todo dado pertence a um tenant     | —                |
| `User`    | Funcionário da clínica: dono (`ADMIN`) ou recepção/profissional (`STAFF`) | Sim              |
| `Patient` | Cliente atendido pela clínica                                             | Não              |

`User` e `Patient` são modelos **separados de propósito**: têm ciclos de vida, campos e regras de acesso diferentes. Juntar os dois obrigaria metade das colunas a serem nullable e transformaria toda regra de autorização num `if`.

## Fluxo de uso

### Onboarding de uma clínica

```
1. Clínica se cadastra   → POST /auth/register
                           cria Tenant + primeiro User (ADMIN) numa transação

2. ADMIN faz login       → POST /auth/login
                           recebe access token (15min) + refresh token (30 dias)

3. ADMIN monta a equipe  → POST /users
                           cria recepção/profissionais como STAFF

4. Equipe faz login      → POST /auth/login
```

### O que acontece em cada request protegido

```
Request com "Authorization: Bearer <access token>"
        │
        ▼
JwtAuthGuard        valida a assinatura do JWT
                    consulta o banco: usuário existe? está ativo?
                    preenche req.user = { userId, tenantId, role }
        │
        ▼
TenantContextGuard  lê req.user e preenche req.tenantContext
        │
        ▼
RolesGuard          (só nas rotas com @Roles) compara o papel exigido
        │
        ▼
Controller          @Tenant('tenantId') entrega o tenantId
        │
        ▼
Repository          toda query filtra por where: { tenantId }
```

O **isolamento entre clínicas** acontece no último passo: o `tenantId` nunca vem do body nem da URL, sempre do token. Uma clínica não consegue acessar dados de outra nem forjando o request — não há parâmetro para forjar.

### Sessão longa sem token longo

```
access token expira em 15min
        │
        ▼
front chama POST /auth/refresh com o refresh token
        │
        ▼
backend revoga o refresh usado e emite um par novo (rotação)
        │
        ▼
usuário segue logado sem repetir a senha, por até 30 dias
```

A rotação limita a janela de um refresh token roubado: assim que o usuário legítimo usar o dele, o roubado deixa de valer. E como o hash fica no banco, `logout` e `logout-all` revogam de verdade — diferente de JWT puro, que não dá para invalidar antes de expirar.

### Por que o branding é público

`GET /tenants/branding/:subdomain` não exige token porque a tela de login de `clinica-x.crivo.com` precisa da logo e das cores **antes** de existir qualquer sessão. Ele expõe apenas identidade visual (nome, logo, cores) — nada sensível.

## Autenticação e autorização

O acesso é multi-tenant e baseado em dois tokens:

- **access token** (JWT, 15min) — carrega `sub`, `tenantId` e `role`; vai no header `Authorization: Bearer <token>`
- **refresh token** (opaco, 30 dias) — persistido como hash na tabela `refresh_tokens`, permitindo revogação real

O access token é revalidado contra o banco a cada request, então **desativar um usuário tem efeito imediato**, sem esperar o token expirar.

### Cadeia de guards

Toda rota protegida usa `@UseGuards(JwtAuthGuard, TenantContextGuard)` — nessa ordem. O `JwtAuthGuard` popula `req.user`, e o `TenantContextGuard` deriva daí o `req.tenantContext`, consumido pelo decorator `@Tenant('tenantId')`.

> ⚠️ Isso **precisa** ser guard, não middleware: no Nest o middleware roda _antes_ dos guards, então um middleware jamais enxergaria o `req.user` produzido pelo `JwtAuthGuard`.

Para restringir por papel, some `RolesGuard` + `@Roles(Role.ADMIN)`:

```ts
@UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard)
@Roles(Role.ADMIN)
```

### Endpoints

| Método                  | Rota                                  | Acesso                                                                                      |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `POST`                  | `/auth/register`                      | Público — cria tenant + usuário ADMIN                                                       |
| `POST`                  | `/auth/login`                         | Público — retorna access + refresh token                                                    |
| `POST`                  | `/auth/refresh`                       | Público — rotaciona o par (o refresh antigo é revogado)                                     |
| `POST`                  | `/auth/logout`                        | Público — revoga o refresh informado                                                        |
| `POST`                  | `/auth/logout-all`                    | Autenticado — encerra todas as sessões do usuário                                           |
| `GET`                   | `/tenants/branding/:subdomain`        | Público — logo/cores para o front white-label                                               |
| `GET`                   | `/tenants/me`                         | Autenticado                                                                                 |
| `PATCH`                 | `/tenants/me`                         | **ADMIN** — inclui `aiMessagesEnabled` (mensagens com IA)                                   |
| `GET`                   | `/users`                              | **ADMIN**                                                                                   |
| `POST`                  | `/users`                              | **ADMIN** — cria recepção/profissional no tenant                                            |
| `PATCH`                 | `/users/:id`                          | **ADMIN** — nome, papel, ativar/desativar                                                   |
| `GET`                   | `/patients`                           | Autenticado — paginado (`page`, `perPage`) e com busca (`search` por nome, CPF ou telefone) |
| `GET`                   | `/patients/:id`                       | Autenticado                                                                                 |
| `POST`                  | `/patients`                           | Autenticado — só `name` e `phone` são obrigatórios                                          |
| `PATCH`                 | `/patients/:id`                       | Autenticado                                                                                 |
| `DELETE`                | `/patients/:id`                       | Autenticado — soft delete                                                                   |
| `GET`                   | `/professionals` `/professionals/:id` | Autenticado                                                                                 |
| `POST` `PATCH` `DELETE` | `/professionals`                      | **ADMIN**                                                                                   |
| `GET`                   | `/procedures` `/procedures/:id`       | Autenticado                                                                                 |
| `POST` `PATCH` `DELETE` | `/procedures`                         | **ADMIN**                                                                                   |
| `GET`                   | `/appointments`                       | Autenticado — filtra por `from`/`to`, `professionalId`, `patientId`, `status`               |
| `GET`                   | `/appointments/:id`                   | Autenticado                                                                                 |
| `POST`                  | `/appointments`                       | Autenticado — a recepção agenda                                                             |
| `PATCH`                 | `/appointments/:id/reschedule`        | Autenticado                                                                                 |
| `PATCH`                 | `/appointments/:id/status`            | Autenticado — confirmar, concluir, cancelar, marcar falta                                   |
| `GET`                   | `/messages`                           | Autenticado — histórico de envios (filtra por `status`, `from`, `to`)                       |
| `GET`                   | `/messages/failed`                    | Autenticado — **quem não recebeu; lista para a recepção ligar**                             |
| `GET`                   | `/c/:token`                           | **Público** — paciente confirma a presença pelo link do WhatsApp                            |
| `POST`                  | `/c/:token/confirm`                   | **Público** — mesmo efeito, para formulário                                                 |

## Como funciona a agenda

Três entidades sustentam o agendamento:

- **`Professional`** — quem atende. Pode ter `userId` (se acessa o sistema) ou não: em muitas clínicas só a recepção usa o software.
- **`Procedure`** — o que é feito. Carrega `durationMinutes` e `priceInCents`.
- **`Appointment`** — liga paciente + profissional + procedimento a uma janela de tempo.

O agendamento usa **horário livre**, não slots pré-gerados: a recepção marca em qualquer horário e o sistema valida sobreposição. É como clínica pequena de fato trabalha, e evita engessar encaixe.

### Regras aplicadas na criação

Quem chama informa apenas `startsAt` — **`endsAt` e `priceInCents` são derivados do procedimento**, nunca enviados pelo cliente:

- `endsAt = startsAt + procedure.durationMinutes`
- `priceInCents` é **copiado** do procedimento no ato. A tabela de preços muda com o tempo; o histórico não pode mudar junto.
- Paciente, profissional e procedimento são buscados **com filtro de tenant** — não dá para agendar usando o paciente de outra clínica.
- Não se agenda no passado.

### Conflito de horário

Dois intervalos colidem quando `inícioA < fimB` **e** `fimA > inícioB`. Encostar não é conflito: um atendimento que termina 14:00 e outro que começa 14:00 convivem.

Só `SCHEDULED`, `CONFIRMED` e `COMPLETED` ocupam a agenda — cancelamento e falta liberam o horário.

### Ciclo de vida

```
SCHEDULED ──> CONFIRMED ──> COMPLETED
    │             │
    ├─────────────┼───────> CANCELLED   (avisou que não vem)
    └─────────────┴───────> NO_SHOW     (simplesmente faltou)
```

`COMPLETED`, `CANCELLED` e `NO_SHOW` são **terminais** — viram histórico e não mudam mais.

> A distinção entre `CANCELLED` e `NO_SHOW` é o dado mais importante do sistema: são comportamentos diferentes, e é sobre eles que o módulo `prediction` vai treinar. Por isso `NO_SHOW` não pode ser marcado em agendamento futuro.

## Mensageria

Lembrete automático de consulta por WhatsApp, com confirmação pelo próprio paciente.

### Fluxo

```
Agendamento criado
        │
        ├──> falta mais que REMINDER_HOURS_BEFORE?
        │      └── sim ──> aviso "sua consulta foi marcada" sai AGORA
        │                  (com o link de confirmação junto)
        ▼
Lembrete entra na fila, agendado para D-1 (REMINDER_HOURS_BEFORE)
        │
        ▼
Worker envia ─── sucesso ──> mensagem SENT
        │
        └─── falha ──> retry 4x (backoff exponencial, ~4min)
                              │
                              └── esgotou ──> FAILED
                                                │
                                                ▼
                                   GET /messages/failed
                                   "ligue para estes pacientes"
        │
        ▼
Paciente toca no link  →  crivo-fe /c/:token  →  GET /c/:token (só lê)
                                                        │
                          toca em "Confirmar presença"  │
                                                        ▼
                                        POST /c/:token/confirm
                                        →  status vira CONFIRMED
                                        →  recibo enviado de volta
```

**Falha nunca é silenciosa.** É a diferença entre a recepção descobrir na hora e descobrir quando o paciente não aparece.

**Por que `GET` não confirma.** O WhatsApp (e qualquer app de mensagem) faz *pré-fetch* de todo link para montar a prévia. Enquanto o `GET` confirmava, a presença era dada como confirmada segundos depois do envio, sem o paciente ter aberto nada — reproduzido em teste em 04/08/2026. Só o `POST` muda estado; o `GET` é leitura pura.

**Duas mensagens, não uma.** Quem marca com dias de antecedência recebe o aviso na hora (para poder confirmar logo) **e** o lembrete na véspera (que é o que de fato reduz falta). Quando a consulta é em menos de `REMINDER_HOURS_BEFORE`, só o lembrete sai — mandar os dois seria duas mensagens quase idênticas com segundos de diferença.

**O painel acompanha sozinho.** Como o paciente confirma fora do sistema, Agenda e Mensagens se reconsultam a cada 20s (`LIVE_REFETCH_INTERVAL_MS` no `crivo-fe`) — o status vira `Confirmado` na tela da recepção sem ninguém dar F5.

### Providers

Trocados por env var, sem mudar código:

| `MESSAGING_PROVIDER` | O que faz                               | Quando usar                                                        |
| -------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| `fake` (padrão)      | Não envia nada; grava e loga a mensagem | Desenvolvimento e testes automatizados                             |
| `evolution`          | Evolution API — camada **não oficial**  | Só para ver a mensagem chegar no celular durante o desenvolvimento |
| `meta`               | WhatsApp Cloud API oficial              | **Produção**                                                       |

> ⚠️ **A Evolution API não vai a produção.** A Meta não autoriza esse tipo de conexão e bane o número em definitivo, sem aviso e sem recurso — e para a clínica o número banido _é_ a agenda. Ver [ROADMAP.md](./ROADMAP.md#a-dor-que-valida-o-produto).

Com `fake`, um telefone terminado em `0000` falha de propósito — é como se testa o caminho de erro sem infra nenhuma.

### Mensagens com IA (opcional, por clínica)

Quando `Tenant.aiMessagesEnabled = true`, o texto do lembrete é reescrito pelo DeepSeek antes do envio — tom mais natural e caloroso a cada mensagem, em vez do template fixo sempre igual. Nenhum concorrente do [panorama levantado](./ROADMAP.md#panorama-de-concorrentes) oferece isso na redação da mensagem (eles usam IA para prontuário/previsão, não para o texto em si).

```
PATCH /tenants/me
{ "aiMessagesEnabled": true }
```

**A IA só redige — nunca decide o fato.** O prompt do sistema proíbe inventar nome, data, horário ou alterar o link; e depois da geração, o `MessageComposerService` confere que os quatro aparecem _literalmente_ no texto antes de aceitá-lo. Se algum faltar, se a chamada falhar, ou se ela não responder em `AI_TIMEOUT_MS` (5s por padrão), cai **automaticamente e em silêncio** para o template fixo de sempre.

```
composeReminder()
  aiMessagesEnabled=false ────────────────────────────────► template fixo
  aiMessagesEnabled=true
        │
        ▼
  DeepSeek gera o texto (timeout 5s)
        │
        ├── sucesso E contém nome+data+hora+link ──► usa o texto da IA
        └── falhou, expirou, OU omitiu um dado ────► template fixo (log de warning)
```

Isso é uma continuação do mesmo princípio do resto do módulo: **o envio nunca atrasa nem falha por causa de uma dependência externa.** A IA é only-upside — funciona, o texto fica melhor; falha, o paciente recebe a mesma mensagem confiável de sempre.

Provider trocável (`AI_TEXT_GENERATOR` no `MessagingModule`) caso um dia troque de modelo — hoje só o `DeepSeekTextGenerator` existe.

### Dependência de infraestrutura

A fila usa Redis:

```bash
docker run -d --name crivo-redis -p 6379:6379 redis:7-alpine
```

### Bull Board — painel da fila

Painel web da fila BullMQ em **`/admin/queues`**: mostra jobs por estado
(waiting/active/completed/failed/delayed), o payload de cada um, o erro que
derrubou, e permite **retry ou remoção manual**.

```env
BULL_BOARD_USER="admin"
BULL_BOARD_PASSWORD="uma-senha"
```

Sem as duas variáveis a rota devolve **404** — de propósito. O board expõe
telefone e corpo de mensagem de paciente (PII), então ele nunca fica aberto
por padrão, ao contrário do Swagger em `/docs`.

É ferramenta de **desenvolvedor**, não de recepção: quem trabalha na clínica
acompanha os envios pela tela **Mensagens** do `crivo-fe`. Ver
[FILA.md](./FILA.md) para entender como a fila funciona por dentro.

## Próximos passos

As prioridades de produto — incluindo a análise competitiva que as embasa — vivem no **[ROADMAP.md](./ROADMAP.md)**. Em resumo:

1. **`messaging`** (WhatsApp + confirmação automática) — sem isso o produto não é comparável à concorrência
2. **Prontuário/anamnese** — requisito obrigatório para odonto e dermato
3. **Horário de trabalho e bloqueio de agenda** — hoje aceitamos agendar 3h da manhã de domingo
4. **`prediction`** — o diferencial, mas só depois da paridade mínima

O que segue abaixo são **dívidas técnicas** já mapeadas, que não competem com o roadmap de produto.

### Infraestrutura transversal

- [ ] Testes automatizados (hoje o projeto não tem nenhuma suíte configurada)
- [ ] CI (lint + typecheck + test) antes de qualquer deploy
- [x] ~~Seed de dados de desenvolvimento~~ ✅ ver [Seed de desenvolvimento](#seed-de-desenvolvimento)

### `scheduling`

- [ ] Visão de disponibilidade (`GET /professionals/:id/availability`) para o front sugerir horários livres
- [ ] Agendamento recorrente (tratamentos com várias sessões)

### `billing` — quando o modelo de cobrança for validado

- [ ] Modelar `Plan` e `Subscription` no schema, ligados a `Tenant`
- [ ] Integrar Stripe: checkout, webhook de status da assinatura, portal do cliente
- [ ] Guard de plano (`@RequiresPlan`) para gatear `prediction`
- [ ] Trial com expiração automática
- [ ] O script `stripe:sync` já existe no `package.json` apontando para `/stripe/webhook`, mas o endpoint ainda não existe

### Dívidas conhecidas de auth/tenants

- [ ] **`/auth/register` é público e cria um tenant novo a cada chamada** — qualquer pessoa cria uma clínica no sistema. Antes de ir a produção precisa virar cadastro por convite, atrás de checkout pago, ou nascer `isActive: false` aguardando aprovação
- [ ] `User.email` é `@unique` global, não por tenant — o mesmo e-mail não pode existir em duas clínicas diferentes
- [ ] Não há reset de senha nem troca de senha pelo próprio usuário (só o ADMIN altera nome/papel/status)
- [ ] Fluxo de convite por e-mail (hoje o ADMIN define a senha inicial e repassa manualmente)
- [ ] Limpeza periódica de `refresh_tokens` expirados/revogados
