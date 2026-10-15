# 🚀 Crivo Sync — LinkedIn Post

> Conteúdo pronto pra copiar/colar. Abaixo: a versão **POST** (curta, pra feed) e a
> versão **DETALHADA** (pra quem clicar em "ver mais" / artigo). Troque os
> `[colchetes]` pelos seus links antes de publicar.

---

## 🇧🇷 Versão em Português

### ✂️ POST (feed)

Projeto bem legal de estudos que acabou sendo um sistema completo de agendamento

Toda clínica de estética e odontologia perde dinheiro com paciente que marca e não aparece. Isso não é opinião — é o número que toda recepção conhece de cor e nenhum sistema mostra.

Resolvi construir o sistema que mostraria. Começou como um CRUD de agenda, mas quanto mais eu entendia o problema, mais claro ficava que a falta não é um evento aleatório — tem padrão, tem sinal, e dava pra agir antes dela acontecer.

Assim nasceu o **Crivo Sync**: uma plataforma whitelabel de gestão para clínicas, com agenda, prontuário, cobrança automática por WhatsApp e um modelo que aponta o risco de falta de cada consulta antes que ela aconteça.

- 🌐 **Painel:** Next.js 16 + React 19 + MUI, multi-tenant por subdomínio
- ⚙️ **Backend:** NestJS + Prisma + PostgreSQL, Clean Architecture (domínio isolado de framework)
- 🎯 **Events:** Cron, RabbitMQ, Redis
- 🤖 **IA:** DeepSeek reescreve o lembrete de WhatsApp com o tom da clínica — nunca decide um fato, só redige
- 💳 **Billing:** Stripe com planos por porte de clínica, upgrade e adicional de profissional em tempo real

E os problemas de engenharia que mais me ensinaram:

- **Corrida no agendamento:** duas pessoas clicando no mesmo horário ao mesmo tempo — resolvido com constraint de exclusão no Postgres (`EXCLUDE ... USING gist`), não checagem em memória.
- **Fuso horário em produção:** o container de deploy roda em UTC; o expediente da clínica não. Um bug clássico que só aparece longe do ambiente de dev.
- **IA com rédea curta:** o modelo escreve a mensagem, mas nunca inventa nome, data ou link — se ele erra um dado, o sistema descarta e cai no template fixo, sem intervenção humana.

Links 👇

