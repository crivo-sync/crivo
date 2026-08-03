# Roadmap — Crivo FE (Painel)

Onde está o painel administrativo hoje e o que falta construir, módulo a módulo.

> Última atualização: 2026-08-02 (rev. 2).

---

## Onde estamos hoje

| Módulo | Status |
| --- | --- |
| Infraestrutura (`ky`, React Query, sessão) | 🟢 |
| Material UI (theme, providers, DataGrid) | 🟢 |
| `auth` (login, logout, proteção de rota) | 🟢 |
| Sidebar / menu (mini variant, filtrado por role) | 🟢 |
| `pacientes` (patients) | 🟢 CRUD completo, com máscara de telefone/CPF |
| `profissionais` (professionals) | 🟢 CRUD completo, com escrita restrita a ADMIN |
| `agenda` (appointments) | ⚪ Não iniciado |
| `procedimentos` (procedures) | ⚪ Não iniciado |
| `mensagens` (messaging) | ⚪ Não iniciado |
| `usuarios` (users) | ⚪ Não iniciado |
| `configuracoes` (tenants/me) | ⚪ Não iniciado |
| Perfil do usuário (senha, avatar) | ⚪ Não iniciado — backend não tem os endpoints |
| Testes automatizados | 🔴 Nenhum (sem infra) |

A arquitetura está validada ponta a ponta: `pacientes` implementa todas as camadas do `SKILLS.md` contra o crivo-be real e serve de molde para as demais features. O `/painel` (home do admin) ainda é um placeholder.

---

## Infraestrutura implementada

### Dados e sessão

- **`src/config/api.ts`** — instância `ky` única apontando **direto** para o crivo-be (`NEXT_PUBLIC_API_URL`). Sem proxy, sem BFF. Hook `beforeError` troca a mensagem crua do ky pela mensagem que a API devolve no corpo.
- **`src/lib/session.ts`** — `getSession()` decodifica o payload do JWT para decisões de UI (role, nome); `getServerSession()` devolve o `accessToken` para as Server Actions repassarem à camada `http/`.
- **`src/components/providers/query-provider.tsx`** — `QueryClientProvider` instanciado por componente, para não vazar cache entre requisições no SSR.

### Interface

- **Material UI** é a biblioteca de componentes do admin. O site institucional (`(website)`) segue em Tailwind — os dois não se misturam.
- **`src/config/mui-theme.ts`** — paleta índigo da marca, fonte Space Grotesk (a mesma do site, carregada uma vez no layout raiz) e locale `pt-BR`. Sem `styleOverrides`: o visual é o padrão do MUI.
- **`src/components/providers/mui-provider.tsx`** — `AppRouterCacheProvider` (v16, casando com o Next 16) + `ThemeProvider` + `CssBaseline` + `SnackbarProvider`.
- **`src/components/providers/snackbar-provider.tsx`** — notificações globais via `useSnackbar()`.
- **`src/components/data-grid/`** — wrapper genérico do MUI X DataGrid que amarra a paginação server-side da API ao modelo do componente. Sem lógica de domínio: cada feature passa suas `columns` e `rows`.
- **`src/app/(dashboard)/_components/dashboard-shell.tsx`** — Mini variant drawer (sidebar colapsável) + AppBar.

### Features

- **`src/features/auth/`** — login, logout e resolução do nome de exibição.
- **`src/features/patients/`** — CRUD completo (listagem paginada com busca, criar, editar, remover, telefone/CPF com máscara de digitação). **É a referência de implementação**: replicar sua estrutura ao criar as próximas.
- **`src/features/professionals/`** — CRUD completo com **escrita restrita a ADMIN**. É a referência para features com ação por papel: `useIsAdmin()` decide o que a UI mostra, `requireAdmin()` barra na Server Action, e o backend (`@Roles(ADMIN)`) é a autoridade final.
- **`src/components/providers/session-provider.tsx`** — expõe a sessão (papel, nome) aos componentes client via `useSession()` / `useIsAdmin()`. Só para decisões de UI; não é barreira de segurança.
- **`src/components/masked-text-field/`** + **`src/lib/br-masks.ts`** — máscara de telefone (fixo/celular) e CPF via `react-imask`, genéricos para qualquer feature que precise. Ver nota abaixo — vale ler antes de adicionar uma nova máscara com padrões de prefixo comum.

