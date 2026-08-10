# Roadmap — Crivo FE (Painel)

Onde está o painel administrativo hoje e o que falta construir, módulo a módulo.

> Última atualização: 2026-08-06 (rev. 3 — Quadro da agenda, formato pt-BR nos
> calendários, cascata no agendamento, reenvio manual e erros em português).

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
| `agenda` (appointments) | 🟢 Duas visões: **Lista** (tabela) e **Quadro** (calendário `@mui/x-scheduler`). Criar/reagendar/mudar status. Aberto a ADMIN e STAFF (sem `@Roles`) |
| `procedimentos` (procedures) | 🟢 CRUD completo, com escrita restrita a ADMIN |
| `mensagens` (messaging) | 🟢 Histórico + aba de falhas, **com reenvio manual** e leitura do texto completo. Aberto a ADMIN e STAFF |
| `usuarios` (users) | 🟢 CRUD (sem delete, soft via `isActive`). Restrito a ADMIN — 1ª tela com bloqueio de rota inteira |
| `configuracoes` (tenants/me) | 🟢 Duas abas: **Dados da clínica** (leitura para todos, edição ADMIN) e **Mensagens automáticas** (editor de templates, só ADMIN) |
| Perfil do usuário (`/painel/perfil`) | 🟢 Editar nome, trocar senha, upload de avatar (Cloudinary) |
| Testes automatizados | 🔴 Nenhum (sem infra) |

A arquitetura está validada ponta a ponta: `pacientes` implementa todas as camadas do `SKILLS.md` contra o crivo-be real e serve de molde para as demais features. O `/painel` deixou de ser placeholder — hoje traz cards de contagem, alerta de falhas e três gráficos (ver Fase 2).

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

## ~~Lacuna conhecida: não existe "quem sou eu" no backend~~ — ✅ resolvida

`GET /users/me` existe agora (`MeController`, ver seção "Perfil do usuário logado" abaixo) e `loginAction` **já foi migrado** para ele. O fallback antigo (`GET /users` + filtro pelo `sub` do JWT) foi removido junto com o helper `decodeSub` e o arquivo morto `src/features/auth/http/get-users.ts`.

Isso não era só limpeza — o fallback antigo escondia um **bug real**: `GET /users` é ADMIN-only, então **todo usuário STAFF caía no fallback e via o próprio e-mail no lugar do nome** no cookie `crivo_display_name` (e portanto no header/sidebar até o `useProfile()` do React Query resolver). Com `GET /users/me` (sem `@Roles`, aberto a qualquer papel autenticado), STAFF passa a resolver o nome real no login. Confirmado com login real: `recepcao@clinicasorriso.com.br` agora grava `Marina Ribeiro`, antes gravava o e-mail.

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
7. ~~**Perfil do usuário logado**~~ — ✅ **feito**, backend e frontend. `/painel/perfil` virou form de verdade (editar nome, trocar senha, trocar foto), não mais somente-leitura.

### Perfil do usuário logado (trocar senha, avatar, etc.)

**Backend — endpoints novos, todos em `MeController` (`src/modules/users/infrastructure/http/me.controller.ts`)**:

- `@Controller('users/me')`, guards `JwtAuthGuard` + `TenantContextGuard`, **sem `@Roles()`** — qualquer papel autenticado acessa os próprios dados. Controller **separado** de `UserController` (que é `@Controller('users')` + `@Roles(ADMIN)` de classe inteira), por dois motivos: (1) não depender de sobrescrever `@Roles()` vazio por método numa classe cujo padrão é ADMIN-only; (2) `/users/me` colidiria com `/users/:id` se estivesse no mesmo controller.
  - **Armadilha real encontrada**: registrar `UserController` antes de `MeController` no array `controllers: [...]` de `UsersModule` fazia `PATCH /users/me` casar com a rota `PATCH /users/:id` (`id = "me"`) primeiro — o Nest resolve por **ordem de registro**, não por especificidade de path. Corrigido invertendo a ordem: `controllers: [MeController, UserController]`, com comentário no código explicando por quê (não é óbvio revisitando o arquivo sem esse contexto).