[Crivo Sync](https://crivosync.g3developer.com.br/)

#FullStack #NextJS #NestJS #TypeScript #PostgreSQL #IA #SaaS #Whitelabel #Prisma #Stripe

---

### 📖 Versão DETALHADA (artigo / "ver mais")

#### A origem

O ponto de partida foi uma queixa que toda recepção de clínica repete: "marcou e não veio". Fui atrás de entender o tamanho real do problema antes de escrever qualquer linha de código — e o número assustou. Clínica de porte médio perde uma fatia relevante da agenda todo mês só em não comparecimento, e a maioria não mede isso em dinheiro, só em "vaga vazia".

Comecei pelo básico: cadastro de paciente, agenda, confirmação por WhatsApp. Mas o básico não resolvia o problema de verdade — só documentava a falta depois que ela já tinha acontecido. Foi aí que o projeto virou outra coisa: em vez de só registrar a falta, prever quem tende a faltar e agir antes.

Assim nasceu o **Crivo Sync**: uma plataforma whitelabel completa de gestão para clínicas de estética e odontologia — agenda, prontuário, confirmação automática, lista de espera que se preenche sozinha, e um modelo de risco de falta construído em cima do histórico real de cada paciente.

#### A stack de verdade

| Camada              | Tecnologias                                                                | Deploy   |
| ------------------- | -------------------------------------------------------------------------- | -------- |
| **Painel (web)**    | Next.js 16 · React 19 · MUI · React Hook Form + Zod · React Query          | Vercel   |
| **API**             | NestJS · Prisma 7 · PostgreSQL · class-validator · BullMQ + Redis          | Railway  |
| **Banco**           | PostgreSQL (Supabase) — pooler + conexão direta para migration             | Supabase |
| **IA & mensageria** | DeepSeek (reescrita de lembrete) · WhatsApp Cloud API / Evolution API      | —        |
| **Billing**         | Stripe — assinatura por porte de clínica, upgrade e profissional adicional | —        |

#### Os números

- **~46.000 linhas** de TypeScript entre painel e API
- **16 módulos de domínio** no backend (agenda, prontuário, mensageria, predição, billing, whitelabel...)
- **300+ testes automatizados** cobrindo use cases isolados
- **1 constraint de banco** (`EXCLUDE USING gist`) fechando uma corrida que nenhum teste unitário pega sozinho

#### O que o app faz

- 📅 **Agenda inteligente:** grade por profissional, bloqueio de horário, expediente por clínica, tudo validado no fuso da clínica, não no fuso do servidor.
- 🔔 **Confirmação automática:** lembrete por WhatsApp, confirmação com um toque, e lista de espera que oferece a vaga automaticamente quando alguém cancela.
- 🤖 **Risco de falta:** cada consulta futura recebe uma classificação de risco baseada no histórico do paciente — recepção prioriza a ligação de confirmação em quem realmente precisa.
- 🩺 **Prontuário clínico:** anamnese, evolução e fotos por paciente, no mesmo painel da agenda.
- 🎨 **Whitelabel de verdade:** cada clínica tem sua própria logo, cor e subdomínio — o paciente que agenda pela página pública nem sabe que existe um "Crivo Sync" por trás.

#### Problemas reais que precisei resolver

- **Reserva dupla sob corrida:** a checagem de conflito de horário rodava em memória — segura no caso comum, mas duas requisições simultâneas para o mesmo profissional e horários que se sobrepõem (não necessariamente idênticos) ainda passavam as duas. A solução definitiva não é aplicação, é banco: uma `EXCLUDE CONSTRAINT ... USING gist` com `btree_gist`, que o Postgres recusa no nível da escrita, não da leitura anterior. Testei com inserts genuinamente concorrentes (`Promise.all`) até confirmar que só um sobrevive.
- **Fuso horário silencioso:** todo o cálculo de expediente e disponibilidade usava `Date.getHours()`/`getDay()` do processo Node — funciona em dev porque a máquina já está no fuso certo, e quebra silenciosamente em produção porque o container roda em UTC por padrão. Escrevi uma camada só para isso, baseada em `Intl.DateTimeFormat`, e validei rodando a suíte inteira forçando `TZ=UTC` — sem isso o bug só apareceria depois do deploy, com clínica reclamando de horário "errado" sem ninguém entender por quê.
- **IA que nunca inventa fato:** o modelo de linguagem reescreve o tom da mensagem de WhatsApp por clínica, mas nome do paciente, data, hora e link de confirmação são sempre validados literalmente contra o dado real depois da geração. Se a IA omitir ou alterar qualquer um deles, a mensagem é descartada e o sistema cai no template fixo — silenciosamente, sem expor erro de IA para o paciente.
- **Multi-tenant de verdade:** toda query passa por `tenantId`, e o teste de segurança que mais valeu a pena escrever foi o de tentar acessar dado de uma clínica logado como outra.

#### Decisões de arquitetura

- **Clean Architecture no backend:** casos de uso isolados de Prisma e de HTTP. Trocar o provider de WhatsApp ou o modelo de IA não deveria (e não devolveu) tocar regra de negócio nenhuma.
- **Regra de negócio nunca no frontend:** cálculo de limite de plano, validação de horário e risco de falta vivem só na API — o painel e a página pública de agendamento só exibem o que o backend decidiu.
- **Banco como última linha de defesa:** para invariantes que realmente importam (não pode haver dois agendamentos no mesmo horário), a aplicação valida primeiro por experiência de uso, mas quem garante de verdade é uma constraint no Postgres — porque aplicação escala horizontalmente e banco continua sendo a única fonte de verdade compartilhada.

#### Por que um projeto pessoal dessa escala?

O Crivo Sync não nasceu como startup — nasceu como a pergunta "dá pra prever falta de paciente com o que já está no banco?". Foi crescendo porque cada resposta abria um problema de engenharia novo: concorrência, fuso horário, IA com guardrail, billing com upgrade no meio do ciclo, whitelabel de verdade.

Construir isso sozinho, do banco ao billing, força decisão de arquitetura o tempo inteiro sem ninguém para revisar por você — e a régua vira "isso resolve o problema real da clínica" em vez de "isso está bonito na demo".

#### Bora trocar ideia?

Sempre aberto a conexões, papos sobre engenharia de software e produto B2B.

📩 **Contato:** [seu-email] · [seu-LinkedIn] · [seu-site/portfólio]

---

> 💡 **Dica de publicação:** poste a versão curta no feed com 1–2 **screenshots** ou um **vídeo curto** do app. O algoritmo do LinkedIn favorece mídia nativa + as primeiras 3 linhas como gancho. Responda os comentários nas primeiras 2h para ampliar o alcance.

---

---

## 🇺🇸 English Version

### ✂️ POST (feed)

Every aesthetic and dental clinic loses money to patients who book and never show up. That's not an opinion — it's the number every front desk knows by heart and no system ever surfaces.

So I built the system that would surface it. It started as a scheduling CRUD, but the more I understood the problem, the clearer it became that no-shows aren't random — they have a pattern, a signal, and you can act on it before it happens.

That's how **Crivo Sync** was born: a whitelabel management platform for clinics, with scheduling, medical records, automated WhatsApp confirmations, and a model that flags no-show risk for each appointment before it happens.

- 🌐 **Dashboard:** Next.js 16 + React 19 + MUI, multi-tenant by subdomain
- ⚙️ **Backend:** NestJS + Prisma + PostgreSQL, Clean Architecture (domain isolated from framework)
- 🤖 **AI:** DeepSeek rewrites the WhatsApp reminder in the clinic's tone — it never decides a fact, only drafts the wording
- 💳 **Billing:** Stripe with plans by clinic size, real-time upgrades and extra-professional pricing

And the engineering problems that taught me the most:

- **Booking race condition:** two people clicking the same slot at the same time — solved with a Postgres exclusion constraint (`EXCLUDE ... USING gist`), not an in-memory check.
- **Timezone in production:** the deploy container runs in UTC; the clinic's business hours don't. A classic bug that only shows up far from the dev environment.
- **AI on a short leash:** the model writes the message, but never invents a name, date, or link — if it gets a fact wrong, the system discards the output and falls back to the fixed template, no human intervention needed.

Links 👇

[paste your dashboard or landing page link here]

#FullStack #NextJS #NestJS #TypeScript #PostgreSQL #AI #SaaS #Whitelabel #Prisma #Stripe #SoftwareEngineering

---

### 📖 DETAILED version (article / "see more")

#### The origin

The starting point was a complaint every clinic front desk repeats: "they booked and never came." I went after the real size of the problem before writing a single line of code — and the number was alarming. A mid-size clinic loses a meaningful slice of its schedule every month to no-shows alone, and most don't measure it in money, only in "empty slot."

I started with the basics: patient records, scheduling, WhatsApp confirmation. But the basics didn't solve the actual problem — they only documented the no-show after it already happened. That's when the project became something else: instead of just logging the miss, predict who's likely to miss and act before it happens.

That's how **Crivo Sync** was born: a full whitelabel management platform for aesthetic and dental clinics — scheduling, medical records, automatic confirmation, a waitlist that fills itself, and a no-show risk model built on each patient's real history.

#### The actual stack

| Layer               | Technologies                                                           | Deploy   |
| ------------------- | ---------------------------------------------------------------------- | -------- |
| **Dashboard (web)** | Next.js 16 · React 19 · MUI · React Hook Form + Zod · React Query      | Vercel   |
| **API**             | NestJS · Prisma 7 · PostgreSQL · class-validator · BullMQ + Redis      | Railway  |
| **Database**        | PostgreSQL (Supabase) — pooled + direct connection for migrations      | Supabase |
| **AI & messaging**  | DeepSeek (reminder rewriting) · WhatsApp Cloud API / Evolution API     | —        |
| **Billing**         | Stripe — plans by clinic size, upgrades and extra-professional pricing | —        |

#### The numbers

- **~46,000 lines** of TypeScript across dashboard and API
- **16 domain modules** on the backend (scheduling, medical records, messaging, prediction, billing, whitelabel...)
- **300+ automated tests** covering isolated use cases
- **1 database constraint** (`EXCLUDE USING gist`) closing a race condition no unit test catches on its own

#### What the app does

- 📅 **Smart scheduling:** per-professional grid, time-off blocking, per-clinic business hours — all validated in the clinic's timezone, not the server's.
- 🔔 **Automatic confirmation:** WhatsApp reminders, one-tap confirmation, and a waitlist that automatically offers the opening when someone cancels.
- 🤖 **No-show risk:** every upcoming appointment gets a risk score based on the patient's real history — front desk prioritizes confirmation calls where they actually matter.
- 🩺 **Clinical records:** anamnesis, progress notes, and photos per patient, in the same dashboard as scheduling.
- 🎨 **Real whitelabel:** every clinic gets its own logo, color, and subdomain — the patient booking through the public page never even sees "Crivo Sync" behind it.

#### Real problems I had to solve

- **Double-booking under a race:** the slot-conflict check ran in memory — safe for the common case, but two simultaneous requests for the same professional with overlapping (not necessarily identical) time ranges still both passed. The real fix isn't application-level, it's the database: an `EXCLUDE CONSTRAINT ... USING gist` with `btree_gist`, which Postgres rejects at write time instead of relying on a prior read. Verified it by firing genuinely concurrent inserts (`Promise.all`) until only one survived.
- **Silent timezone bug:** every business-hours and availability calculation used the Node process's `Date.getHours()`/`getDay()` — works fine in dev because the machine is already in the right timezone, and breaks silently in production because the container defaults to UTC. I built a dedicated layer around `Intl.DateTimeFormat` and validated the entire test suite by forcing `TZ=UTC` — without that, the bug would only surface after deploy, with a clinic complaining about "wrong" hours and no one sure why.
- **AI that never invents a fact:** the language model rewrites the tone of each WhatsApp message per clinic, but patient name, date, time, and confirmation link are always validated literally against the real data after generation. If the AI omits or alters any of them, the message is discarded and the system falls back to the fixed template — silently, without exposing an AI failure to the patient.
- **Real multi-tenancy:** every query is scoped by `tenantId`, and the most valuable security test I wrote was trying to access one clinic's data while logged in as another.

#### Architecture decisions I'm proud of

- **Clean Architecture on the backend:** use cases isolated from Prisma and HTTP. Swapping the WhatsApp provider or the AI model shouldn't (and didn't) touch a single line of business logic.
- **Business logic never in the frontend:** plan-limit calculation, schedule validation, and no-show risk all live in the API only — the dashboard and the public booking page just render what the backend decided.
- **The database as the last line of defense:** for invariants that really matter (no two appointments in the same slot), the application validates first for UX, but what actually guarantees it is a Postgres constraint — because the application scales horizontally and the database stays the one shared source of truth.

