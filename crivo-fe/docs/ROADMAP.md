# Roadmap — Crivo FE (Painel)

Onde está o painel administrativo hoje e o que falta construir, módulo a módulo.

> Última atualização: 2026-07-31.

---

## Onde estamos hoje

| Módulo | Status |
| --- | --- |
| Infraestrutura (`ky`, proxy autenticado, React Query) | 🟢 |
| `auth` (login, logout, proteção de rota) | 🟢 |
| Sidebar / menu (filtrado por role) | 🟢 |
| `agenda` (appointments) | ⚪ Não iniciado |
| `pacientes` (patients) | ⚪ Não iniciado |
| `profissionais` (professionals) | ⚪ Não iniciado |
| `procedimentos` (procedures) | ⚪ Não iniciado |
| `mensagens` (messaging) | ⚪ Não iniciado |
| `usuarios` (users) | ⚪ Não iniciado |
| `configuracoes` (tenants/me) | ⚪ Não iniciado |

O esqueleto do painel está pronto: autenticação de ponta a ponta e navegação já funcionam contra o crivo-be real. **Nenhuma feature de negócio foi implementada ainda** — o `/painel` é uma página placeholder.

---

## Infraestrutura implementada

- **`src/config/api.ts`** — instância `ky` apontando para `/api/backend` (nunca direto para o crivo-be). `credentials: "include"` garante que o cookie de sessão viaje em toda chamada.
- **`src/app/api/backend/[...path]/route.ts`** — proxy autenticado: lê o cookie httpOnly `crivo_session`, injeta `Authorization: Bearer` e repassa para o crivo-be (`BACKEND_API_URL`).
- **`src/components/providers/query-provider.tsx`** — `QueryClientProvider`, instanciado por componente para não vazar cache entre requisições no SSR.
- **`src/lib/session.ts`** — `getSession()` roda no server, decodifica o payload do JWT do cookie (sem verificar assinatura — o backend é sempre a autoridade real via proxy) e expõe `{ userId, tenantId, role, displayName }`.
- **`src/features/auth/`** — feature completa seguindo `docs/SKILLS.md` (schemas Zod, actions, http, hooks, components). Cobre login, logout e resolução do nome de exibição.
- **`src/app/(dashboard)/`** — layout com sidebar (filtrada por role), `UserMenu` (nome + logout) e proteção de rota (`redirect("/login")` sem sessão).
- **`src/app/(auth)/login/`** — página de login, fora do layout do painel e do site institucional.

---

## Lacuna conhecida: não existe "quem sou eu" no backend

O JWT carrega só `{ sub, tenantId, role }` — sem nome nem e-mail. `POST /auth/login` também só devolve `{ accessToken, refreshToken }`. Para mostrar o nome do usuário logado na sidebar, `loginAction` hoje:

1. Decodifica o `sub` do access token recém-emitido.
2. Chama `GET /users` (que é **`@Roles(Role.ADMIN)`**) e procura o próprio id na lista.
3. Se a busca falhar (usuário é STAFF, ou qualquer erro de rede) — cai no e-mail digitado no formulário como fallback.

**Isso funciona para o usuário ADMIN de teste, mas é uma solução de contorno**: todo usuário `STAFF` vê o próprio e-mail em vez do nome, silenciosamente, porque não tem permissão de chamar `GET /users`.

### Proposta para o crivo-be

Criar `GET /users/me`:

- Autenticado (`JwtAuthGuard` + `TenantContextGuard`), **sem** `@Roles(...)` — qualquer usuário autenticado pode ver os próprios dados, independente do role.
- Retorna o mesmo formato de `UserResponseDto` (`id`, `name`, `email`, `role`, `isActive`, `createdAt`), usando `@Tenant('userId')` para buscar o próprio registro (nunca um `:id` de rota, para não abrir a possibilidade de consultar outro usuário).
- No frontend, troca `getUsers(accessToken).find(...)` em `login-action.ts` por uma chamada direta a `GET /users/me` — remove o filtro client-side e o fallback deixa de ser necessário no caminho feliz (continua existindo para falhas de rede).

**Prioridade**: baixa enquanto só testamos com usuários ADMIN. Sobe para alta assim que houver um fluxo real de convite/login de `STAFF` a testar.

---

## Próximos passos

### Fase 1 — Primeira feature de negócio (referência para as demais)

Escolher **uma** feature para servir de modelo de como as camadas do `SKILLS.md` se encaixam com dados reais (paginação, filtros, mutations) — as candidatas mais simples do backend:

1. **`pacientes`** (`patients`) — CRUD completo, sem dependência de outro módulo. Bom ponto de partida: cadastro, listagem com busca/paginação, edição, exclusão (soft delete).
2. **`profissionais`** (`professionals`) — CRUD simples, mas com `@Roles(ADMIN)` nas mutações — bom para validar o padrão de esconder/desabilitar ações por role dentro de uma página (não só no menu).

Depois da primeira feature validada ponta a ponta (list + create + edit + delete, com testes), as demais seguem o mesmo molde:

3. **`procedimentos`** (`procedures`) — mesmo padrão de `profissionais`.
4. **`agenda`** (`appointments`) — a mais complexa: depende de `patients`, `professionals` e `procedures` já existirem no frontend para os selects do formulário. Inclui fluxos extras (`reschedule`, `status`).
5. **`mensagens`** (`messaging`) — leitura (`GET /messages`, `GET /messages/failed`); sem mutations por enquanto (o disparo é automático no backend).
6. **`usuarios`** (`users`) — CRUD restrito a ADMIN; referência de página inteira restrita por role, não só item de menu escondido.
7. **`configuracoes`** (`tenants/me`) — leitura para todos, edição restrita a ADMIN.

### Fase 2 — Robustez de sessão

- **Refresh automático**: hoje o access token expira em 15min e não há renovação — o usuário precisa logar de novo. Avaliar middleware ou interceptor no proxy (`route.ts`) que detecta 401, chama `POST /auth/refresh` com o `crivo_refresh` cookie e repete a requisição original antes de propagar a falha.
- **`GET /users/me`** no backend (ver seção acima) — resolve nome corretamente para STAFF.
- **Loading/erro consistentes**: hoje `src/config/api.ts` tem tratamento de erro genérico; falta um componente `<ErrorServer />` (citado no `SKILLS.md`) e um padrão de skeleton/loading para as listagens.

### Fase 3 — Qualidade

- Testes unitários para a feature `auth` (hooks, actions) — nenhum existe ainda, e o `SKILLS.md` marca isso como critério de aceitação obrigatório.
- Testes para `SidebarNav` (filtragem por role) e `UserMenu`.
