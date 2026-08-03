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
| `agenda` (appointments) | 🟢 Tabela + criar/reagendar/mudar status. Aberto a ADMIN e STAFF (sem `@Roles`) |
| `procedimentos` (procedures) | 🟢 CRUD completo, com escrita restrita a ADMIN |
| `mensagens` (messaging) | 🟢 Histórico + aba de falhas. Só leitura, aberto a ADMIN e STAFF |
| `usuarios` (users) | 🟢 CRUD (sem delete, soft via `isActive`). Restrito a ADMIN — 1ª tela com bloqueio de rota inteira |
| `configuracoes` (tenants/me) | 🟢 Leitura para todos, edição restrita a ADMIN |
| Perfil do usuário (leitura no header + `/painel/perfil`) | 🟡 Somente leitura — edição depende de endpoints novos no backend |
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
2. ~~**`procedimentos`** (`procedures`)~~ — ✅ **feito**. Mesmo padrão de `profissionais` 1:1 (RBAC, paginação, dialogs). Formulário guarda preço em reais na UI e converte para centavos (`src/lib/currency.ts`) antes de enviar ao backend — o preço/duração já ficam prontos para alimentar o formulário da agenda.
3. ~~**`agenda`** (`appointments`)~~ — ✅ **feito** (versão tabela, não calendário — ver nota abaixo). Tabela paginada com filtro por profissional/status, dialog de criação (selects de paciente/profissional/procedimento via `useAppointmentFormOptions`, que reaproveita as três Server Actions `get*Action` já existentes com `perPage: 100`), reagendamento (`PATCH :id/reschedule`) e menu de transição de status (`PATCH :id/status`) — confirmar/concluir/marcar falta disparam direto, cancelar abre dialog pedindo motivo. Sem `@Roles` no backend: ADMIN e STAFF têm acesso igual (leitura e escrita), diferente de `profissionais`/`procedimentos`.
   - **Detalhe de API que importa manter em mente**: `POST`/`PATCH :id/reschedule`/`PATCH :id/status` devolvem só IDs nas relações (`AppointmentResponseDto.fromPlain`), não os nomes de paciente/profissional/procedimento — só o `GET` de listagem popula isso (`fromEntity`). Por isso as mutations em `src/features/appointments/hooks/` tipam como `void` e sempre disparam `invalidateQueries` para re-buscar a lista, em vez de tentar usar a resposta da mutation para atualizar a UI otimisticamente.
   - **Pendente para uma v2**: visualização por calendário/dia (grade de horários, drag-to-reschedule) — a v1 ficou como tabela, mesma UX das demais features, por ser mais rápida de entregar. Fica registrado aqui caso vire prioridade depois.
   - **Refatoração de campos de formulário** (motivada pelos selects de paciente/profissional/procedimento do dialog de criação, que ficavam com o valor mal legível no `TextField select` nativo): novo componente genérico `EntityAutocomplete` (`src/components/entity-autocomplete/`), usado nos 3 selects de entidade do form de criação e no select de profissional do reagendamento; e adoção de `@mui/x-date-pickers` (`DateTimePicker` + `dayjs`, locale `pt-br` via `LocalizationProvider` em `MuiProvider`) no lugar do `<TextField type="datetime-local">`, que renderizava feio e inconsistente quando vazio (`dd/mm/yyyy, --:--`). Ambos os padrões documentados no `SKILLS.md` para as próximas features (`mensagens`, `usuarios`) reaproveitarem.
4. ~~**`mensagens`** (`messaging`)~~ — ✅ **feito**. Só leitura (`GET /messages`, `GET /messages/failed`); o disparo é automático no backend. Página com duas abas (`MuiTabs`): "Histórico" (tabela paginada, filtro por status **e período** — `DatePicker` "De"/"Até", os três filtros que o Swagger de `GET /messages` documenta) e "Falhas — ligar para o paciente" (badge com a contagem na própria aba, estado de sucesso "nenhuma falha" quando vazio) — é a feature de maior valor: o "avisar a recepção quando algo falha" do ROADMAP do backend. Sem `@Roles`: ADMIN e STAFF têm acesso igual. Sem coluna de ações (é histórico, não há CRUD); o corpo da mensagem trunca com `noWrap` + `Tooltip` mostrando o texto completo, já que vem com emoji e quebras de linha reais do template do backend.
   - **Dois bugs achados e corrigidos na revisão** (não específicos de `mensagens` — os dois já existiam de origem em toda tabela/filtro de data do painel):
     1. **Ordenação client-side enganosa**: clicar no header de qualquer coluna do `AppDataGrid` mostrava seta de ordenação + indicador de coluna focada, mas como a paginação é sempre server-side (sem `sortingMode="server"` implementado em lugar nenhum), isso só reordenava a página atual — visualmente quebrado e funcionalmente errado. Fix centralizado no wrapper: `AppDataGrid` agora passa `disableColumnSorting={true}` por padrão (`src/components/data-grid/index.tsx`), então nenhuma feature precisa lembrar de desabilitar isso coluna por coluna.
     2. **`DatePicker`/`DateTimePicker` com data parcial quebrava o filtro em silêncio**: `onChange` dispara a cada segmento digitado (dia/mês/ano), e o `value` durante a digitação é um `Dayjs` **inválido**, não `null`. `AppointmentFilters`/`MessageFilters` chamavam `.toISOString()` direto nesse valor, o que lança `RangeError: Invalid time value` — capturado só por um `console.error`, sem UI de erro, então o filtro simplesmente não aplicava e o usuário não entendia por quê. Fix: checar `value.isValid()` antes de converter (documentado em `SKILLS.md`, seção "Campo de data/hora").
