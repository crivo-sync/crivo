# Roadmap — Crivo FE (Painel)

Onde está o painel administrativo hoje e o que falta construir, módulo a módulo.

> Última atualização: 2026-08-14 (rev. 22 — **tabela de preços nova**:
> R$ 49/89/179/299. Prontuário e fotos desceram para a base (viraram
> commodity), a franquia de mensagem virou linha de feature, e nenhum plano
> é mais ilimitado — a Meta passa a cobrar toda mensagem de utilidade em
> 01/10/2026).
>
> Rev. 21 (14/08): aba **WhatsApp** nas
> Configurações: a clínica conecta o próprio número lendo um **QR code**, em
> vez de digitar o "nome da instância" da Evolution num campo de texto. Era o
> último ponto do produto que não sobrevivia a uma clínica assinando
> sozinha).
>
> Rev. 20 (13/08): o `/painel` abre dizendo **quanto
> as faltas custaram este mês, em reais**; o resumo do dia foi **liberado em
> todos os planos** — travá-lo fazia a clínica no Solo abrir o sistema e ver
> uma tela de erro como primeira coisa; onde havia gráficos, quem não tem
> `hasDashboard` vê um convite ao upgrade em vez de nada. No site, a home
> passou a **falar a dor em reais**: manchete nova, **calculadora de perda**
> com os números do visitante, e o jargão de engenharia removido de todas as
> páginas — 7 testes E2E novos, um deles falhando se o jargão voltar).
>
> Rev. 19 (13/08): **fotos antes/depois** na ficha do paciente, agrupadas por
> atendimento, com URL assinada que expira e sem botão de download; o painel
> passou a **esconder o que o plano não inclui** (cadeado nas abas, em vez de
> 403 numa tela vazia); confirmação antes de descer de plano.
>
> Rev. 18 (13/08): agendamento que chega com a Agenda aberta é avisado e
> destacado; botão "Marcar outra consulta" na confirmação do `/agendar`;
> 🐞 contador de trial arredondava para cima, mostrando "15 dias" num trial
> de 14 — conta unificada em `src/lib/trial.ts`.
>
> Rev. 16 (12/08): aba **Conversa** na ficha do paciente (a recepção responde
> pelo painel, sem sair para o WhatsApp), **checklist de onboarding** no
> `/painel` para a clínica nova, calendário do `/agendar` migrado para
> `DatePicker`, e contador de mensagens na tela de Assinatura.

---

## Onde estamos hoje

| Módulo | Status |
| --- | --- |
| Infraestrutura (`ky`, React Query, sessão) | 🟢 |
| Material UI (theme, providers, DataGrid) | 🟢 |
| `auth` (login, logout, proteção de rota, **cadastro self-service + trial de 14 dias**) | 🟢 |
| Sidebar / menu (mini variant, filtrado por role) | 🟢 |
| `pacientes` (patients) | 🟢 CRUD completo, com máscara de telefone/CPF. Ficha com abas: **Dados**, **Conversa** (envio + recebimento na mesma linha do tempo, com resposta manual — aberta a STAFF), **Anamnese**, **Fotos** (antes/depois agrupadas por atendimento) e **Evolução** (as três últimas só para papéis clínicos, e só no plano com prontuário) |
| `profissionais` (professionals) | 🟢 CRUD completo, com escrita restrita a ADMIN |
| `agenda` (appointments) | 🟢 Quatro visões: **Lista** (tabela), **Quadro** (calendário `@mui/x-scheduler`), **Risco de falta** (predição) e **Lista de espera**. Criar/reagendar/mudar status. Aberto a ADMIN e STAFF (sem `@Roles`) |
| `procedimentos` (procedures) | 🟢 CRUD completo, com escrita restrita a ADMIN |
| `mensagens` (messaging) | 🟢 Três abas: **Histórico**, **Falhas** (com reenvio manual e erro em português) e **Recebidas** (caixa de entrada do que o paciente respondeu). Responder é na aba **Conversa** da ficha do paciente. Aberto a ADMIN e STAFF |
| `usuarios` (users) | 🟢 CRUD (sem delete, soft via `isActive`). Restrito a ADMIN — 1ª tela com bloqueio de rota inteira |
| `configuracoes` (tenants/me) | 🟢 Quatro abas: **Dados da clínica** (leitura para todos, edição ADMIN), **WhatsApp** (pareamento por QR code, aba escondida de STAFF), **Mensagens automáticas** (editor de templates, só ADMIN) e **Assinatura** (plano atual, contador de mensagens do mês/trial e checkout Stripe, só ADMIN) |
| `onboarding` | 🟢 Checklist no topo do `/painel` (12/08/2026) — diz à clínica nova o que falta para a agenda funcionar (profissional, procedimento, primeiro agendamento) e some sozinho quando ela está operando |
| `billing` | 🟢 Checkout real pro Stripe (`POST /billing/checkout`), site institucional lendo `GET /plans`. Trava por plano em `professionals` (contador), `prediction`, `waitlist`, `medical-records`, `hasAiMessages` (no envio **e** no toggle das Configurações) e nos **gráficos** do `dashboard` — o resumo do dia e o custo das faltas ficam abertos em todos os planos |
| `public-booking` (`/agendar/:subdomain`) | 🟢 Página pública onde o paciente marca sozinho, sem login. Cascata profissional → procedimento → dia → horário, com o mesmo cálculo de vaga do painel |
| Perfil do usuário (`/painel/perfil`) | 🟢 Editar nome, trocar senha, upload de avatar (Cloudinary) |
| `prediction` (risco de falta) | 🟡 Tela lendo a regra determinística do backend. Ainda não há ação disparada pela tela — o escalonamento de lembretes acontece no backend, ao agendar |
| `waitlist` (lista de espera) | 🟢 Fila, inclusão, **sugestão automática ao cancelar** um agendamento e oferta por WhatsApp |
| Testes automatizados | 🟡 **49 testes E2E (Playwright)** em 11 arquivos, cobrindo login, permissões, agendamento (painel e público), conversa com o paciente, onboarding, telas novas, bloqueio do `/painel`, a **home** (a conta da calculadora e um teste que falha se o jargão de engenharia voltar ao site) e a **conexão do WhatsApp** (contra a Evolution real: o QR é gerado de verdade). Ainda **sem teste unitário** — `error-messages.ts`, `lib/trial.ts` e a prévia de templates seguem descobertos |

