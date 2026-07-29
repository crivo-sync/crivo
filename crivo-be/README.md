# Crivo

API backend do Crivo — plataforma whitelabel de gestão para clínicas de estética, odontologia e afins.

## O core do sistema

O core não é "cadastro de paciente" nem "agenda" isoladamente — é o motor de decisão que liga **agendamento + comunicação + predição**. O sistema sabe quando um horário está em risco de virar buraco na agenda (falta, cancelamento) e age sozinho pra preencher ou evitar isso.

Na prática, o core é a tríade:

1. **Scheduling** (agenda) — gera o evento
2. **Prediction** (IA) — avalia o risco
3. **Messaging** (comunicação) — executa a ação

Todo o resto do sistema (pacientes, billing, tenants) existe pra sustentar essa tríade, não é o diferencial competitivo em si.

## Módulos do sistema

| Módulo | Responsabilidade | É core? | Status |
| --- | --- | --- | --- |
| `tenants` | Cadastro de clínicas, planos, config de white-label | Suporte | 🟡 Parcial — model existe, criado hoje só via `auth/register` |
| `auth` | Login, JWT, RBAC (dono, recepção, profissional) | Suporte | 🟢 Implementado (register + login, guards) |
| `patients` | Cadastro, histórico, prontuário básico | Suporte | 🟡 Parcial — só listagem (`GET /patients`) |
| `scheduling` | Agenda, slots, profissionais, procedimentos | **Core** | ⚪ Não iniciado |
| `prediction` | Client HTTP pro serviço Python — risco de no-show, churn, sugestão de reativação | **Core** | ⚪ Não iniciado |
| `messaging` | Disparo de WhatsApp/SMS, templates, fila (BullMQ) | **Core** | ⚪ Não iniciado |
| `billing` | Planos, cobrança por profissional ativo | Suporte | ⚪ Não iniciado |

## Como eles se relacionam

- `tenants` ← todo módulo consulta (multi-tenant)
- `auth` ← protege tudo
- `patients` → `scheduling` (agenda depende de saber quem é o paciente)
- `scheduling` → `prediction` (ao criar agendamento, pergunta o risco)
- `prediction` → `messaging` (se risco alto, dispara mensagem diferenciada)
- `scheduling` → `messaging` (lembrete padrão, confirmação, cancelamento)
- `billing` → só consulta `tenants` (isolado, quase não conversa com o resto)

Regra prática que vale segurar: se você tirasse `prediction` e `messaging` do sistema, ainda sobraria um CRM de agenda genérico, sem diferencial. Isso confirma que são de fato o core — o resto é infraestrutura necessária mas replicável por qualquer concorrente.

## Ordem de construção

1. **tenants + auth** — sem isso nada funciona com segurança multi-tenant
2. **patients** — já fizemos boa parte
3. **scheduling** — depende de patients
4. **messaging** — integração com WhatsApp (Meta Cloud API ou Evolution API), fila com BullMQ
5. **prediction** — só faz sentido depois de ter dado real de agendamento/no-show acontecendo em scheduling; no início pode até ser uma regra simples (ex: "mais de 2 faltas nos últimos 6 meses = risco alto") antes de virar modelo de ML de verdade
6. **billing** — último, porque não bloqueia o valor do produto sendo testado

## Stack

- NestJS + Prisma ORM v7 (driver adapter `@prisma/adapter-pg`) + PostgreSQL
- Auth via JWT (`@nestjs/jwt` + `passport-jwt`), senha com `bcrypt`
- Swagger em `/docs`

## Próximos passos

### 1. Fechar `tenants` e `auth` de vez
- [ ] Extrair um `TenantsModule` próprio (hoje o `Tenant` só é criado dentro de `AuthModule#register`; não há listagem/edição de tenant nem endpoint de config de white-label)
- [ ] RBAC real: hoje só existe `Role` (`ADMIN`/`STAFF`) no schema, mas nenhum guard checa role — qualquer usuário autenticado acessa qualquer rota protegida
- [ ] Endpoint de convite/criação de novo `User` dentro de um tenant existente (hoje só o `register` cria tenant+admin juntos; não dá pra adicionar recepção/profissional depois)
- [ ] Refresh token / revogação (hoje o JWT não tem refresh, só expira em 24h)

### 2. Completar `patients`
- [ ] `POST /patients` (criar), `PATCH /patients/:id` (atualizar telefone/email), `GET /patients/:id`
- [ ] Constraint `@@unique([tenantId, cpf])` no schema — hoje nada impede duplicar CPF no mesmo tenant
- [ ] Histórico/prontuário básico (ainda não modelado)

### 3. Iniciar `scheduling` (próximo core real)
- [ ] Modelar `Professional`, `Procedure`, `Slot`/`Appointment` no schema
- [ ] CRUD de agendamento vinculado a `Patient` + `Tenant`
- [ ] Regras de conflito de horário por profissional

### 4. Infraestrutura transversal
- [ ] Testes automatizados (hoje o projeto não tem nenhuma suíte configurada)
- [ ] CI (lint + typecheck + test) antes de qualquer deploy
- [ ] Seed de dados de desenvolvimento (tenant + usuário de teste), já que hoje todo teste manual exige `register` via curl/Swagger