- `GET /users/me` — dados do próprio usuário (`GetMeUseCase`, busca por `findByIdAndTenant(userId, tenantId)`).
- `PATCH /users/me` — troca só o nome (`UpdateMeUseCase`). Sem email/role/isActive — aqueles continuam exclusivos de `UserController` (gestão por ADMIN).
- `PATCH /users/me/password` — troca a própria senha (`ChangePasswordUseCase`): exige `currentPassword` + `newPassword`, compara o hash com `bcrypt.compare` (400 se não bater), grava novo hash com `bcrypt.hash(..., 10)` — mesmo `SALT_ROUNDS` usado em `create-user`/`register`. `@HttpCode(204)`, sem corpo de resposta.
- `POST /users/me/avatar` — upload multipart (`FileInterceptor('file')` do `@nestjs/platform-express`; precisou instalar `@types/multer` que não estava no projeto). Valida MIME (`image/jpeg|png|webp`) e tamanho (5MB) no controller antes de chamar o use case. `UpdateAvatarUseCase` sobe pro Cloudinary via `CloudinaryService` novo (`src/shared/infrastructure/cloudinary/`, módulo `@Global()` registrado em `UsersModule`) e salva a URL retornada.
- **Schema**: `User.avatarUrl String? @map("avatar_url")` — migration `20260803204104_add_user_avatar_url`, gerada com `prisma migrate diff` + `migrate deploy` (processo documentado no `SKILLS.md` do backend, `migrate dev` não funciona neste ambiente).
- **`UserManagementRepository.update`** (domain type) estendido para aceitar `password?`/`avatarUrl?` — a implementação Prisma (`this.prisma.user.update({ data })`) já aceitava qualquer campo do tipo sem precisar editar código, só o tipo.

**Cloudinary (`src/shared/infrastructure/cloudinary/`)**:

- `CloudinaryService.uploadImage(buffer, folder, publicId)` — `cloudinary.uploader.upload_stream` promisificado, salva em `crivo/avatars/<userId>` com `public_id` fixo por usuário (`overwrite: true`) para não acumular avatares antigos órfãos a cada troca, e uma transformação `{ width: 512, height: 512, crop: 'fill', gravity: 'face' }` (recorte quadrado, foco no rosto quando detectável).
- Config lida via `ConfigService.getOrThrow` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) — mesmo padrão de `DeepSeekTextGenerator`. `CLOUDINARY_API_KEY`/`_SECRET` já estavam no `.env`/`.env.example` como placeholder vazio de um trabalho futuro; faltava só `CLOUDINARY_CLOUD_NAME` (visível na URL do dashboard Cloudinary) e o SDK (`npm install cloudinary`).
- Testado via curl com um PNG gerado localmente: upload real, URL `https://res.cloudinary.com/<cloud_name>/image/upload/.../crivo/avatars/<userId>.png` acessível publicamente (200), rejeição de arquivo não-imagem confirmada (400).

**Frontend — nova feature `src/features/profile/`**:

- `useProfile()` (query), `useUpdateProfile()`, `useChangePassword()`, `useUploadAvatar()` (mutations) — todos com `useSessionExpiredGuard`/snackbar/`invalidateQueries` no padrão já estabelecido.
- `/painel/perfil` (`ProfilePage`, agora Client Component) — card com `AvatarUpload` (avatar clicável com ícone de câmera sobreposto, `<input type="file" hidden>`, preview via `Avatar src`), `ProfileForm` (nome editável, e-mail `disabled` com nota "trocar e-mail ainda não está disponível") e `ChangePasswordForm` (senha atual + nova + confirmação, validação client-side de "senhas não coincidem" via `zod.refine`, além do 400 real do backend se a senha atual estiver errada).
- `AvatarUpload` valida tipo/tamanho no client **antes** de subir (mesmos limites do backend — MIME e 5MB), pra feedback imediato sem round-trip.
- `TopBarUserMenu` e `UserMenu` (sidebar) agora chamam `useProfile()` e passam `src={profile?.avatarUrl}` pro `Avatar` — como os dois já eram Client Components e `useProfile()` usa a mesma `PROFILE_QUERY_KEY` que `ProfilePage` invalida ao trocar nome/foto, a troca de avatar aparece em tempo real no header e na sidebar sem reload.
- Upload via Server Action: `uploadAvatarAction(file: File)` — Next.js serializa `File` nativamente como argumento de Server Action; a camada `http/post-avatar.ts` empacota num `FormData` e o `ky` detecta e define `multipart/form-data` com boundary sozinho (sem precisar setar `Content-Type` manual, que quebraria o boundary).