A arquitetura está validada ponta a ponta: `pacientes` implementa todas as camadas do `SKILLS.md` contra o crivo-be real e serve de molde para as demais features. O `/painel` deixou de ser placeholder — hoje abre com **o custo das faltas do mês em reais**, seguido de cards de contagem, alerta de falhas e três gráficos (ver Fase 2).

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
8. ~~**Onboarding da clínica nova**~~ — ✅ **feito** (12/08/2026). `features/tenant/components/OnboardingChecklist`, no topo do `/painel`. Clínica criada pelo cadastro nascia sem profissional e sem procedimento, e sem os dois nada funciona: a agenda não calcula horário e o `/agendar` divulgado responde "Agenda ainda não disponível". O painel abria **todo zerado, sem explicação** — a clínica descobria pelo paciente reclamando. Decisões:
   - **Checklist, não wizard obrigatório** — travar quem só quer olhar o produto antes de preencher é pior do que deixar entrar e mostrar o que falta.
   - **Só o primeiro pendente tem botão em destaque** (`contained`); os outros ficam `text`. Três botões iguais não dizem por onde começar.
   - **O card some sozinho** quando `isComplete` (profissional + procedimento + primeiro agendamento). Também some em erro de busca: é auxiliar, e uma falha aqui não pode roubar a tela do dia a dia.
   - **O link do `/agendar` aparece desde o começo**, com botão de copiar — mas acompanhado de um `Alert` de que ainda não aceita agendamento enquanto faltar cadastro. Divulgar antes de configurar é justamente como o problema chegava ao paciente. Usa `window.location.origin` (não há env var de URL pública no projeto), o que é correto por construção: o link é do mesmo host que a clínica já está usando.
   - 4 testes E2E, incluindo o caso "clínica já operando não vê o card".
   - 🐞 **Achado de quebra: bomba-relógio de calendário na suíte.** `agendamento.spec.ts › os horários mostram início e fim` fixava o dia em `hoje + 7` (pulando fim de semana). O primeiro profissional da lista (Dr. Paulo, no seed) **não atende às quintas** — então o teste passava o ano inteiro e falhava toda vez que a suíte rodasse numa quinta-feira, que foi o caso em 13/08/2026. Passou a usar `primeiroDiaComVaga`, o helper que os testes vizinhos do mesmo arquivo já usavam pelo mesmo motivo.
9. ❌ **Chat com IA — descartado em 12/08/2026.** Avaliado para a página pública e para o painel, recusado nos dois. No público: quem conversa é visitante anônimo, custo DeepSeek variável sem dono e risco de a IA prometer horário ou preço errado para quem nem é cliente. No painel: não apareceu pergunta que a clínica faria a um chat e que Agenda, Risco de falta e Painel já não respondam melhor — seria pagar por uso para reembalar dado que já está na tela. A IA fica onde tem função verificável: reescrever o lembrete (`aiMessagesEnabled`). Fica registrado para não voltar como "ideia nova" daqui a três meses.

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

### Entregue em 10/08/2026

- ~~**Caixa de entrada (aba "Recebidas")**~~ — ✅ o que o paciente respondeu, com a leitura do sistema ao lado (`Confirmou` / `Quer cancelar` / `Precisa ler`). Confirmação automática já nasce lida, então a aba mostra só o que precisa de gente; não lidas em negrito e fundo destacado. `unreadTotal` vem fora do `meta` da paginação porque conta o tenant inteiro, não a página nem o filtro.
- ~~**Erros de envio em português**~~ — ✅ `error-messages.ts` traduz o `lastError` cru. `Cannot read properties of undefined (reading 'onWhatsApp')` virou "O WhatsApp da clínica está desconectado" + o que fazer. Cada regra responde **o que aconteceu** e **de quem é a ação** — em "acesso recusado" reenviar não adianta; em "queda de rede" reenviar é o certo. O texto cru fica atrás de "Detalhe técnico".
- ~~**Badge de falhas no menu**~~ — ✅ contagem no **ícone** de Mensagens, não no rótulo: com a sidebar recolhida o texto tem `opacity: 0` e o badge sumiria junto.
- ~~**Escolha do provider de WhatsApp**~~ — ✅ seletor em Configurações (`FAKE`/`EVOLUTION`/`META`, ou o padrão do servidor). A tela explica a consequência de cada um — o não oficial arrisca o número da clínica, e o simulado não envia nada.
- ~~**Editor de templates**~~ — ✅ aba "Mensagens automáticas", com marcadores clicáveis e pré-visualização. **A prévia mostra o que o paciente recebe *agora***: com a personalização desligada exibe o texto padrão, não o rascunho no editor. A substituição é duplicada no front só para a prévia (pedir ao servidor a cada tecla seria uma requisição por caractere); validado que casa com o backend nos casos de borda.
- ~~**Tela de risco de falta**~~ — ✅ terceira aba da Agenda (`/painel/agenda/risco`), lendo `GET /prediction/no-show/upcoming`. **Ordenada por risco, não por horário**: responde "para quem eu ligo hoje?", e a recepção tem tempo limitado. Cada card mostra **os motivos** (`factors`), não só a faixa — "risco alto" sozinho é um número que ninguém tem como checar nem discordar. Aba, e não rota isolada, porque é a mesma agenda vista de outro ângulo; abas são rotas de verdade (URL compartilhável, botão voltar funciona).
- ~~**Lista de espera**~~ — ✅ quarta aba da Agenda (`/painel/agenda/espera`). Tabela por ordem de chegada + dialog de inclusão. **"Qualquer um" e "Qualquer data" aparecem escritos**, não como célula vazia: vazio parece dado faltando, quando na verdade é o caso que aumenta a chance de encaixe. A ação "marcar como oferecida" só aparece para quem está `WAITING` — nos outros estados seria um item inerte no menu.
- ~~**Oferta de vaga ao cancelar**~~ — ✅ cancelar um agendamento abre um dialog com os candidatos da fila, com botão "Avisar" que manda a mensagem no WhatsApp. É o que fecha o ciclo da lista de espera: antes ela dependia de a recepção lembrar de abrir outra tela e cruzar procedimento e horário na mão. A posição na fila (`1º`, `2º`) aparece em cada card — sem ela a ordem parece arbitrária. O texto avisa que "a vaga fica para quem responder primeiro", porque a mesma vaga costuma ser oferecida a mais de uma pessoa.
- ~~**Manual da recepção atualizado**~~ — ✅ `docs/MANUAL-RECEPCAO.md` cobria só até a Fase 1. Ganhou três seções novas (Recebidas, Risco de falta, Lista de espera), a tabela de "o que fazer com cada erro de envio", a explicação de por que um paciente recebe dois lembretes e outro um, e o aviso de que responder "sim" no WhatsApp já confirma sozinho. Escrito para quem atende o telefone, não para quem programa — o teste de ponta a ponta mostrou que o sistema funciona, mas ninguém tinha documentado *como operá-lo*.
- ~~**Site alinhado ao que o produto entrega**~~ — ✅ auditei cada afirmação contra o backend e achei quatro divergências: o hero prometia **"24h de janela de lembrete"** (hoje são 72h/48h/24h por risco) e **"confirma pelo link"** (também confirma respondendo "sim"); os planos anunciavam **reativação inteligente** e **painel de métricas de ocupação**, que **não existem em linha nenhuma de código** — e omitiam lista de espera e agendamento online, que existem. Vender o que não se entrega é o tipo de dívida que só aparece na renovação do contrato.
- ~~**Cores dos planos unificadas**~~ — ✅ eram três famílias (teal, âmbar, índigo) lado a lado, o que faz a página parecer três produtos; o amarelo do "Mais popular" puxava mais atenção que o próprio preço. Agora é uma família só, variando **intensidade**: o plano recomendado é o único com fundo sólido, os outros ficam em contorno.
- ~~**Formulário de contato**~~ — ✅ labels visíveis (com placeholder sozinho, o campo perde a identificação assim que a pessoa digita), máscara de telefone igual à do painel, `autoComplete`, botão desabilitado até os dados serem válidos e estado de envio.
- **Débito registrado**: a duplicação da substituição de marcadores (`MessageTemplates/index.tsx` vs `template-renderer.ts` no backend) é consciente, mas é o tipo de coisa que diverge em silêncio. Se o formato dos marcadores mudar, os dois lados precisam mudar juntos.