5. ~~**`usuarios`** (`users`)~~ — ✅ **feito**. CRUD restrito a ADMIN — mas diferente de todas as features anteriores, aqui até a **leitura** é `@Roles(ADMIN)` no backend (`GET /users` não abre pra STAFF). Por isso é a primeira tela do painel com bloqueio de **página inteira**: `usuarios/page.tsx` (Server Component) chama `getSession()` e faz `redirect("/painel")` se `role !== "ADMIN"`, antes de qualquer dado ser buscado — confirmado com um STAFF real digitando a URL direto (sem passar pelo menu, que já escondia o item, mas isso sozinho não bloqueava nada). Outras particularidades:
   - **Sem `DELETE`**: o backend não exclui usuários, só desativa (`PATCH { isActive: false }`) — preserva o histórico de agendamentos/ações que aquele usuário criou. "Remover" na UI (`ToggleUserActiveDialog`) é sempre um update, nunca uma exclusão real; o mesmo hook (`useToggleUserActive`) serve para reativar.
   - **Auto-proteção espelhada no frontend**: o backend recusa (`400`) o admin logado tentando rebaixar ou desativar a própria conta (`UpdateUserUseCase`, `isSelf` check — evita ficar trancado fora do tenant). A UI (`buildUserColumns`, comparando `row.id` com `session.userId` de `useSession()`) já nem oferece a ação "Desativar" na própria linha, só "Editar".
   - **`GET /users` não é paginado** — devolve o array inteiro da clínica (lista pequena por natureza). `AppDataGrid` usa `hideFooter` em vez do fluxo de paginação server-side das outras tabelas.
   - **Form único para criar/editar**: `email`/`password` só existem em `CreateUserDto` (o backend não aceita trocar e-mail nem senha de terceiro via `PATCH`), então `userFormSchema` os deixa opcionais e o componente valida manualmente no `onSubmit` quando `!isEditing` — evita bifurcar o resolver do react-hook-form em runtime (frágil, o tipo do form nunca bate exatamente com um schema trocado dinamicamente).
6. ~~**`configuracoes`** (`tenants/me`)~~ — ✅ **feito**. Completa a feature `src/features/tenant/`, que já existia parcialmente (só leitura, usada no header e em `/painel/perfil`). Um form único sempre visível (sem tabela — não é uma lista, é o registro único do tenant): `GET /tenants/me` é aberto a ADMIN e STAFF, `PATCH /tenants/me` é `@Roles(ADMIN)`. Para STAFF, os campos aparecem preenchidos e `disabled`, sem o botão "Salvar" (padrão diferente de `usuarios`: aqui a leitura fica visível mesmo sem poder editar, porque o backend também trata GET e PATCH com guards distintos). Detalhes:
   - **Preview de cor**: `ColorField` (`src/features/tenant/components/TenantSettings/color-field.tsx`), um `TextField` com um círculo mostrando a cor renderizada quando o hex digitado é válido — extraído como componente local (não global) porque só as duas cores da identidade visual do tenant usam isso hoje.
   - **Telefone com máscara**: reaproveita `MaskedTextField` + `PHONE_MASK` de `src/lib/br-masks.ts`, mesmo padrão de `pacientes`/`profissionais`.
   - **Bug corrigido nesta feature**: `defaultValues: {}` no `useForm` fazia os `TextField` controlados nascerem com `value={undefined}` e só ganharem valor real depois que `useTenant()` resolvia e o `useEffect` chamava `reset()` — React acusa isso como "a component is changing an uncontrolled input to be controlled". Fix: `defaultValues` com strings vazias explícitas (`EMPTY_VALUES`), mesmo padrão já usado nos outros formulários do projeto — só não tinha sido aplicado aqui porque o form não tem um "modo criação" com valores vazios óbvios (é sempre edição de um registro que já existe).
7. **Perfil do usuário logado** (trocar senha, avatar, dados próprios) — ver seção dedicada abaixo. Backend não tem nada disso hoje; é o item com maior trabalho de API novo antes de qualquer UI.