**Testado**: ADMIN e STAFF, ambos os papéis — editar nome (propaga pro header), trocar senha (senha errada → 400 exibido, senhas não coincidem → validação client-side, fluxo correto → 204 + snackbar + login com a senha nova funciona), upload de avatar (arquivo real, aparece em `/painel/perfil` e no header, arquivo de tipo inválido rejeitado antes do upload). Zero regressão nas telas de Usuários/Configurações que dependiam do mesmo `UserResponseDto`.

### Fase 2 — Robustez de sessão e UX

- ~~**Refresh automático**~~ — ✅ **feito**, em duas camadas complementares (uma só não cobria os dois cenários).
  - **Camada 1 — `src/middleware.ts` (nova)**: renova o token na **navegação entre páginas**. Intercepta `/painel/:path*`, decodifica o `exp` do JWT e, se já passou, chama `POST /auth/refresh` e regrava os cookies **antes** do render começar. Se o refresh falhar, deixa passar sem cookie novo e o `layout.tsx` redireciona pro login como antes.
    - **Armadilha real encontrada**: a primeira tentativa foi renovar dentro do próprio `getSession()`/`getServerSession()` (`src/lib/session.ts`), o que **não funciona** — `cookies().set()` só é permitido em fase `'action'` (Server Action) ou Route Handler, e lança `ReadonlyRequestCookiesError` durante o render de Server Component, que é exatamente onde `layout.tsx` chama `getSession()`. O `catch` engolia o erro e devolvia `null`, então **todo** access token expirado deslogava mesmo com refresh token válido em mãos. Middleware é a única camada que roda antes do render e pode escrever cookies na resposta. `getSession()` voltou a ser leitura pura, com comentário explicando por quê.
  - **Camada 2 — `withAuth()` (`src/lib/with-auth.ts`, novo)**: cobre o caso que o middleware não pega — o token **parece** válido pelo `exp` local mas o backend responde **401 de verdade** (revogado, `logout-all` de outra sessão, relógio dessincronizado). Envolve a chamada `http/*`, e no 401 tenta o refresh uma vez, regrava cookies e **repete a requisição original**. Aplicado nas 28 Server Actions do projeto. O guard de papel (`getServerSession`/`requireAdmin`) continua onde estava — `withAuth` cuida só do retry, não da autorização.
  - **Testado de verdade** (não só type-check): access token expirado **forjado e assinado com o `JWT_SECRET` real** (para o backend rejeitar com 401 legítimo, não um token malformado) + refresh token válido de um login real → a página carrega normalmente e o cookie de sessão troca. Caminho negativo: refresh token inválido → redireciona pro `/login` corretamente, sem loop.
  - ~~**Deslogar automaticamente quando a sessão expira**~~ — ✅ **feito**, e centralizado. Tentativa anterior (`useSessionExpiredGuard` chamado manualmente em cada hook de `useQuery`) tinha um buraco real: só cobria **leituras**, nunca **mutations** — uma sessão morta numa ação de escrita (editar perfil, trocar senha, criar paciente) só mostrava o snackbar de erro genérico e nunca deslogava, porque nenhuma das ~20 mutations do projeto tinha a checagem. Fix: `queryCache`/`mutationCache` globais no `QueryClient` (`src/components/providers/query-provider.tsx`), com `onError` detectando `SESSION_EXPIRED_MESSAGE` (`src/lib/session-messages.ts`) em **qualquer** query ou mutation do app — nenhum hook novo precisa lembrar de adicionar isso. O hook `useSessionExpiredGuard` e seus 8 usos manuais foram removidos (redundantes agora). Continua NÃO sendo o refresh automático em si — só evita a tela travada depois que a sessão já expirou.