### Entregue em 11/08/2026

- ~~**Cadastro self-service (`/cadastro`)**~~ — ✅ o site só oferecia um formulário de contato ("falamos com você em até 1 dia útil"); agora quem visita cria a própria conta e cai direto no painel. `POST /auth/register` (crivo-be) já existia, criava tenant + usuário ADMIN em transação, mas **não devolvia token** — a Server Action `registerAction()` resolve isso chamando `loginAction()` em sequência com as mesmas credenciais, sem tocar no backend. Schema Zod valida o "endereço da clínica" (o `subdomain`, usado hoje só pela rota pública de agendamento online `public/:subdomain`, não como subdomínio de DNS de verdade) contra formato URL-safe e uma lista de nomes reservados (`www`, `app`, `api`, `admin`, `painel`, `crivo`, `suporte`); `suggestSubdomain()` sugere o valor a partir do nome da clínica enquanto a pessoa não editar o campo à mão. Erro 409 do backend distingue e-mail duplicado de endereço duplicado só pelo conteúdo da mensagem (`Subdomain already in use.` vs `Email already in use.`), porque o backend não devolve um código de erro estruturado.
- ~~**CTAs do site apontando para `/cadastro`**~~ — ✅ o formulário de contato inline (`contact-form.tsx`) foi removido e virou um cartão de CTA (`register-cta.tsx`) que leva à página nova. Todos os "Comece grátis" do site (hero, header, footer, `final-cta` e cada coluna de `/planos`, incluindo o antigo "Rede — Falar com vendas") agora vão para `/cadastro` — decisão explícita do usuário de manter o fluxo **inteiramente automático**, sem etapa manual de vendas nem para o plano maior. O header já tinha um link morto para `/teste-gratis` (rota que nunca existiu); corrigido para `/cadastro`.
- **Trial sem cartão**: o formulário e a copy do site já dizem "teste grátis por 14 dias, sem cartão de crédito", mas **isso ainda é só texto** — não existe expiração de trial, bloqueio por vencimento nem cobrança no backend. Não há billing/Stripe implementado no Crivo ainda (diferente do Snap Financial). Antes de anunciar essa promessa em produção, falta decidir e implementar: o que acontece no dia 15, se o tenant é desativado ou só perde features, e o vínculo com o plano escolhido (hoje o cadastro não pergunta o plano — todo tenant novo nasce sem nenhuma feature paga habilitada por padrão, mesmo vindo do card "Clínica").
  - **Resolvido em 11/08/2026** — ver "Entregue em 11/08/2026" logo abaixo. O item acima ficou como está para registrar o que foi decidido no meio do caminho: primeiro a copy, depois a implementação de verdade.

### Entregue em 11/08/2026

- ~~**Trial real (14 dias, sem cartão)**~~ — ✅ deixou de ser só copy. `Tenant.subscriptionStatus`/`trialEndsAt` gravados na criação (`RegisterUseCase`); `TrialGuard` bloqueia (403) todo controller autenticado do painel quando vence — aplicado em `@UseGuards()` de cada controller (dashboard, patients, professionals, procedures, appointments, messaging, prediction, waitlist, tenants, users, medical-records), não como guard global: guards globais no Nest rodam **antes** dos guards de controller, e nesse ponto `req.tenantContext` ainda não existiria. Exceção deliberada: `GET /tenants/me` fica de fora — é de lá que o painel lê `trialEndsAt` para avisar a clínica, então bloqueá-la junto deixaria quem já expirou sem forma de descobrir por quê. Sem cron: o guard checa `trialEndsAt` contra `Date.now()` em request-time e marca `EXPIRED` no banco de forma preguiçosa, no primeiro request após o vencimento — decisão explícita para não manter mais um job rodando.
- ~~**Banner de trial no painel**~~ — ✅ `trial-banner.tsx`, alimentado pelo mesmo fetch que já buscava o nome da clínica no layout do painel. Aviso nos últimos 3 dias (`warning`, sobe para `error` no último dia), e mensagem clara de bloqueio quando `EXPIRED`. Ações bloqueadas (`POST`/`PATCH`/`DELETE` em qualquer módulo) já mostram a mensagem amigável do `TrialGuard` sem tratamento extra: o hook `beforeError` do `ky` promove `body.message` para `error.message`, e toda Server Action do projeto já repassa `error.message` para a UI.
- ~~**`/planos` e a home lendo `GET /plans` de verdade**~~ — ✅ a página passou por três formatos no mesmo dia até chegar no atual: primeiro 3 colunas estáticas (Essencial/Clínica/Rede, nomes de marketing que prometiam cobrança por assento e multi-unidade — nenhum dos dois existe no backend), depois um card único de trial (revertido a pedido do dono do produto), depois 4 colunas com o trial como card na grade (`lg:grid-cols-4`). A versão final busca os planos reais via `usePlans()` — `PRICING_PLANS`/`_data/pricing-plans.ts` foram removidos, e um mapeador (`_data/plan-to-pricing-card.ts`) converte `Plan` (da API) pro formato visual do card sem nunca hardcodar preço. O trial saiu da grade e voltou a ser um card de CTA separado (`FreeTrialCard`), mais parecido com o link do Snap Financial do que com uma coluna de preço. Nomes dos planos migraram para Básico/Intermediário/Avançado, batendo com o Stripe Dashboard.
  - **`(website)` ganhou `PublicQueryProvider`** — React Query não existia fora do painel; a versão do painel (`QueryProvider`) faz logout automático em sessão expirada, o que não faz sentido numa página pública sem usuário logado, daí um provider enxuto próprio em vez de reusar o existente.
  - **Tabela comparativa (`ComparisonNote`) recriada com as células vindas de `COLUMNS`**, não quatro `<td>` escritos à mão — foi exatamente essa duplicação que a deixou desalinhada da grade acima em uma das idas e vindas do dia.
  - **Features falsas continuam fora**: "Reativação inteligente de pacientes", "Painel de métricas de ocupação", cobrança por assento e multi-unidade não existem em linha nenhuma de código e não voltaram — no lugar, cada plano mostra exatamente o que `Plan.maxProfessionals`/`hasPrediction`/`hasAiMessages` diz no banco.