### Perfil do usuário logado (trocar senha, avatar, etc.)

**Feito**: o header (`TopBarUserMenu`) mostra nome da clínica (`GET
/tenants/me`, nova feature `src/features/tenant/`), nome do usuário e papel
(`roleLabel()` em `session-provider.tsx`), com dropdown ("Meu perfil" /
"Sair"). `/painel/perfil` existe e mostra nome, papel e clínica em modo
somente-leitura — sem formulário de edição, porque o backend ainda não
oferece nada editável (ver lacunas abaixo). O `UserMenu` da sidebar continua
como estava (nome + sair), sem duplicar o dropdown novo.

Levantamento do que falta, por trás, para a tela de perfil virar editável:

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

- `/painel/perfil` ganha form de dados básicos, form de troca de senha
  (senha atual + nova + confirmação, validado com Zod) e upload de avatar —
  hoje a página só lê e exibe, não tem nenhum form.
- Se avatar existir, `getInitials()` (`src/lib/initials.ts`, compartilhado
  por `UserMenu` e `TopBarUserMenu`) vira fallback (mostra a foto quando
  houver, iniciais quando não houver).

**Prioridade**: baixa — depende de decisões de produto (onde fica o avatar,
se STAFF pode trocar a própria senha ou se isso é sempre via convite/reset)
que ainda não foram tomadas. Não teve pedido de usuário real até agora.

### Fase 2 — Robustez de sessão e UX

- **Refresh automático** — o access token expira em 15 min e não há renovação: o usuário é deslogado no meio do trabalho. Implementar detecção de 401 que chama `POST /auth/refresh` com o cookie `crivo_refresh` e repete a requisição antes de propagar a falha. **É o item de maior impacto percebido nesta fase.**
  - **Parcialmente coberto**: quando a sessão já expirou (sem refresh), o usuário não fica mais preso numa tela morta com só um Alert e um botão "Tentar novamente" — `useSessionExpiredGuard` (`src/hooks/use-session-expired-guard.ts`) detecta a mensagem estável `SESSION_EXPIRED_MESSAGE` (agora em `src/lib/session-messages.ts`, sem `server-only`, para poder ser importada em Client Components) no `error` de qualquer `useQuery` de leitura, chama `logoutAction()` e redireciona para `/login` automaticamente, sem exigir refresh manual da página. Plugado em `useAppointments`/`usePatients`/`useProfessionals`/`useProcedures`. Isso NÃO é o refresh automático em si (não renova o token antes de expirar) — só evita a tela travada depois que ele já expirou. O refresh de verdade continua pendente.
- ~~**Bloquear TELAS inteiras por papel**~~ — ✅ **feito** junto de `usuarios` (Fase 1, item 5). A proteção de **ações** já existia desde `profissionais` (UI via `useIsAdmin()`, Server Action via `requireAdmin()`, backend via `@Roles`); o que faltava era a proteção da **rota em si**. `usuarios/page.tsx` chama `getSession()` e faz `redirect("/painel")` se `role !== "ADMIN"`, testado com um STAFF real digitando a URL direto. `(dashboard)/layout.tsx` continua só checando "existe sessão" (correto — ele é compartilhado por todas as rotas, a checagem de role é responsabilidade de cada `page.tsx` que precisa dela). Esse padrão só se aplica a telas ADMIN-only na leitura; `profissionais`/`procedimentos` continuam abertos a STAFF por design (o backend não usa `@Roles` no GET deles).
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

## Armadilha resolvida: `mutateAsync` sem `try/catch` derrubava a página

`useMutation().mutateAsync()` (diferente de `.mutate()`) **relança o erro**
depois de rodar `onError` — é assim que o React Query permite tratamento
local além do `onError` do hook. Os 9 dialogs de formulário/exclusão do
projeto (Patients, Professionals, Procedures, Appointments) chamavam
`await xyz.mutateAsync(...)` direto no `onSubmit`/`handleConfirm`, sem
`try/catch`. Enquanto os testes só cobriam o caminho feliz, isso nunca
apareceu — o primeiro erro de regra de negócio real (409 de conflito de
horário na Agenda) relançou pelo `await` desprotegido e virou uma exceção
não capturada, que o Next.js mostra como tela cheia de "Runtime Error" em
dev (e provavelmente uma tela crashada/branca em produção, sem o overlay).

**Fix**: todo `await xyz.mutateAsync(...)` nesses 9 arquivos agora está
dentro de um `try { ...; onOpenChange(false); } catch { /* snackbar via
onError já cobre */ }` — o dialog fica aberto e o usuário vê o erro no
snackbar, em vez da página crashar. Ao criar uma nova feature com dialogs
de formulário, sempre envolver `mutateAsync` em `try/catch` (ou preferir
`.mutate()` quando não precisar aguardar o resultado antes de fechar o
dialog).