- ~~**Bloquear TELAS inteiras por papel**~~ — ✅ **feito** junto de `usuarios` (Fase 1, item 5). A proteção de **ações** já existia desde `profissionais` (UI via `useIsAdmin()`, Server Action via `requireAdmin()`, backend via `@Roles`); o que faltava era a proteção da **rota em si**. `usuarios/page.tsx` chama `getSession()` e faz `redirect("/painel")` se `role !== "ADMIN"`, testado com um STAFF real digitando a URL direto. `(dashboard)/layout.tsx` continua só checando "existe sessão" (correto — ele é compartilhado por todas as rotas, a checagem de role é responsabilidade de cada `page.tsx` que precisa dela). Esse padrão só se aplica a telas ADMIN-only na leitura; `profissionais`/`procedimentos` continuam abertos a STAFF por design (o backend não usa `@Roles` no GET deles).
- ~~**Tratamento de erro consistente**~~ — ✅ **feito**. `<ErrorServer message onRetry />` (`src/components/ui/error-server.tsx`) substituiu **9 cópias literalmente idênticas** do mesmo bloco (`<Alert severity="error">` + botão "Tentar novamente") espalhadas por `AppointmentManagement`, `PatientManagement`, `ProcedureManagement`, `ProfessionalManagement`, `MessageManagement`, `UserManagement`, `TenantSettings`, `ProfilePage` e `DashboardHome`. Ficaram **de fora de propósito** dois `<Alert severity="error">` que não são o mesmo padrão: `LoginForm` (erro de validação de formulário, sem retry) e `FailedMessagesAlert` (conteúdo de negócio — mensagens que falharam — não estado de falha de carregamento).
- ~~**Home do painel**~~ — ✅ **feito**. `/painel` mostra: 4 cards de contagem (agendamentos hoje, pacientes, profissionais ativos, procedimentos), alerta de mensagens que falharam (sucesso "nenhuma falha" quando vazio, senão lista quem ligar), lista de agendamentos de hoje, lista de "a confirmar" (`SCHEDULED` nas próximas 48h). Endpoint novo no backend: `GET /dashboard/summary` (`src/modules/dashboard/`, sem repository/Prisma próprio — só agrega dados de `AppointmentRepository`/`PatientRepository`/`ProfessionalRepository`/`ProcedureRepository`/`MessageRepository` já existentes, importando os módulos de origem em vez de duplicar acesso a dados; `MessagingModule` precisou passar a exportar `MESSAGE_REPOSITORY`, que antes só ficava interno). Sem `@Roles`: ADMIN e STAFF veem a mesma home.
  - **Achado ao implementar**: existia uma rota órfã `/painel/dashboard` com um componente stub vazio (`<>Dashboard</>`) e um item de menu "Dashboard" apontando pra ela — resquício de uma tentativa anterior interrompida, nunca ligada a nada real. Removidos os dois; o item de menu agora se chama "Painel" e aponta para a home de verdade (`/painel`). `SidebarNav` precisou de uma exceção na lógica de rota ativa (`item.href === "/painel" ? pathname === item.href : ...`), já que `/painel` é prefixo de toda rota do dashboard e ficaria sempre marcado como ativo sem isso.
  - **Gráficos** (`@mui/x-charts`, já instalado na mesma versão major de `x-data-grid`/`x-date-pickers`, 9.10.1): `GET /dashboard/analytics` novo (`GetDashboardAnalyticsUseCase`), separado de `summary` de propósito — `summary` é "o que fazer agora" (listas acionáveis), `analytics` é "tendência dos últimos 7 dias" (agregados para gráfico, sem paginação). Sem SQL raw: busca os agendamentos do período via `AppointmentRepository.findMany` (`perPage` alto, teto de segurança 1000) e agrega em memória no use case — mantém a regra do projeto de nenhuma query fora da camada de infra, e o volume de uma clínica em 7 dias não justifica `groupBy`/`$queryRaw` no banco. Três gráficos na home: `AppointmentsByDayChart` (BarChart, agendamentos por dia — todos os 7 dias aparecem no eixo mesmo com `count: 0`, um dia vazio é informação, não deveria "sumir"), `StatusPieChart` (PieChart/donut, distribuição de status — precisou de um mapa de hex próprio, `STATUS_HEX_COLORS`, porque `STATUS_COLORS` de `appointments/status.ts` usa nomes semânticos do MUI tipo `"info"`/`"success"` para `<Chip color="...">`, que um `PieChart` não aceita como cor de série), `RevenueByProcedureChart` (BarChart horizontal, soma de `priceInCents` só de agendamentos `COMPLETED`, formatado com `formatCentsToBRL` já existente). Sem `@Roles`: ADMIN e STAFF veem os mesmos gráficos.