- ~~**Aba "Assinatura" em Configurações**~~ — ✅ `features/billing/` novo (mesma estrutura em camadas do projeto: `types` → `http` → `actions` → `hooks` → `components`), com `SubscriptionSettings` mostrando o plano atual do tenant (`Tenant.planId` cruzado com `GET /plans`, sem precisar mudar o contrato de `GET /tenants/me`), alerta por status (`TRIALING` com contagem de dias, `PAST_DUE`, `CANCELED`) e grid dos 3 planos com o card do plano contratado destacado. Botão "Assinar este plano" chama `POST /billing/checkout` e redireciona pro Stripe de verdade — testado via Playwright automatizando o cartão de teste `4242...` até a URL do checkout. Restrito a ADMIN nas duas pontas: backend recusa com `@Roles`, frontend desabilita o botão e mostra aviso para STAFF (testado nos dois papéis).
- ~~**Agendamento público mostrava formulário morto para clínica nova**~~ — ✅ 12/08/2026. Clínica recém-cadastrada tem zero profissional e zero procedimento, e sem os dois não existe horário nenhum para oferecer — mas a página exibia o formulário completo mesmo assim. O paciente encarava campos que nunca funcionariam, e a clínica não descobria que o link divulgado estava quebrado. Agora avisa "Agenda ainda não disponível" com o telefone da clínica quando houver. Teste E2E cria uma clínica pelo cadastro real (as opções vêm de Server Action, então `page.route` não as intercepta).
- ~~**Formulário de agendamento em `<select>` nativo**~~ — ✅ migrado para Material UI (12/08/2026). A página ganhou `layout.tsx` próprio com `MuiProvider`: fica fora de `(website)` e `(dashboard)`, então nenhum dos dois provia o tema. Efeito colateral no teste: `TextField select` do MUI não é `<select>`, então `selectOption` deixou de funcionar e a suíte passou a usar `getByRole("combobox")` + `getByRole("option")`; o estado desabilitado também aparece como `aria-disabled`, não `disabled`.
  - **Armadilha**: `sx={{ background: (theme) => ... }}` quebra em Server Component — função não atravessa a fronteira servidor→cliente. O `tsc` não pega; só estoura em runtime.
- ~~**Senha digitada às cegas, sem indicação de força**~~ — ✅ `components/password-field/` (12/08/2026), mesmo padrão do Snap Financial: 5 critérios, 5 barras, adaptado para MUI. Mostra **o que falta** ("falta uma maiúscula, um símbolo"), não só uma nota — "senha fraca" sozinho deixa a pessoa tentando variações no escuro. O olho vai no cadastro e no login; o medidor só no cadastro, porque no login a senha já existe e avaliá-la atrapalharia quem tenta entrar.
  - **Regressão que causei**: o botão tem `aria-label="Mostrar senha"`, então `getByLabel("Senha")` passou a casar com dois elementos e quebrou o helper de login de **toda** a suíte. Corrigido com `getByRole("textbox", { name: "Senha" })`.
- ~~**Cadastro não pedia contato da clínica**~~ — ✅ WhatsApp obrigatório (12/08/2026), com a máscara que já existia (`MaskedTextField` + `PHONE_MASK`). Sem ele, clínica criada pelo cadastro não tinha telefone nem e-mail próprio — só o e-mail do usuário admin —, o que inviabilizava qualquer aviso sobre a conta.
- ~~**Agendamento online não tinha tela**~~ — ✅ 12/08/2026. O backend estava pronto e testado desde 10/08, mas **a página do paciente não existia** — os quatro planos anunciavam "Agendamento online pelo paciente" e não havia para onde mandar ninguém. Agora `/agendar/[subdomain]` (`features/public-booking/`), fora do `(website)` e do `(dashboard)`: é Tailwind como o site, mas sem header/footer institucional — a página é da clínica, não do Crivo. Decisões:
  - **Cascata profissional → procedimento → dia → horário**, a mesma do painel: sem os dois primeiros o backend não tem como calcular horário livre (a grade é de quem atende, a duração do procedimento define se cabe). Procedimento travado até escolher o profissional evita a lista mudar embaixo do que já foi selecionado.
  - **`availability` e `isLoadingSlots` são derivados, não estados sincronizados.** A primeira versão limpava o resultado antigo num `useEffect` e o React Compiler barrou (`setState` síncrono em effect gera render em cascata). Guardando a combinação junto com o resultado, o dado velho é ignorado na leitura — dois `useState` a menos e nenhuma cascata.
  - **Clínica inexistente vira `notFound()`**, não um formulário que nunca funcionaria; `robots: noindex` porque a página é de cada clínica, não conteúdo indexável do Crivo.
  - **`<img>` em vez de `next/image`** para o logo: vem de domínio arbitrário da clínica (white-label) e o otimizador exigiria declarar cada host em `next.config`.
  - Formatador de telefone próprio (`public-booking/phone.ts`) em vez do `PHONE_MASK`: aquele é feito para o `MaskedTextField` (MUI + imask) e esta página não tem MUI.
  - 5 testes E2E (`e2e/agendamento-online.spec.ts`), incluindo o agendamento completo. Verificado ao vivo: `origin: ONLINE`, paciente criado pelo telefone e as duas mensagens enfileiradas.