---

## Armadilha resolvida: máscara dinâmica do react-imask

Telefone aceita 10 dígitos (fixo) ou 11 (celular) — parecia natural usar
`MaskedDynamic` do imask com duas variantes. Isso quebrou de duas formas
antes de funcionar, ambas silenciosas (sem erro de tipo, só comportamento
errado ou warning em runtime):

1. **Dígito perdido**: o `dispatch` padrão do imask escolhe a máscara pelo
   peso de dígitos aceitos e **mantém a escolha anterior** — digitar um
   celular trava na máscara de 10 dígitos assim que eles entram, cortando o
   11º dígito (`11987654321` virava `(11) 93333-2222`, perdendo o `2` final).
   Corrigido com um `dispatch` customizado que decide sempre pela contagem
   total de dígitos já digitados, ignorando qual máscara estava ativa.
2. **Máscara não reconhecida**: `dispatch` é opção **irmã** de `mask` no
   objeto de options do imask (`{ mask: [...], dispatch: fn }` no nível
   raiz) — um wrapper aninhado faz `maskedClass()` não reconhecer o formato
   e cair em passthrough sem máscara nenhuma (warning `Mask not found for
   mask` no console, fácil de não notar).
3. Depois de corrigir os dois acima, o valor que chegava ao Zod ainda vinha
   **com** a máscara (`"(11) 98765-4321"`), e o schema (`\d{10,11}`) sempre
   rejeitava. Faltava `unmask` na integração — sem ele, `onAccept` entrega
   o valor formatado, não os dígitos crus que a API espera.

Ver `src/lib/br-masks.ts` (comentários no `PHONE_MASK`) e
`src/components/masked-text-field/index.tsx` para a implementação final.
Qualquer máscara nova com padrões de prefixo comum (não só telefone) deve
partir desse molde, não da API "ingênua" do imask.

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

**Prioridade**: sobe para alta assim que houver um fluxo real de convite/login de `STAFF` a testar.

---

## Próximos passos

### Fase 1 — Demais features de negócio

Replicar o molde de `pacientes`, na ordem abaixo (das menos para as mais acopladas):

1. ~~**`profissionais`** (`professionals`)~~ — ✅ **feito**. Estabeleceu o padrão de ação por papel: `SessionProvider` + `useIsAdmin()` na UI, `requireAdmin()` nas Server Actions de escrita.
2. **`procedimentos`** (`procedures`) — mesmo padrão de `profissionais` (preço e duração alimentam o formulário da agenda depois).
3. **`agenda`** (`appointments`) — a mais complexa e a que justifica o produto. Depende das três anteriores para os selects. Inclui fluxos que não existem em nenhum CRUD atual: `PATCH :id/reschedule`, `PATCH :id/status` e visualização por calendário/dia.
4. **`mensagens`** (`messaging`) — só leitura (`GET /messages`, `GET /messages/failed`); o disparo é automático no backend. A lista de falhas é a feature de maior valor: é o "avisar a recepção quando algo falha" do ROADMAP do backend.
5. **`usuarios`** (`users`) — CRUD restrito a ADMIN. Referência de **página inteira** protegida por role (hoje só escondemos o item de menu; a rota em si continua acessível por URL direta).
6. **`configuracoes`** (`tenants/me`) — leitura para todos, edição restrita a ADMIN.
7. **Perfil do usuário logado** (trocar senha, avatar, dados próprios) — ver seção dedicada abaixo. Backend não tem nada disso hoje; é o item com maior trabalho de API novo antes de qualquer UI.

### Perfil do usuário logado (trocar senha, avatar, etc.)

Hoje o `UserMenu` na sidebar só mostra nome + botão de sair — não existe
nenhuma tela de "meu perfil". Levantamento do que falta, por trás:

**Backend (nada disso existe hoje):**

- `User` no Prisma (`crivo-be/prisma/schema.prisma`) não tem campo de
  avatar/foto. Precisa de uma coluna (`avatarUrl`, provavelmente apontando
  pra um bucket de storage — decidir qual antes de modelar) e de um
  endpoint de upload, já que a API hoje só troca JSON, não multipart.