### Entregue em 05–06/08/2026

- ~~**Quadro da agenda**~~ — ✅ calendário (`@mui/x-scheduler` 9.0.0-beta.7) ao lado da visão Lista, colorido por profissional e filtrável pelo painel de Recursos. Somente leitura de propósito: marcar continua pelo formulário validado, que já aplica expediente, grade e duração — clique-para-criar duplicaria essas regras num segundo lugar.
  - **Faixas "não atende"** (`off-hours.ts`) — espaço vazio no Quadro era lido como horário livre. A conta é a mesma do backend (expediente ∩ grade − bloqueios); se divergir, o Quadro volta a prometer horário que o formulário recusa. Só aparecem com **um** profissional visível: numa grade compartilhada, cinza não diz de quem é.
  - **Grade derivada do expediente** — `viewConfig` usava 7h–20h fixo enquanto a clínica abre 08:00–18:00, e a hora extra virava faixa cinza que não representava decisão nenhuma. Agora vem de `tenant.businessHours*`.
  - **Rótulos das pontas** — o `DayTimeGrid` omite o primeiro rótulo de propósito (`index === 0 ? null : …`) e não tem célula para o último, então a grade 08:00–18:00 exibia um eixo de 09:00 a 17:00. Repostos por CSS na primeira célula, usando a variável `--hour-height` do próprio pacote.
- ~~**Formato brasileiro nos calendários**~~ — ✅ `ampm: false` no scheduler (14:00, não 2:00 PM) e `dayOfWeekFormatter` no tema. O `weekdaysMin` do dayjs pt-br é `["Do","2ª","3ª",…]`, e o MUI renderizava isso como "D 2 3 4 5 6 S" — número, não dia. Corrigido em `MuiDateCalendar` para valer em todo calendário do painel.
- ~~**Grade do profissional no cadastro**~~ — ✅ `WeeklyGridEditor` extraído (só UI, sem API) e reusado no dialog de Horários e no cadastro. No cadastro salva em dois passos (cria → grava a grade); falha no segundo passo **não** desfaz o cadastro, e o snackbar diz o que ficou faltando.
  - `TimePicker` no lugar de `<input type="time">`, limitado ao expediente (`minTime`/`maxTime`) — a lista ia de 00h a 23h numa clínica que abre às 08:00, e o backend recusaria no salvamento.
  - "+ Faixa" desabilitado quando não sobra expediente: a faixa nova nascia fora do horário (19:00→19:30 numa clínica que fecha às 18:00).
- ~~**Cascata no formulário de agendamento**~~ — ✅ Paciente → Profissional → Procedimento → Dia, cada um `disabled` até o anterior existir. O campo Dia depende dos dois: sem eles não dá para saber quais dias desabilitar.
  - **Dias fora da grade desabilitados no calendário** + "Este profissional atende segundas." antes de escolher. Antes a recusa só aparecia depois de selecionar, o que fazia a tela parecer quebrada quando na verdade a regra estava certa.
  - **Chips de horário mostram início → fim** ("08:00 → 08:30"). A legenda em letra miúda não era lida antes dos chips, e uma lista de 15 em 15 min passava a impressão de consultas de 15 min.