- ~~**`/painel` deixava a casca aparecer com cookie inválido**~~ — ✅ corrigido em 12/08/2026. O middleware só decodificava o payload do JWT (sem verificar assinatura), então um **token forjado** com `exp` no futuro passava e a casca do painel renderizava vazia até as chamadas voltarem 401 e o `QueryProvider` deslogar. **Nenhum dado real vazava** — o crivo-be rejeita o token —, mas a tela piscava logada. Agora o middleware confirma o token com `GET /users/me` antes de deixar passar, e redireciona para `/login` limpando os cookies inservíveis. Decisões:
  - **Perguntar ao backend em vez de verificar a assinatura localmente**: validar o HMAC no middleware exigiria o `JWT_SECRET` também no frontend — o mesmo segredo em dois lugares, e qualquer rotação precisando lembrar dos dois. O crivo-be continua sendo a única autoridade.
  - **Só 401 derruba a sessão, 403 não.** `GET /users/me` está atrás do `TrialGuard`, então uma clínica com trial vencido recebe 403 — tratá-lo como token inválido a deslogaria em vez de deixá-la ver o aviso de "seu teste acabou". Verificado nos dois casos.
  - **Falha de rede deixa passar**: se o backend está fora do ar, não dá para afirmar que o token é inválido; as chamadas da própria tela cuidam disso.
  - 4 testes E2E novos (`e2e/acesso-painel.spec.ts`): sem cookie, token forjado, sub-rota sensível (`/painel/usuarios`) e cookie que nem é JWT.
- ~~**Quarto plano `Solo` (R$ 79)**~~ — ✅ 12/08/2026. Porta de entrada com 1 profissional, mesmo escopo do Básico. As grades passaram de 3 para 4 colunas (`lg:grid-cols-4` no site, `md: 3` no Grid do painel), e os skeletons de carregamento acompanharam — três placeholders numa grade de quatro deixariam um buraco visível no primeiro paint.
- ~~**As colunas de plano não mostravam diferencial nenhum**~~ — ✅ corrigido em 11/08/2026, dois bugs distintos na mesma informação, cada um numa cópia diferente da lista de features:
  - **Na home**, o card `compact` cortava a lista nos 4 primeiros itens — e os 4 primeiros eram os comuns a todos os planos. As três colunas exibiam literalmente as mesmas linhas, sem nenhum diferencial visível.
  - **No painel**, a lista só recebia `push` da feature **quando o plano a tinha**. O Básico aparecia com uma linha só, e o comprador não tinha como saber o que estava perdendo.
  - **Causa comum**: a lista era montada em dois lugares (`plan-to-pricing-card.ts` e `plan-card.tsx`), e as duas cópias divergiram. Agora existe `features/billing/plan-features.ts` como fonte única, com os diferenciais **primeiro** (para caberem no corte do compacto) e os não inclusos **presentes e riscados**, nunca omitidos. O corte do compacto subiu de 4 para 6, que é o que cobre tudo que varia entre planos.
  - **Tabela comparativa** (`/planos`) também parou de ter as linhas hardcoded — passou a derivar de `planComparableFeatures`, a mesma fonte dos cards. Ela chegou a não citar prontuário nem painel enquanto os planos já os diferenciavam.
  - **Limite de profissionais saiu das linhas booleanas**: é valor, não sim/não. Como linha comum de tabela, "Até 2 profissional(is)" aparecia com ✓ no Básico e ✗ nos planos maiores — lendo como se os caros tivessem menos. Virou uma linha "Profissionais" com o número de cada plano (`2 / Ilimitados / Ilimitados`).
- ~~**Aba Assinatura não mostrava quanto faltava para acabar a franquia**~~ — ✅ 12/08/2026. `features/billing/components/MessageUsageCard`, mesmo padrão visual do `LimitCard` do Snap Financial: número grande é o limite, barra de progresso mostra o consumo, cor muda para `warning` perto do teto. Lê `GET /billing/usage` (`used`/`limit`/`isTrial`) via `useMessageUsage` — falha nessa busca não derruba a tela, o card só some e os planos continuam navegáveis. Texto do aviso ao estourar a cota diz explicitamente que a mensagem **aparece na aba Falhas**, porque é lá que ela vai parar (o backend marca `FAILED`, não fica pendente).
- ~~**Página `/agendar` só mostrava telefone e endereço**~~ — ✅ 12/08/2026. `booking-options` já trazia o resto dos dados da clínica (`email`, horário e dias de funcionamento) mas o frontend não pedia. Dias soltos (`[1,2,3,4,5]`) viram faixa contínua "Seg a Sex" em vez de listar os 5 por extenso; horário em minutos (`businessHoursStart`/`End`) formata como "08:00 às 18:00". O telefone do rodapé passou a usar `formatPhone` (`lib/br-masks`), que já existia para o cadastro mas não estava aplicado aqui — antes aparecia cru (`1133334444`).
- ~~**Agendamento que chegava com a Agenda aberta passava despercebido**~~ — ✅ 13/08/2026. O polling de 8s já trazia a linha nova, mas ela entrava no meio da tabela em silêncio: quem não estava olhando na hora exata não via. Agora `useNewAppointments` guarda os ids do **primeiro** carregamento e marca como novo tudo que aparece depois — com aviso dispensável no topo ("2 agendamentos novos chegaram") e barra lateral roxa só nas linhas que chegaram. Decisões:
  - **Compara com o primeiro carregamento, não com a lista anterior** — comparando com a anterior, o destaque duraria um único ciclo de 8s e sumiria sozinho, tempo curto demais para quem voltou do café.
  - **Lista vazia inicial não vira "estado conhecido"** — tratá-la assim faria a página inteira acender como nova no primeiro poll.
  - **Barra lateral + fundo suave, não cor chapada**: a linha continua legível e o destaque não compete com o chip de status, que é o que a recepção lê primeiro.
  - 🐞 **A primeira versão não funcionava no caso comum** (corrigido no mesmo dia): o aviso saía de `newIds.size`, que só enxerga a página carregada. Como a lista é ordenada por **data de atendimento**, quem marca hoje para daqui a duas semanas cai na página 2+ — e a recepção, na página 1, não via nada. Foi assim que o recurso pareceu "não funcionar" no teste real. Agora a contagem vem de `GET /appointments/new-count?since=`, independente de página e filtro; `newIds` continua local só para destacar a linha **quando ela está visível**. O texto do aviso reflete os dois casos: "destacado(s) na lista abaixo" ou "em outra página da lista" — prometer destaque que não existe seria pior que não avisar.
  - **O E2E cobre só o caminho negativo** ("nada é destacado quando nada chegou"). A versão que criava o agendamento pelo fluxo público ficou refém de estado acumulado — cada execução ocupava um horário do seed e a seguinte não achava vaga — e o `DataGrid` virtualiza as linhas, então a linha nova nem entrava no DOM. Um teste que falha por dado saturado é pior que teste nenhum; o caminho positivo foi verificado à mão, com screenshot.