#### Why build a personal project at this scale?

Crivo Sync didn't start as a startup — it started as the question "can I predict a patient no-show from what's already in the database?" It grew because every answer opened a new engineering problem: concurrency, timezones, AI with guardrails, mid-cycle billing upgrades, real whitelabeling.

Building this solo, from the database to billing, forces architecture decisions constantly with no one to review them for you — and the bar becomes "does this solve the clinic's real problem" instead of "does this look good in the demo."

#### Let's connect?

Always open to making connections, swapping engineering war stories, and talking B2B product.

📩 **Contact:** [your-email] · [your-LinkedIn] · [your-portfolio]

---

> 💡 **Posting tip:** post the short version in the feed with 1–2 **screenshots** or a short **video** of the app. LinkedIn's algorithm favors native media + the first 3 lines as a hook. Reply to comments within the first 2 hours to boost reach.

---

---

# 🎬 Guia de mídia — vídeo demo + screenshots

> Roteiro para produzir a mídia que acompanha o post. Dica: grave em **vertical (9:16)** ou **quadrado (1:1)** para ocupar mais tela no feed mobile.

## 📹 Roteiro do vídeo demo (30s)

Grave a tela (celular ou navegador). **Sem narração** — o feed roda no mudo por padrão. Use os textos abaixo como **legendas sobrepostas na tela** (overlay), uma por cena. Fonte grande, alto contraste, posicionada no topo ou centro do vídeo.