- ~~**Reenvio manual de mensagem**~~ — ✅ ação no menu de três pontos da aba de falhas (`POST /messages/:id/resend`). Antes o retry só existia no Bull Board, ferramenta de dev.
- ~~**Ver mensagem**~~ — ✅ dialog com o corpo completo em `pre-line` (o texto tem emoji, quebras reais e o link de confirmação). A coluna "Mensagem" saiu da tabela: truncada não servia para ler.
- ~~**Erros de envio em português**~~ — ✅ `error-messages.ts` traduz o `lastError` cru do provider para o que a recepção precisa saber. `Cannot read properties of undefined (reading 'onWhatsApp')` virou "O WhatsApp da clínica está desconectado" + o que fazer. Cada regra responde **o que aconteceu** e **de quem é a ação** — em "acesso recusado" reenviar não adianta; em "queda de rede" reenviar é o certo. O texto cru fica atrás de "Detalhe técnico": traduzir na exibição (e não na gravação) preserva o diagnóstico.
- ~~**Badge de falhas no menu**~~ — ✅ contagem no ícone de Mensagens. Fica no ícone, não no rótulo: com a sidebar recolhida o texto tem `opacity: 0` e o badge sumiria junto.
- ~~**Filtros em grid**~~ — ✅ o tema define `fullWidth` como padrão do `TextField`, o que vencia o `minWidth` e empilhava os filtros numa coluna. Grid dá a cada campo sua coluna.

### Fase 3 — Qualidade

- **Não há infraestrutura de teste no projeto** (sem Vitest/Jest, sem Testing Library, sem script `test`). O `SKILLS.md` marca testes como critério de aceitação obrigatório, então hoje **nenhuma feature atende ao próprio padrão** que documentamos. Configurar a base é pré-requisito para o resto desta fase.
  - Ficou mais caro em 06/08: `error-messages.ts` é lógica pura com sete regras de casamento por regex — exatamente o tipo de código que teste cobre bem, e que hoje só foi validado rodando os padrões à mão.
- Testes para `auth` (actions, hooks) e `patients` (o molde — testá-lo primeiro define o padrão para as demais).
- Testes para `SidebarNav` (filtragem por role) e `UserMenu`.

---

## Regras de agendamento (horário comercial e duração)

Três validações no `crivo-be`, todas em `BusinessHoursService`
(`src/modules/appointments/application/services/`), chamadas por
`CreateAppointmentUseCase` **e** `RescheduleAppointmentUseCase` — reagendar
tinha exatamente as mesmas brechas de criar.

1. **Dia de atendimento** — `Tenant.businessDays`, no padrão `Date.getDay()`
   (0=domingo … 6=sábado), default seg–sex.
2. **Dentro do expediente** — `Tenant.businessHoursStart` / `businessHoursEnd`,
   gravados em **minutos desde a meia-noite** (`480` = 08:00), não `String`
   `"08:00"`: comparar vira aritmética simples, sem parsing nem fuso no meio.
3. **O atendimento precisa CABER inteiro na janela** — esta é a regra que
   motivou o resto. Validar só o horário de início deixaria passar um
   procedimento de 90min marcado às 17:00 com fechamento às 18:00, que
   terminaria 18:30. A duração já vinha do procedimento (`endsAt` derivado, a
   recepção escolhe *o que* será feito, não *quanto tempo leva*), e a regra de
   **sobreposição** entre agendamentos do mesmo profissional já usava esse
   `endsAt` — então bloquear a agenda pelo tempo real do procedimento já
   funcionava; o que faltava era só a barreira do fechamento.

O expediente é comparado em **hora local** (`getHours()`) de propósito: é o
relógio de parede da clínica, não UTC.

Configurável por clínica em `/painel/configuracoes` (ADMIN; STAFF vê
desabilitado), com `TimePicker` e um `ToggleButtonGroup` de 7 dias — a
recepção nunca digita o inteiro de minutos, a conversão acontece na borda do
formulário. `UpdateTenantUseCase` ainda valida `start < end` cruzando com o
valor já salvo, já que o `PATCH` pode mandar só um dos dois campos.

**Testado contra a API real**: antes da abertura → recusado; 17:30 + 60min com
fechamento 18:00 → recusado com a mensagem do horário de término; 16:00 + 60min
→ aceito; domingo → recusado listando os dias de atendimento.

## Agenda: escolher horário livre em vez de adivinhar

`GET /appointments/availability?professionalId&procedureId&date` devolve
**apenas os horários em que o atendimento cabe inteiro**, já descontando as
três coisas de uma vez: expediente da clínica, duração do procedimento e a
agenda daquele profissional (mais o passado, que também some).