- ~~**Sem fotos antes/depois, o produto não serve para estética**~~ — ✅ 13/08/2026. Aba **Fotos** na ficha do paciente, agrupada **por atendimento**: uma grade cronológica solta mostraria as mesmas imagens mas perderia o que importa em estética — a comparação. Cada bloco traz data, procedimento e as colunas "Antes" e "Depois" lado a lado. Decisões:
  - **`<img>` e não `next/image`**: a URL é assinada e expira em minutos; o otimizador do Next cacheia por URL e serviria imagem vencida.
  - **Cache curto no React Query** (`gcTime` 4 min, abaixo do TTL da assinatura): uma resposta guardada por mais tempo teria links que não abrem, e a foto apareceria quebrada sem explicação.
  - **Sem botão de download** no lightbox, a pedido: é dado sensível de saúde, e um botão que salva no computador da recepção espalha a cópia para fora de qualquer controle. `onContextMenu` bloqueado também — não é proteção real, mas evita o gesto acidental.
  - **Validação de tipo e tamanho antes de enviar**: subir 5MB para receber 400 gasta o tempo e a rede da clínica.
  - **Exclusão com confirmação inline**, no próprio lightbox — a foto errada precisa sair, mas não por um clique só.
  - **Entrou nas tabelas de plano com linha própria** (`plan-features.ts`, fonte única do site e do painel), embora compartilhe a flag `hasMedicalRecords`: para clínica de estética o antes/depois é o argumento de venda, e escondê-lo dentro de "Prontuário" faria o comprador não ver o que mais lhe interessa. O dialog de downgrade também avisa que **as fotos já enviadas ficam inacessíveis** — quem tem foto guardada precisa ver isso, não deduzir de "prontuário".
- ~~**O painel oferecia o que o plano não inclui**~~ — ✅ 13/08/2026. O backend já recusava com 403 (`PlanFeatureGuard`), mas o frontend não sabia do plano: só tinha `planId`, sem as flags. A clínica no Solo/Básico via aba de Risco de falta, Lista de espera, Prontuário e o toggle de IA — clicava e levava 403 numa tela vazia, sem entender que era limite de plano e não defeito. `GET /tenants/me` passou a devolver `plan` (features + limites) e `usePlanFeatures()` centraliza a decisão. Decisões:
  - **Cadeado, não sumiço.** A aba fica visível, esmaecida, com ícone e tooltip dizendo qual plano inclui. Esconder deixaria a clínica sem saber que o recurso existe — e é justamente essa a diferença entre o plano dela e o de cima.
  - **Trial libera tudo** (`plan: null`), mesma regra do guard no backend: é assim que a clínica experimenta antes de escolher.
  - **Enquanto carrega, libera.** Esconder por padrão faria menu e abas piscarem a cada navegação; errar para o lado permissivo é barato porque o backend recusa de qualquer forma.
  - **Desligar nunca é bloqueado** no toggle de IA: quem está com ele ligado por dado antigo precisa poder desativar.
  - **Isto é conveniência de UI, não segurança** — está escrito no hook, para ninguém confundir depois.
- ~~**Para responder o paciente, a recepção saía do sistema**~~ — ✅ aba **Conversa** na ficha do paciente (12/08/2026). A caixa de entrada só permitia ler e marcar como tratada; responder era pelo WhatsApp da clínica por fora, e aquela resposta não ficava registrada. Agora `features/messages/components/PatientConversation`: envio e recebimento na mesma linha do tempo, com campo de resposta. Decisões:
  - **Montado com MUI base, sem `@mui/x-chat`** — a lib existe e é MIT, mas está em `9.0.0-alpha.16`, e o projeto já carrega um `x-scheduler` em beta. Bolhas com `Paper`/`Stack` e composer com `TextField` custam ~150 linhas e não quebram em upgrade.
  - **Aba visível para STAFF**, diferente de Anamnese/Evolução — responder ao paciente é trabalho da recepção; prontuário não é. Mesma decisão já tomada na caixa de entrada.
  - **`whiteSpace: pre-wrap` nas bolhas** — os templates têm quebra de linha e emoji; sem isso a mensagem vira um parágrafo só, diferente do que o paciente de fato recebeu.
  - **Legenda por bolha mostra tipo + status** ("Lembrete de agendamento · Enviada"): a conversa mistura automático e manual, e a recepção precisa saber o que o sistema já disse antes de repetir. Falha aparece em vermelho com "ligue para o paciente", não escondida.
  - **O snackbar diz "na fila de envio", não "enviada"** — o envio é assíncrono e pode falhar depois; prometer entrega aqui seria a mesma mentira que a lista de falhas existe para desfazer. O campo só limpa em sucesso, para não perder o texto digitado num erro.
  - **Polling de 8s** (`LIVE_REFETCH_INTERVAL_MS`), igual à caixa de entrada: o paciente responde pelo WhatsApp, fora do sistema.
  - 🐞 De quebra: `TYPE_LABELS` não tinha `WAITLIST_OFFER` (o backend manda esse tipo desde 10/08) — a coluna "Tipo" renderizava vazio para oferta de vaga no histórico. 4 testes E2E novos.
- ~~**A confirmação do `/agendar` deixava o paciente no escuro**~~ — ✅ 13/08/2026. Depois de marcar, a tela dizia "não precisa fazer mais nada" e nada acontecia: o paciente não recebia a mensagem na hora (o envio passa por fila) e ficava sem saber se tinha dado certo. Agora tem uma barra de 20s ("Enviando a confirmação no seu WhatsApp… 18s") que, ao zerar, vira orientação de fallback com o telefone da clínica. Decisões:
  - **A barra NÃO reconsulta dado** — é uma contagem de tempo. Buscar o status real exigiria uma rota pública nova devolvendo dado de agendamento numa página aberta na internet, o oposto da decisão de manter a resposta de `booking-options` enxuta. O que o paciente precisa não é do status: é de um prazo e de um plano B.
  - **Conta por `Date.now()`, não somando ticks** — aba em segundo plano tem `setInterval` estrangulado pelo navegador; a soma de ticks travaria a barra pela metade ao voltar para a aba.
  - **Mostra segundos, não porcentagem** — "faltam 12s" é a informação que a pessoa quer; "40%" não diz de quê.
  - **O fallback diz "seu horário está reservado de qualquer forma"** — a mensagem pode falhar (WhatsApp da clínica fora do ar), mas o agendamento existe. Sem essa frase, o paciente que não recebe nada assume que precisa marcar de novo.
  - **Botão "Marcar outra consulta"** — antes, quem precisava de um segundo horário (outro procedimento, ou marcar para um familiar) só saía dali recarregando a página na mão. O `reset()` zera a seleção inteira, não só esconde a confirmação: manter profissional/procedimento/dia preenchidos faria a pessoa remarcar o mesmo horário sem perceber. `options` fica em cache — é a lista da clínica, não escolha do paciente.
  - Componente migrado de Tailwind para MUI no caminho: era o último pedaço da página pública fora do padrão. 2 testes E2E novos.