- **Trocar a própria senha**: não existe endpoint. `PATCH /users/:id`
  (`UpdateUserDto`) só aceita `name`, `role`, `isActive` — sem `password` —
  e além disso é `@Roles(ADMIN)`, então nem um STAFF trocando a própria
  senha passaria no guard hoje. Precisa de uma rota nova, tipo
  `PATCH /users/me/password`, autenticada mas sem `@Roles`, pedindo a senha
  atual + a nova (confirmar contra o hash antes de trocar).
- **Ver/editar os próprios dados** (nome, e-mail): mesma lacuna do
  `GET /users/me` já registrada acima — sem esse endpoint, não dá nem para
  a tela carregar os dados do próprio usuário sem ser ADMIN.

**Frontend (a fazer depois que o backend acima existir):**

- Nova feature `src/features/profile/` (ou uma seção dentro de `auth/`,
  a decidir) com: form de dados básicos, form de troca de senha (senha
  atual + nova + confirmação, validado com Zod), upload de avatar.
- `UserMenu` ganha um item "Meu perfil" linkando pra essa página/dialog.
- Se avatar existir, o `getInitials()` de `UserMenu` vira fallback (mostra
  a foto quando houver, iniciais quando não houver).

**Prioridade**: baixa — depende de decisões de produto (onde fica o avatar,
se STAFF pode trocar a própria senha ou se isso é sempre via convite/reset)
que ainda não foram tomadas. Não teve pedido de usuário real até agora.

### Fase 2 — Robustez de sessão e UX

- **Refresh automático** — o access token expira em 15 min e não há renovação: o usuário é deslogado no meio do trabalho. Implementar detecção de 401 que chama `POST /auth/refresh` com o cookie `crivo_refresh` e repete a requisição antes de propagar a falha. **É o item de maior impacto percebido nesta fase.**
- **⚠️ Bloquear TELAS inteiras por papel — ainda PENDENTE, não esquecer**:
  A proteção de **ações** já existe desde `profissionais` (UI via `useIsAdmin()`, Server Action via `requireAdmin()`, backend via `@Roles`). O que falta é a proteção da **rota em si**.
  - `(dashboard)/layout.tsx` só verifica se **existe sessão** (`redirect("/login")`), nunca o papel. O menu esconde "Usuários" para STAFF (`_data/nav-items.ts`), mas isso é cosmético: `/painel/usuarios` responderá normalmente para um STAFF que digite a URL direto — assim que essa tela existir.
  - **Onde resolver**: em telas cujo conteúdo inteiro é ADMIN-only, o `page.tsx` (ou um `layout.tsx` do segmento) chama `getSession()` e faz `redirect()` se `session.role !== "ADMIN"`.
  - **Não se aplica a `profissionais`/`procedimentos`**: neles a leitura é liberada por design (o backend não usa `@Roles` no GET), então a tela deve mesmo abrir para STAFF — só as ações somem. O caso real é `usuarios`, onde até a listagem é ADMIN-only.
  - **Fazer junto de `usuarios`** (item 5 da Fase 1), que é a primeira tela com esse requisito.
- **`GET /users/me`** no backend (ver seção acima).
- **Tratamento de erro consistente** — falta um componente `<ErrorServer />` (citado no `SKILLS.md`) para os estados de falha; hoje cada feature trata por conta própria.
- **Home do painel** — `/painel` é um placeholder. Definir o que mostra: agenda do dia, horários em risco, mensagens que falharam.

### Fase 3 — Qualidade

- **Não há infraestrutura de teste no projeto** (sem Vitest/Jest, sem Testing Library, sem script `test`). O `SKILLS.md` marca testes como critério de aceitação obrigatório, então hoje **nenhuma feature atende ao próprio padrão** que documentamos. Configurar a base é pré-requisito para o resto desta fase.
- Testes para `auth` (actions, hooks) e `patients` (o molde — testá-lo primeiro define o padrão para as demais).
- Testes para `SidebarNav` (filtragem por role) e `UserMenu`.

---

## Débitos técnicos conhecidos

- **`src/components/ui/`** mistura componentes do site (`header`, `footer`, `logo`, `scroll-reveal`) com o que sobrou da fase shadcn. Como o admin não usa mais nada dali, faria sentido renomear para algo como `src/components/website/`.