Antes a recepção escolhia qualquer hora num `DateTimePicker` livre e só
descobria no *Agendar* que o profissional estava ocupado ou que passava do
fechamento. Agora o `SlotPicker` (`features/appointments/components/`) mostra
chips clicáveis — o erro deixou de ser possível em vez de ser reportado depois.

Detalhes que não são óbvios:

- **Passo de 15 min ≠ duração.** Os horários são oferecidos de 15 em 15
  minutos, mas cada um reserva a duração real do procedimento. Um de 30 min às
  10:30 ocupa até 11:00, então 10:45 desaparece da lista.
- **`excludeAppointmentId`** existe para o reagendamento: sem ele o próprio
  horário atual apareceria como ocupado por si mesmo. Verificado na API — 28
  slots sem o parâmetro, 31 com ele, e o horário do agendamento reaparece.
- **`closed: true`** é resposta válida (dia sem atendimento), não erro 400:
  quem perguntou "o que tem livre?" precisa renderizar "a clínica não atende
  neste dia". Aparece ao reagendar algo que caiu num domingo antes da regra
  existir.

### Armadilha: `new Date('2026-08-05')` é meia-noite **UTC**

Em Brasília (UTC-3) isso cai em **04/08 às 21:00** — o dia inteiro escorregava
para o anterior e a agenda vinha errada (a query de 05/08 retornava horários de
04/08). O DTO agora monta a data em horário **local** via `@Transform` quando o
formato é `YYYY-MM-DD`. O servidor roda no fuso da clínica, que é o fuso em que
a recepção raciocina.

### Fonte única de verdade: o hardcode que contradizia o backend

`features/appointments/business-hours.ts` tinha o expediente **chumbado como
seg–sáb 09h–19h**, enquanto o backend usava seg–sex 08h–18h vindo do banco. Na
prática o formulário liberava sábado e 18:30 (o backend recusava) e bloqueava
08:00 (que o backend aceitava). O arquivo foi **removido**: os dias vêm de
`useTenant()` e os horários do endpoint de disponibilidade.

O `superRefine` do zod que revalidava o horário também saiu — revalidar no
client só duplica (e diverge d) a regra que já mora no backend. O schema hoje
só garante que **algum** horário foi escolhido.

## Armadilha resolvida: faturamento vazio com agendamentos concluídos na tela

O card "Faturamento por procedimento" dizia *"nenhum procedimento concluído no
período"* enquanto a Agenda listava 6 concluídos — parecia bug de agregação,
mas o backend estava certo: a janela era de **7 dias** e os concluídos eram de
30/06 a 27/07 (fora dela), mais um em 04/08 (futuro, cortado pelo `to: now`).

Clínica de movimento baixo não fecha procedimento todo dia, então 7 dias é uma
janela ruim justamente para o gráfico de dinheiro. Correção: `revenueDays`
(`7|30|90`, default **30**) em `GET /dashboard/analytics`, com **janela própria
só para o faturamento** — `byStatus` e `byDay` seguem em 7 dias, que faz
sentido para "como está a semana". Quando as duas janelas coincidem, reusa a
mesma busca em vez de ir ao banco duas vezes.

O seletor fica no próprio card, e o subtítulo passou a mostrar o total
faturado no período. Detalhe de UI que custou duas tentativas: no `BarChart`
horizontal, `margin.left` **não** evita o corte do rótulo ("Limpeza dental"
virava "Limp…") — o MUI X trunca pela largura reservada ao tick, então é
preciso `yAxis[].width` junto.

## Proteção contra perda de formulário

`useUnsavedChangesGuard` (`src/hooks/`) + `<UnsavedChangesDialog />`
(`src/components/ui/`). Um dialog fecha por três caminhos — botão Cancelar,
clique fora/ESC do MUI, e a aba do browser — e todos passam pelo guard quando
`formState.isDirty`. O aviso do browser (`beforeunload`) fica separado porque
não aceita UI customizada; dentro da app é um `<Dialog>` normal.

O caminho de sucesso **não** passa pelo guard: depois de salvar não há nada a
perder, então `onOpenChange(false)` continua direto.

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