- ~~**Campo "Dia" do agendamento público era um `<input type="date">` nativo**~~ — ✅ 12/08/2026. Único calendário do produto fora do padrão MUI `DatePicker` usado em todo o painel (`SlotPicker` da Agenda, filtros, lista de espera). Trocado, com `disablePast` e `shouldDisableDate` cinza nos dias fora de `clinic.businessDays` — o dado que a entrega anterior (dados de contato/horário) já tinha trazido para essa página, mas que ainda não era usado para nada. Efeito colateral corrigido de graça: o card de horário vazio mostrava o enum cru do backend (`WINDOW_PASSED`) em vez de texto em português — agora traduzido, igual ao `emptySlotsMessage` do painel. E2E adaptado para o padrão de `agendamento.spec.ts` (`getByRole("spinbutton", { name: "Dia" })`, já que o `DatePicker` expõe três elementos com o mesmo rótulo e `getByLabel` casa com os três).

- ~~**O painel media faltas em contagem, não em dinheiro**~~ — ✅ 13/08/2026. `NoShowCostCard` no topo do `/painel`, acima dos cards de contagem: "As faltas custaram este mês · R$ 350,00 · 1 paciente faltou". Veio da análise do Agendiva, que vende *"recupere até R$ 1.500/mês"* enquanto nós vendíamos mecanismo — e o dado para a conta (`priceInCents`, congelado no ato do agendamento) já existia sem ninguém usar. Decisões:
  - **Fica acima dos `SummaryCards`** — "R$ 350,00 perdidos" é o que faz o dono da clínica agir; "25 pacientes" é contexto. A ordem na tela é a ordem da urgência.
  - **Não diz "R$ X recuperados pela lista de espera"**, que seria o número mais vendável: `WaitlistEntry` vira `OFFERED` e nunca registra se a oferta virou agendamento. O que aparece é "falta evitada" (compareceu **e** confirmou pelo WhatsApp).
  - **A taxa só aparece com 5+ atendimentos concluídos** — "100% de faltas" com um único atendimento no mês é ruído apresentado como diagnóstico.
  - **Mês sem falta vira card verde**, não um card de alerta zerado: notícia boa com moldura de alerta se lê como problema.
  - Rota `GET /dashboard/no-show-cost` fora do `hasDashboard`, como o `summary` — esconder isso de quem está no Solo esconderia o próprio argumento de venda.
- ~~**O resumo do painel estava travado por plano**~~ — ✅ 13/08/2026. `hasDashboard` cobria o `/painel` inteiro, então a clínica no Solo abria o sistema e a **primeira coisa** que via era uma tela de erro. A trava passou a ser por rota: resumo e custo das faltas abertos a todos, gráficos e faturamento seguem pagos. No lugar dos gráficos, `UpgradeChartsCard` convida ao upgrade — quem não tem o recurso vê o que está perdendo, em vez de um buraco na página.

- ~~**A tabela de preços era hipótese redonda**~~ — ✅ 14/08/2026. Site e painel passaram a mostrar **R$ 49 / 89 / 179 / 299** (antes 79/149/289/399), lendo tudo de `GET /plans` como já faziam. Mudanças na apresentação:
  - **Prontuário e fotos saíram da lista de diferenciais** para a base comum. Com `hasMedicalRecords` valendo em todos os planos, mantê-los entre os diferenciais mostraria ✓ em todas as colunas e não separaria nada.
  - **A franquia de mensagem virou linha de feature** ("500 mensagens de WhatsApp por mês"). Cada mensagem tem custo real; esconder o teto criaria a surpresa que o produto existe para evitar.
  - **O `detail` do card deixou de repetir o limite de profissionais** — a primeira linha de features já o diz. Passou a dizer o que a lista não diz: "14 dias grátis, sem cartão".
  - **As chaves antigas seguem mapeadas** (`BASICO`, `INTERMEDIARIO`, `AVANCADO`): os planos continuam no banco como inativos, e clínica que assinou um deles precisa continuar vendo o próprio plano na tela de Assinatura — sem a entrada, o card apareceria sem estilo e sem descrição.
  - ⚠️ **O preço do profissional adicional NÃO é anunciado**, embora exista no plano e no Stripe: o backend ainda recusa cadastro acima do teto. Mostrá-lo prometeria algo que o sistema nega na hora — a mesma divergência site×sistema que a auditoria de 13/08 removeu.
- ~~**Conectar o WhatsApp exigia alguém do time**~~ — ✅ 14/08/2026. Aba **WhatsApp** nas Configurações (`features/tenant/components/WhatsAppConnection`): a clínica clica em "Conectar WhatsApp", lê o QR no celular e a tela avisa sozinha quando pareia. Antes, o vínculo era um campo de texto onde ela digitava o "nome da instância" da Evolution — pergunta que nenhum dono de clínica sabe responder, e ainda por cima texto livre que permitia apontar para a instância de outra clínica. Decisões:
  - **A aba não aparece para STAFF** — no backend até a leitura é ADMIN (`whatsapp-connection` responde 403), então ela abriria só para mostrar erro.
  - **Polling de 3s enquanto pareia**, e não os 8s de `LIVE_REFETCH_INTERVAL_MS`: com o QR na frente, alguém está olhando e esperando — 8s depois de ler o código parecem travamento.
  - **Mostra o número conectado**, não só "Conectado": é assim que a clínica confere que pareou o telefone certo.
  - **Desconectar pede confirmação dizendo a consequência** ("seus pacientes deixam de receber lembretes"). A consequência é invisível — a clínica só descobriria quando alguém faltasse.
  - **A tela nunca exibe o nome da instância** (há teste E2E para isso): é detalhe do servidor Evolution, não ajuda a clínica e ajudaria quem quisesse alcançar a instância de outra.
  - 🐞 **O QR aparecia e sumia sozinho 3s depois**, com "Aguardando leitura" ainda na tela — achado olhando o navegador, não pelos testes. Só o `POST` gera código; o `GET` do polling devolve `qrCode: null` e sobrescrevia o cache do React Query. Corrigido com `structuralSharing`, que preserva o QR enquanto o pareamento segue pendente.
  - 4 testes E2E contra a Evolution API real, com `beforeEach` que zera a conexão pela API: sem isso, o teste do QR deixava o seguinte num estado que não era o que ele descrevia — e teste que passa conforme a ordem é pior que teste ausente.