| Tempo      | Cena (tela)                                                                                                  | Texto na tela (overlay)                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| **0-3s**   | Abre direto na **Agenda** do painel (`(dashboard)/painel/agenda`). Sem splash, sem intro.                    | `Construí um sistema de gestão pra clínicas — sozinho.`         |
| **3-8s**   | Paciente tenta marcar dois horários que se sobrepõem → sistema recusa com a mensagem de conflito.            | `Duas pessoas, mesmo horário: só uma fica. Garantido no banco.` |
| **8-14s**  | Abre a tela de **Risco de falta** (`(dashboard)/painel/agenda/risco`), mostrando as consultas classificadas. | `A IA aponta quem tende a faltar antes de faltar.`              |
| **14-20s** | Página pública de agendamento (`/agendar/[subdomain]`) — clínica com a própria marca, cor e logo.            | `Cada clínica com a própria cara. Whitelabel de verdade.`       |
| **20-25s** | Lembrete chegando no WhatsApp, com o texto reescrito no tom da clínica.                                      | `Lembrete automático, no tom da clínica.`                       |
| **25-30s** | Logo do Crivo Sync em tela cheia.                                                                            | `Painel + Agendamento público · Agora em produção 🎉`           |

**Regras de ouro do vídeo:**

- **Os primeiros 2 segundos decidem tudo:** comece já com o app rodando, evite telas de carregamento.
- **Cortes rápidos:** de 2 a 5 segundos por cena.
- Grave com dados realistas (nome de paciente e clínica de verdade simulados, nunca "Teste 123" ou campos vazios).
- Suba o vídeo direto (nativo) no LinkedIn — evite link externo de YouTube/Vimeo.

## 🖼️ Screenshots — lista priorizada

| #        | Tela                                                                  | Por que entra                                                                          |
| -------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **1 ⭐** | **Agenda** do painel, com horários preenchidos                        | Capa. Primeira impressão — precisa parecer um sistema em uso real, não uma demo vazia. |
| **2 ⭐** | **Risco de falta** por consulta                                       | O grande diferencial do produto. É o que separa "agenda" de "agenda inteligente".      |
| **3 ⭐** | **Página pública de agendamento** com a marca de uma clínica fictícia | Mostra o whitelabel funcionando de ponta a ponta.                                      |
| **4 ⭐** | **Lembrete de WhatsApp** recebido no celular                          | Prova social do fluxo — sai do painel e chega no bolso do paciente.                    |
| **5 ⭐** | **Tela de planos/billing**                                            | Mostra que é um produto pronto para cobrar, não só um protótipo.                       |