- ~~**A home vendia mecanismo, não dinheiro**~~ — ✅ 13/08/2026. A manchete era *"O motor que evita buracos na sua agenda"*: bonita, mas o dono da clínica precisava traduzir sozinho para reais — enquanto o Agendiva abre com *"recupere até R$ 1.500/mês que sua clínica perde com faltas"*. Agora é *"Cada falta leva embora o faturamento do dia"*, e logo depois da seção de dor entra a **`LossCalculator`**. Decisões:
  - **A conta é do visitante, não nossa** — ele informa faltas por semana e ticket médio. Copiar o "R$ 1.500" do concorrente exigiria um cliente que não temos, e inventar número contradiz a régua do produto (a medição de acurácia se recusa a concluir com menos de 30 casos). Assim o número é grande e é dele.
  - **4,33 semanas por mês** (52/12), não 4 — arredondar subestimaria a perda em ~8%, e subestimar enfraquece o próprio argumento.
  - **A ressalva fica colada no número**: "nenhuma ferramenta zera as faltas — o Crivo age sobre as que dá para evitar". Sem ela, o total insinua que assinar recupera tudo aquilo.
  - **Campo zerado pede o dado** em vez de exibir "R$ 0,00 por ano", que se lê como defeito, não como resposta.
  - Entra **depois** da dor e **antes** da lista de recursos: recurso só interessa a quem já aceitou que tem o problema.
- ~~**O site falava em jargão de engenharia**~~ — ✅ 13/08/2026. "Predição de no-show", "tríade integrada", "multi-tenant white-label" e "retry com backoff" saíram da home, da tabela de planos e do rodapé. Um teste E2E (`home.spec.ts`) falha se voltarem. A revisão achou **quatro afirmações erradas**, não só mal escritas — o tipo de dívida que só aparece na renovação do contrato:
  - **"Preço por profissional ativo"** — a cobrança é mensalidade fixa por faixa. Prometia uma conta diferente da que o Stripe cobra. ⚠️ **Correção de leitura (14/08/2026)**: remover o texto tirou a mentira, mas apagou a evidência de um problema real — esse é **o modelo que o mercado usa e nós não** (Agendiva: base + R$ 29,90 por profissional extra). Somos ~2x na entrada e o degrau entre faixas pune quem cresce. Registrado como decisão de preço pendente no [ROADMAP do backend](../../crivo-be/ROADMAP.md).
  - **"Disponível a partir do plano Clínica"** — plano extinto na migração para Básico/Intermediário/Avançado. Conferido em `GET /plans`: a predição liga no **Intermediário**.
  - **"Relatórios consolidados para múltiplas unidades"** — não existe em linha nenhuma de código (a mesma família de promessa falsa que a auditoria de 11/08 já tinha removido dos planos). ⚠️ Mas o **Agendiva entrega** multi-unidade por R$ 99,90 + R$ 79,90/clínica extra: aqui também não é só texto errado, é lacuna de produto — registrada na Fase 4 do backend.
  - **Predição e financeiro marcados "em desenvolvimento"** — os dois estão no ar desde 10 e 11/08; subestimar o produto entregue custa venda tanto quanto exagerar.

### Fase 3 — Qualidade

- ~~**Não há infraestrutura de teste no projeto**~~ — ✅ **parcialmente resolvido em 10/08/2026**: Playwright com 17 testes E2E (`e2e/`, ver `e2e/README.md`). Rodam contra o backend real, não contra mocks — os dois bugs que motivaram a suíte nasceram na costura entre as pontas. Validado com **três execuções seguidas** sem falha, o que é o teste de verdade: a primeira versão tinha um teste instável (passava sozinho, falhava na suíte), e teste instável é pior que teste ausente.
  - **Ainda falta o teste unitário.** `error-messages.ts` (sete regras de regex) e a prévia de marcadores em `MessageTemplates` continuam validados só à mão. São lógica pura, o tipo que E2E cobre mal e teste unitário cobre bem.
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
- **Não há runner de teste unitário** (nem Vitest nem Jest instalado) — só Playwright. O bug do contador de trial (13/08/2026) é exatamente o tipo que um teste unitário pegaria em segundos e que E2E não pega: lógica pura, dependente de relógio, cujo erro aparece só numa janela de horas do dia. Validei por execução direta com relógio fixo, o que funciona mas não fica no repositório protegendo contra regressão. **Instalar Vitest é o próximo passo de qualidade**, e `src/lib/trial.ts` + `error-messages.ts` são os primeiros candidatos.

## Armadilha resolvida: pelo túnel, a página abria mas nada funcionava

O link de confirmação (`/c/:token`) que vai no WhatsApp aponta, em dev, para
um túnel (ngrok/Cloudflare). A página **abria normalmente**, mas o botão
"Confirmar presença" não fazia nada: nenhum POST saía, nenhum erro na tela e
nada no console do servidor. Em `localhost` o mesmo botão funcionava.

São **duas** proteções do Next contra cross-origin, e as duas precisam ser
liberadas — resolver só uma mantém o sintoma idêntico:

1. **`allowedDevOrigins`** — o Next bloqueia *assets de desenvolvimento* em
   requisição cross-origin. O HMR falhava (WebSocket 503) e **a página não
   hidratava**; sem hidratação o React nunca anexa o `onClick`, e o botão
   vira HTML estático. Esta era a causa do sintoma observado.
2. **`serverActions.allowedOrigins`** — o Next compara `Origin` com `Host` e
   aborta a Server Action quando diferem (CSRF). Só aparece depois que a
   hidratação volta, mas quebraria o envio do mesmo jeito.

A segunda vale só fora de produção: lá o domínio é fixo, os headers batem, e
um curinga de túnel enfraqueceria o CSRF sem ganho nenhum.

**Lição de diagnóstico:** "abre mas não reage" quase sempre é hidratação, não
lógica de componente. Checar `__reactFiber` no elemento distingue os dois em
segundos — se a chave não existe, o problema está no carregamento do bundle,
não no `onClick`.

## Armadilha resolvida: contador de trial arredondava para cima

`Math.ceil` nos dias restantes do trial parecia inofensivo e tinha **dois**
defeitos, um deles visível para o cliente pagante:

1. **Trial de 14 dias recém-criado mostrava "15 dias restantes"** — o produto
   prometia na tela um dia a mais do que entrega.
2. **O contador travava no primeiro número por quase 24h.** Quem assinou
   ontem às 15h via "14 dias" no dia seguinte ao meio-dia (faltavam 13,26 —
   `ceil` devolve 14). Foi assim que o bug foi notado.

**Fix**: `Math.floor`, extraído para `src/lib/trial.ts` como fonte única —
a conta estava **duplicada** entre o banner do painel e a tela de Assinatura,
e as duas cópias teriam que ser corrigidas juntas. `floor` responde à pergunta
que a clínica faz ("quantos dias inteiros ainda tenho?") e deixa as horas
quebradas a favor do cliente: quem vê "0 dias" ainda tem até o horário exato
de `trialEndsAt`, e quem corta o acesso é o `SubscriptionGuard` no backend,
nunca este número. Efeito colateral bom: os textos do banner ficaram
precisos — "acaba hoje" agora aparece faltando menos de 24h, e não "amanhã"
como antes.

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
