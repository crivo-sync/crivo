# Roadmap — Crivo

Onde estamos, o que a concorrência já entrega e o que falta construir.

> Última atualização: 2026-08-06 (webhook de entrada + reenvio manual entregues).
> **Fase 1 não está completa**: seguem abertos os templates editáveis, a
> confirmação por resposta e a caixa de entrada — e a Meta foi adiada por custo,
> então o WhatsApp roda em Evolution com risco de banimento assumido.
> Análise competitiva baseada em material público consultado em 30/07/2026 —
> preços não reconfirmados desde então.

---

## Onde estamos hoje

| Módulo | Status |
| --- | --- |
| `auth` | 🟢 Registro, login, refresh com rotação, RBAC (ADMIN/STAFF) |
| `tenants` | 🟢 CRUD + branding público por subdomínio |
| `users` | 🟢 Gestão de equipe (ADMIN) |
| `patients` | 🟢 CRUD, busca, paginação, soft delete, **importação por CSV com prévia** |
| `scheduling` | 🟢 Profissionais, procedimentos, agenda com conflito de horário, ciclo de status, grade semanal por profissional e bloqueio de agenda, **quadro visual com todos os profissionais (05/08/2026)** |
| `messaging` | 🟢 Lembrete D-1, confirmação pelo paciente (página + link), retry, lista de falhas com **reenvio manual**, painel da fila e **webhook de entrada** (06/08/2026). ⚠️ A Meta foi **adiada por custo**: o provider é `evolution`, com risco de banimento assumido — ver [Riscos](#riscos). A mensagem do paciente é gravada mas **ainda não lida** (sem confirmação por resposta nem caixa de entrada) |
| `prediction` | ⚪ **Não iniciado — zero linha de código.** Não é dívida escondida, é feature não começada. Ver [Predição](#predição--o-que-existe-de-verdade-hoje) |
| `medical-records` | 🟢 Anamnese + evolução append-only, restrito a ADMIN/PROFESSIONAL (04/08/2026). Falta anexos |
| `billing` | ⚪ Não iniciado |

Temos base sólida de cadastro e agenda, e a comunicação (WhatsApp + confirmação pelo paciente) funcionando em dev. **O que diferencia o produto — a predição — segue em zero.** A tríade agenda + comunicação + predição está em dois terços.

---

## A dor que valida o produto

> Relato de campo (julho/2026): numa consulta, a recepcionista explicou que **não enviou a confirmação porque "o WhatsApp deles tinha caído"** — e que o plano ficou pesado demais para a clínica pagar. Ela ligou no telefone, uma por uma.

Esse episódio não é anedota: é o resumo do mercado.

**O que ele revela:**

1. **A automação de WhatsApp das clínicas é frágil.** "Caiu" quase sempre significa API não oficial (tipo Evolution API) — uma camada que roda sobre o WhatsApp Web, barata e fácil de subir, mas que a Meta não autoriza. Em 2026 a detecção passou a olhar a *impressão digital da conexão*, não só o volume: contas de baixo volume também estão sendo restringidas, e o banimento é permanente, sem aviso e sem recurso.
2. **O custo dói.** Clínica pequena não sustenta plano caro de disparo. Quando aperta, corta a automação — justamente a função que evita a falta que custa mais caro que a mensalidade.
3. **Quando a automação falha, o trabalho volta pra recepção.** Ligar paciente por paciente é exatamente as "3h/semana" que os concorrentes prometem economizar. A promessa é feita, mas quebra na prática.

**O que isso significa para o Crivo:**

- **Confiabilidade é feature, não detalhe de infraestrutura.** Um concorrente com feature list maior e WhatsApp instável perde para um com menos features e envio que não cai.
- **A Meta Cloud API oficial segue sendo o destino**, mas ⚠️ **não é o presente**: em 05/08/2026 a adoção foi adiada por custo (a Meta cobra por conversa, e não há caixa para isso ainda). O provider de produção até lá é o `evolution` — exatamente a categoria de solução que o parágrafo acima descreve como frágil. É uma dívida assumida de olhos abertos, não um esquecimento: enquanto durar, o cenário "número banido, agenda parada" é um risco real do produto, e o argumento de venda "confiabilidade de entrega" não pode ser feito com honestidade.
- **Precisa de fallback explícito.** Se a mensagem não entrega, o sistema tem que avisar a recepção e gerar uma lista de "ligar para estes pacientes" — em vez de falhar em silêncio, que foi o que aconteceu na consulta.
- **O custo do WhatsApp precisa estar no modelo de cobrança desde o dia 1** (franquia + excedente). Se embutirmos tudo na mensalidade, ou perdemos margem ou repetimos o "ficou pesado demais".

Isso reforça o item de fallback e o modelo de franquia nas prioridades abaixo.

---

## Panorama de concorrentes

Preços de entrada anunciados publicamente (consulta em 30/07/2026):

| Sistema | A partir de | Foco | Observação |
| --- | --- | --- | --- |
| [Iter Clinic](https://www.iterclinic.com/) | R$ 39/mês (planos R$ 69–309) | Estética | Fotos antes/depois, confirmação WhatsApp, pacotes/sessões |
| [Estetia CRM](https://estetiacrm.com.br/) | R$ 39/mês (base) | Estética/dermato | R$ 166 solo · R$ 362 médio · R$ 660 com TISS |
| Clínica Ágil Estética | R$ 89/mês | Estética | Interface datada, limitada para multi-especialidade |
| Clínica nas Nuvens | R$ 99/mês | Genérico | Financeiro limitado, poucas integrações |
| GestãoDS | R$ 120/mês | Médico | Prontuário sólido, pouco específico para estética |
| [Clinicorp](https://www.clinicorp.com/) | R$ 159,90 (Standard) · R$ 369,90 (Premium) | Odontologia | IA cobrada à parte; forte em rede/franquia |
| iClinic | R$ 289/mês | Médico | Consolidado, curva de aprendizado longa |
| Amplimed | R$ 399/mês | Convênios | Forte em TISS, custo alto para estética pura |

**Leitura do mercado:**

- **A faixa de entrada é R$ 39–120.** Nossa hipótese de R$ 149 nasce acima da porta de entrada de todo mundo.
- **O mercado é fragmentado e ninguém domina.** Cada player é forte em um nicho (estética, odonto, convênio) e fraco nos outros — há espaço, mas não por preço.
- **Todos já têm agenda, prontuário e WhatsApp.** Isso é commodity. Competir nessas três é chegar tarde.
- **Ninguém vende confiabilidade de entrega.** Todos anunciam "lembrete por WhatsApp"; nenhum anuncia o que acontece quando ele falha. É aí que a história da recepcionista vira oportunidade.

---

## Análise competitiva detalhada: Estetia CRM

Escolhido como referência por ser o mais próximo do nosso posicionamento (estética + odonto, white-label).

### O que eles têm e nós não

| Funcionalidade | Deles | Nosso status | Prioridade |
| --- | --- | --- | --- |
| Lembrete de consulta por WhatsApp | ✅ Meta API oficial | ⚠️ funcionando em dev (Evolution); falta credencial Meta | 🔴 Crítica |
| Confirmação de consulta pelo paciente | ✅ | ✅ página pública `/c/:token` + botão (04/08/2026) | — |
| Prontuário eletrônico / anamnese | ✅ Ficha digital | ✅ anamnese + evolução (04/08/2026); sem anexos | — |
| Fotos clínicas antes/depois | ✅ | ❌ | 🟠 Alta |
| Agendamento online pelo paciente | ✅ 24h, sem app | ❌ | 🟠 Alta |
| Lista de espera / preenchimento de lacunas | ✅ | ❌ | 🟠 Alta |
| Recall pós-procedimento | ✅ automático | ❌ (base do "reativação inteligente", Fase 2) | 🟠 Alta |
| Dashboard financeiro / fluxo de caixa | ✅ tempo real | ❌ (há faturamento por procedimento, não fluxo de caixa) | 🟠 Alta |
| Métricas de ocupação de agenda | ✅ | ❌ — exige modelar capacidade instalada | 🟡 Média |
| Multi-unidade (rede/franquia) | ✅ (Clinicorp) | ❌ — hoje 1 tenant = 1 clínica, sem hierarquia | 🟡 Média |
| Chat/atendimento por IA no site | ⚠️ raro no setor | ❌ | 🟢 Baixa |
| Comissão por profissional | ✅ | ❌ | 🟡 Média |
| Pacotes e sessões múltiplas | ✅ | ❌ | 🟡 Média |
| Programa de fidelidade / pontos | ✅ | ❌ | 🟡 Média |
| Campanhas segmentadas | ✅ | ❌ | 🟡 Média |
| Módulo TISS/TUSS (convênios) | ✅ | ❌ | 🟢 Baixa |
| Apps iOS/Android | ✅ | ❌ | 🟢 Baixa |
| Conformidade LGPD declarada | ✅ certificado | ⚠️ parcial | 🟠 Alta |

### O que temos e eles não expõem

- **Isolamento multi-tenant explícito** com branding por subdomínio (white-label de verdade, não só logo trocada)
- **Distinção `CANCELLED` vs `NO_SHOW`** modelada desde o início — eles falam em "redução de faltas", mas não expõem a granularidade do dado
- Preço congelado no agendamento (histórico financeiro não se altera quando a tabela muda)
- API documentada e aberta — eles não publicam API

### Leitura honesta da comparação

**Eles estão à nossa frente em quase tudo que o cliente vê.** Nosso diferencial declarado (predição de no-show) é justamente o que eles já anunciam como resultado ("redução de faltas até 60%") — só que com produto no ar e nós ainda no schema.

Quatro conclusões que mudam o plano:

1. **WhatsApp não é diferencial, é bilhete de entrada.** Qualquer concorrente sério já tem. Sem lembrete automático, o produto não é comparável — independente de quão boa seja a predição.
2. **Prontuário é obrigatório para odontologia/dermato.** É requisito legal e operacional, não recurso "nice to have". Uma clínica não troca de sistema se perder o prontuário.
3. **Nosso diferencial real não é "prever no-show", é o que fazemos com a previsão.** Eles reduzem falta com lembrete e lista de espera — regras simples. O espaço para nos diferenciarmos é a ação automática e personalizada por risco, não o número em si.
4. **Confiabilidade de entrega é o diferencial que ninguém anuncia.** Todos prometem lembrete; ninguém promete que ele *chega*. Ver [A dor que valida o produto](#a-dor-que-valida-o-produto).

### Posicionamento

Feature a feature, perdemos hoje para praticamente todos. A aposta não é ter mais recursos — é ter **a agenda que não deixa de avisar o paciente**:

> WhatsApp na API oficial (não cai, não é banido), com aviso à recepção quando algo falha, e ação automática proporcional ao risco de cada paciente faltar.

É a única promessa da lista que a concorrência não faz — e é a que a recepcionista da história precisava.

---

## Prioridades revisadas

### Fase 1 — Paridade mínima (sem isso não vendemos)

1. **`messaging`** — 🟢 **base entregue** (30/07/2026)
   - [x] Fila BullMQ com retry exponencial (4 tentativas)
   - [x] Lembrete automático D-1 (`REMINDER_HOURS_BEFORE`)
   - [x] Link de confirmação: paciente responde e o status vira `CONFIRMED` sozinho, sem login
   - [x] **Página pública de confirmação** (04/08/2026) — `crivo-fe` `/c/:token` com os dados do agendamento e botão "Confirmar presença". Antes o link ia direto para a API e o paciente via JSON cru
   - [x] **`GET /c/:token` não confirma mais sozinho** (04/08/2026) — o WhatsApp faz *pré-fetch* de todo link para montar a prévia, e isso confirmava a presença antes de o paciente abrir. Agora o `GET` só lê; só o `POST /c/:token/confirm` muda o status
   - [x] **Bull Board em `/admin/queues`** (04/08/2026) — painel da fila (waiting/active/completed/failed/delayed), com retry e remoção manual de job. Protegido por Basic Auth e desligado por padrão (ver README → Bull Board)
   - [x] **Hora da falha visível** (04/08/2026) — `failedAt` exposto na API, coluna "Falhou em" na tabela e "falhou há X min" no card do Painel
   - [x] **Fallback visível:** esgotou as tentativas → `GET /messages/failed` lista quem precisa de ligação
   - [x] Providers plugáveis (`fake` / `evolution` / `meta`) por env var
   - [x] Rastro de cada envio em `messages` (base para contar conversas por clínica)
   - [x] **Mensagens com IA (DeepSeek), opcional por clínica** (30/07/2026) — reescreve o lembrete com tom natural, mantendo nome/data/hora/link validados literalmente; qualquer falha ou omissão cai no template fixo. Ver [README → Mensagens com IA](./README.md#mensagens-com-ia-opcional-por-clínica)
   - [x] **Aviso imediato ao marcar a consulta** (04/08/2026) — quem agenda com dias de antecedência recebe na hora um "sua consulta foi marcada" já com o link de confirmação, e o lembrete D-1 continua. Só dispara quando o D-1 ainda está longe, para não mandar duas mensagens seguidas
   - [x] **Status ao vivo no painel** (04/08/2026) — Agenda e Mensagens se reconsultam a cada 20s (`LIVE_REFETCH_INTERVAL_MS`), já que o paciente confirma pelo WhatsApp, fora do sistema
   - [x] 🐞 **Reagendar refaz o lembrete** (04/08/2026) — antes `RescheduleAppointmentUseCase` mudava `startsAt` sem tocar na fila, e o lembrete antigo saía no D-1 da data original **com a data velha no texto**. Agora `reschedule()` cancela o que está pendente e reagenda com os dados atuais. São duas camadas de propósito: a remoção da fila (por `jobId` fixo) é *best-effort*, e o guard de `CANCELLED` no `MessageProcessor` é o que de fato impede o envio errado se o job já tiver saído da fila
   - [ ] **Credenciais da Meta** — 🅿️ **adiado por custo** (05/08/2026). A Meta cobra por conversa e a decisão é esperar caixa; até lá o provider de produção é `evolution`. Ver [Risco: Evolution em produção](#riscos) — a decisão original deste documento era o oposto, e o risco de banimento continua valendo
   - [ ] Templates editáveis por clínica (hoje o template *fixo* — usado quando a IA está desligada ou falha — é único e fica no código)
   - [ ] Template aprovado pela Meta — texto livre só funciona dentro da janela de 24h
   - [x] **Webhook de entrada — mensagem do paciente** (05/08/2026) — `POST /webhooks/inbound/:tenantId/:token` grava em `inbound_messages` e vincula ao paciente pelo telefone. É a fundação do Chat Center: até aqui a mensageria era só de saída, sem nenhum caminho de volta. Decisões que não são óbvias:
     - **Tabela separada de `messages`** — aquela é registro de envio (fila, tentativas, agendamento, destino); nada disso existe na entrada, e espremer as duas deixaria metade das colunas sempre nulas
     - **Autenticação por segredo no caminho** (`INBOUND_WEBHOOK_TOKEN`, comparado com `timingSafeEqual`) — o provider não faz login. Sem a env var configurada o endpoint recusa tudo, porque um webhook aberto aceita qualquer um injetando mensagem no nome de um paciente
     - **`tenantId` na URL** — a Evolution é uma instância por clínica e o payload não diz de quem é; derivar do telefone destino misturaria clínicas que usem o mesmo número
     - **Idempotente por `(tenantId, providerMessageId)`** — o WhatsApp reentrega o webhook quando não recebe 200 a tempo; sem o índice único a conversa duplicaria
     - **Descarta de propósito**: `fromMe` (é o nosso próprio lembrete voltando), grupos (`@g.us`), e mídia sem legenda — hoje o Crivo só lê texto
     - **Número desconhecido é gravado mesmo assim**, sem vínculo: perder o contato de quem ainda não é paciente seria perder justamente o lead. Telefone que bate com dois cadastros também fica sem vínculo — atribuir à pessoa errada é pior que não atribuir
     - Testado contra a API real: token inválido → 401, evento irrelevante → ignorado, paciente cadastrado → vinculado, reentrega do mesmo id → não duplica, número desconhecido → gravado sem vínculo. 11 testes unitários do parser do payload
   - [ ] **Confirmação por resposta** — hoje a mensagem do paciente é só registrada; responder "SIM" ainda não muda o status do agendamento (o link `/c/:token` continua sendo o caminho)
   - [ ] **Caixa de entrada / tela de conversa** — `inbound_messages` já acumula o histórico, mas não há tela: a recepção ainda não vê o que o paciente respondeu
   - [ ] Webhook de status de entrega (`DELIVERED`)
   - [x] **Reenvio manual a partir da lista de falhas** (06/08/2026) — `POST /messages/:id/resend`, com ação na tela de Mensagens. Antes o retry só existia no Bull Board, ferramenta de dev protegida por Basic Auth que expõe a fila inteira; a lista "ligar para estes pacientes" era um beco sem saída. Detalhes que não são óbvios:
     - **Só aceita `FAILED`** — reenviar uma `SENT` duplicaria a mensagem no WhatsApp do paciente, e uma `PENDING` já está na fila. Nos dois casos recusa com 400 em vez de criar um segundo envio silencioso
     - **Remove o job antigo antes de reenfileirar** — `SEND_JOB_OPTIONS` usa `removeOnFail: false`, então o job falho continua na fila com o mesmo `jobId`, e o BullMQ **ignora** um `add` com id repetido. Sem o `remove`, a tela mostraria sucesso sem nada ter saído
     - **Checa o tenant, não só o id** — é o que impede uma clínica de disparar mensagem de outra sabendo o UUID
     - A ação fica no menu de três pontos da linha (padrão das demais tabelas do painel) e só aparece na aba de falhas — histórico é registro, não fila de ação
     - Testado contra a API real: `FAILED` → 204 e a mensagem volta a `PENDING` com tentativas zeradas; reenviar a mesma de novo → 400; id inexistente → 404; worker reprocessa (tentativas sobem)
   - [ ] Segundo lembrete (D-3) e escalonamento por risco (depende de `prediction`)
2. **Prontuário básico** — 🟢 **entregue em 04/08/2026** (anamnese + evolução)
   - [x] Novo papel `PROFESSIONAL`: prontuário é dado sensível de saúde (LGPD Art. 11) e a recepção (`STAFF`) não tem necessidade clínica de lê-lo. `@Roles(ADMIN, PROFESSIONAL)` no controller inteiro, para que rota nova nasça restrita
   - [x] **Anamnese** — ficha de saúde por paciente (alergias, medicações, condições, observações), com registro de quem preencheu por último
   - [x] **Evolução append-only** — `ClinicalNote` não tem `updatedAt` nem `deletedAt`, e não existe rota de PUT/DELETE. Corrigir é escrever nota nova. A ausência dos campos é o que impede alterar histórico, sem custo de versionamento
   - [x] Tela de detalhe do paciente com abas (Dados / Anamnese / Evolução) — as clínicas só aparecem para quem pode vê-las
   - [ ] **Anexos (fotos, exames)** — ver "Fora de escopo" abaixo
3. **Horário por profissional e bloqueio de agenda** — 🟢 **entregue em 04/08/2026**
   - [x] **Grade semanal** (`ProfessionalSchedule`) — uma linha por faixa, então "terça 08–12" e "terça 13–18" convivem (intervalo de almoço). Grade vazia = atende o expediente inteiro da clínica, para não travar quem já estava cadastrado
   - [x] **Bloqueio pontual** (`ProfessionalTimeOff`) — férias, congresso. Sempre vence a grade
   - [x] Aplicado nos três pontos: `get-availability` (filtra os slots oferecidos), `create-appointment` e `reschedule-appointment` (recusam com o motivo)
   - [x] Bloquear período com agendamento marcado é **recusado**, não cancela o paciente em silêncio — remarcar é decisão da clínica
   - [x] Tela em Profissionais → menu da linha → "Horários e bloqueios"
4. **Importador de pacientes via CSV** — 🟢 **entregue em 05/08/2026**
   - [x] **Prévia obrigatória** (`dryRun`) — o modo de falhar da importação é silencioso: coluna trocada não dá erro, gera centenas de cadastros errados. A tela mostra as primeiras linhas já mapeadas em Nome/Telefone/CPF antes de gravar
   - [x] **Parser próprio** (`src/shared/csv/`) — aspas, `;` do Excel pt-BR, CRLF, BOM e arquivo em Latin-1, que é o que "Salvar como CSV" gera em português. Sem dependência nova
   - [x] **Cabeçalhos flexíveis** — `celular`/`fone`/`whatsapp` valem por `telefone`, `paciente` vale por `nome`. Exigir cabeçalho exato transformaria a importação num "edite o arquivo antes", que é o trabalho que ela deveria poupar
   - [x] **Idempotente** — dedupe por CPF (ou telefone, quando não há CPF), dentro do arquivo e contra a base. Reimportar a mesma planilha cria zero
   - [x] Erro por linha com o número da linha do arquivo, para conferir com a planilha aberta
   - [x] Restrito a `ADMIN`: é operação de implantação, e um arquivo errado suja a base inteira de uma vez
   - [x] Testes unitários do parser e das regras de paciente (45 casos) — primeiro `jest.config.js` do projeto

### Fase 2 — Diferencial

4. **`prediction` — risco de no-show** — regra primeiro, modelo depois. Ver [Predição](#predição--o-que-existe-de-verdade-hoje)
   - O que nos separa: **ação por faixa de risco** — risco alto dispara confirmação mais cedo, mais insistente e libera a vaga para lista de espera antes
5. **Lista de espera** — preenche a lacuna quando o risco se concretiza
6. **Reativação inteligente de pacientes** — quem não volta há X meses, segmentado por procedimento e ticket. Depende do mesmo histórico da predição; sem `billing` não dá para medir se o retorno pagou o disparo
7. **Agendamento online** — página pública por subdomínio (o branding já existe)

### Fase 3 — Monetização e retenção

8. **`billing`** — Stripe, planos, cobrança por assento
9. **Painel de métricas de ocupação** — taxa de ocupação por profissional/sala/horário, buraco de agenda, receita perdida por falta. Hoje o dashboard mostra contagem e faturamento, não **ocupação** (exige capacidade instalada, que ainda não modelamos)
10. **Dashboard financeiro** — faturamento, taxa de comparecimento, receita perdida por falta
11. **Comissão por profissional**
12. **Pacotes e fidelidade**

### Fase 4 — Escala

13. **Gestão multi-unidade** — uma rede com várias unidades sob o mesmo dono. **Não é o mesmo que multi-tenant**: hoje cada clínica é um `Tenant` isolado, sem nenhum conceito de "grupo de unidades", agenda consolidada ou usuário que enxerga mais de uma. Exige modelar hierarquia (`Organization` → `Tenant`) e rever todo o `TenantContextGuard`, que hoje assume **um** tenant por token. É o item de maior impacto estrutural da lista

### Fora de escopo do prontuário v1

- **Anexos (fotos clínicas, exames)** — o bloqueio não é de UI, é de
  armazenamento: `CloudinaryService.uploadImage` grava `secure_url` sem
  `type: 'authenticated'`, ou seja **URL pública**. Serve para avatar e logo;
  foto clínica em URL pública é exposição de dado sensível. Quando entrar,
  precisa de entrega autenticada + URL assinada com expiração + aceitar PDF +
  não aplicar o recorte de rosto (`AVATAR_TRANSFORMATION`)
- **Versionamento da anamnese** — hoje guarda só o último estado + quem
  editou. Histórico de alterações exigiria tabela própria
- **Assinatura digital / carimbo CRO** — necessário para valor legal pleno do
  documento; é projeto próprio
- **Escopo por profissional** ("só vejo meus pacientes") — hoje ADMIN e
  PROFESSIONAL enxergam todo o prontuário do tenant

### Fora de escopo por ora

- **TISS/TUSS** — só faz sentido para dermatologia com convênio; alto custo de conformidade e nos tira do foco de estética/odonto particular
- **Apps nativos** — PWA resolve enquanto não houver escala
- **LGPD certificada** — precisa acontecer antes de vender, mas é processo jurídico + técnico, não módulo

---

## Predição — o que existe de verdade hoje

**Código: nenhum.** Não há módulo `prediction`, nem tabela, nem endpoint.
O que existe é o **dado bruto sendo acumulado** desde o início, de propósito.

### O que já está sendo coletado

| Sinal | Onde | Por que importa |
| --- | --- | --- |
| `CANCELLED` ≠ `NO_SHOW` | `Appointment.status` | **Cancelar é aviso; faltar é o problema.** Só a segunda categoria é o alvo da predição — separá-las desde o schema é o que torna o dado treinável depois |
| `confirmedAt` | `Appointment` | O paciente respondeu ao lembrete? Não responder é candidato natural a preditor |
| Histórico por paciente | `Appointment.patientId` | Quem já faltou tende a faltar de novo — é o sinal mais forte na literatura |
| Horário e dia | `startsAt` | Primeiro horário da manhã e véspera de feriado têm perfil de falta diferente |
| Procedimento e preço | `procedureId`, `priceInCents` | Ticket alto e procedimento eletivo têm risco diferente de retorno de rotina |

### Volume real (06/08/2026, banco de desenvolvimento)

```
total       35
SCHEDULED   15
COMPLETED   10
NO_SHOW      4     ← a classe que interessa prever
CONFIRMED    4
CANCELLED    2
confirmedAt  4
```

**Isso não treina modelo nenhum.** Quatro exemplos positivos não sustentam
nem uma regressão logística simples, e pior: **é dado de seed, não de
paciente**. Os `NO_SHOW` foram escritos por um `plan` fixo em `seed.ts`, não
por alguém que faltou — um modelo treinado aqui aprenderia o padrão do
desenvolvedor. Antes de qualquer treino sério, é preciso volume real de
clínica em produção.

> O volume caiu de 59 para 35 desde 04/08 porque o banco foi reseedado
> durante o desenvolvimento. Isso reforça o ponto: enquanto o histórico for
> seed, ele se apaga a cada `SEED_TYPE=clean` e não acumula nada.

### O caminho realista

1. **Começar por regra determinística**, sem ML. Algo como: já faltou antes ·
   não confirmou o lembrete · é primeira consulta · horário historicamente
   ruim. Cada condição soma pontos e o resultado vira faixa (baixo/médio/alto).
2. **Agir por faixa**, que é o diferencial real — não o número. Risco alto:
   confirmar mais cedo, insistir mais, liberar para lista de espera antes.
3. **Medir a regra** contra o que de fato aconteceu. Isso gera o rótulo
   limpo que um modelo precisaria depois.
4. **Só então trocar por modelo estatístico**, quando houver volume real de
   clínica em produção — não com dado de seed.

A ordem importa: a regra entrega valor na semana 1 e produz o dataset que
justifica o modelo. Começar pelo modelo é construir sobre 5 exemplos.

---

## Website — o que falta

O site institucional (`crivo-fe`, grupo de rotas `(website)`) hoje é
estático: apresenta o produto, lista planos como texto e tem formulário de
contato. Duas lacunas mapeadas:

| Item | Situação | Observação |
| --- | --- | --- |
| **Chat com IA (DeepSeek)** | ⚪ Não iniciado | Atendimento/qualificação do visitante na landing. O `DeepSeekTextGenerator` já existe em `messaging`, mas serve outro propósito (reescrever lembrete) — chat exige conversa com estado, histórico e contenção de escopo, é integração nova |
| **Planos reais com Stripe** | ⚪ Não iniciado | Hoje `_data/pricing-plans.ts` é conteúdo estático e o CTA não leva a checkout. Depende de `billing` (Fase 3) — e, antes disso, de **validar o preço**: os valores publicados seguem sendo hipótese não testada (ver abaixo) |

> ⚠️ Ligar o Stripe congela publicamente uma tabela de preços que este mesmo
> documento classifica como não validada e acima da entrada do mercado.
> Decidir o preço **antes** de expor checkout, não depois.

---

## Impacto no modelo de cobrança

Com o panorama completo, a hipótese do README (R$ 149 / R$ 289 + R$ 49 por profissional) fica **acima da porta de entrada de todo o mercado**:

| | Mercado | Nossa hipótese |
| --- | --- | --- |
| Entrada | R$ 39–120/mês | — (não temos) |
| Solo | R$ 89–166/mês | R$ 149/mês (até 2 profissionais) |
| Médio | R$ 289–370/mês | R$ 289/mês + R$ 49/profissional |
| Avançado | R$ 399–660/mês | Sob consulta |

Quatro observações:

- **Não temos porta de entrada.** A faixa R$ 39–120 é onde o autônomo entra e depois cresce. Começar em R$ 149 nos tira da primeira comparação que o cliente faz.
- **Cobrança por assento nos torna caros justamente no cliente bom.** Com 5 profissionais: R$ 289 + 3×49 = **R$ 436**, contra R$ 362 (Estetia) e R$ 369,90 (Clinicorp Premium).
- **Trial sem cartão é padrão de mercado.** Não ter plano gratuito segue certo, mas *trial* ≠ *free* — sem ele perdemos a comparação direta.
- **O custo do WhatsApp oficial precisa estar no preço.** A Meta cobra por conversa; a história da recepcionista mostra o que acontece quando esse custo estoura no colo da clínica. Franquia + excedente transparente, decidido antes de lançar.

**A decidir antes de implementar `billing`:**

- [ ] Migrar de assento para **faixas fechadas** (mais previsível e competitivo acima de 4 profissionais)?
- [ ] Criar plano de entrada (~R$ 59-89) para autônomo, com franquia menor de mensagens?
- [ ] Franquia de conversas por plano e preço do excedente
- [ ] Duração do trial e se exige cartão
- [ ] Validar com clínicas reais — os preços do README seguem sendo **hipótese não validada**

---

## Riscos

| Risco | Mitigação |
| --- | --- |
| Concorrente já tem produto no ar e nós não | Focar Fase 1 e não dispersar em features de Fase 3 |
| Predição sem dado suficiente para treinar | Começar com regra determinística. **Hoje há só 4 `NO_SHOW` no banco de dev** (06/08/2026) — não treina nada. Ver [Predição](#predição--o-que-existe-de-verdade-hoje) |
| Dado de teste poluindo o histórico de predição | Todo o histórico atual vem do `seed.ts`, não de comportamento de paciente — e some a cada `SEED_TYPE=clean`. Só serve para desenvolver a regra; treinar exige volume real de produção |
| Expor preço no Stripe antes de validar | O checkout congela publicamente uma tabela que este documento classifica como hipótese acima do mercado. Validar preço **antes** de ligar o pagamento |
| Multi-unidade quebrar o isolamento por tenant | `TenantContextGuard` assume um tenant por token. Hierarquia (`Organization` → `Tenant`) precisa ser desenhada antes, não adaptada depois — é onde vazamento entre clínicas apareceria |
| Custo de WhatsApp (Meta cobra por conversa) | Modelar franquia + excedente antes de lançar, não depois |
| Migração de clínica que já usa concorrente | Importador de pacientes via CSV — 🟢 entregue, com prévia antes de gravar |
| Mercado fragmentado, entrada a partir de R$ 39 | Não competir por preço; vender confiabilidade de entrega |
| **Evolution API em produção** (decidido em 05/08/2026 por custo) | ⚠️ **Risco aceito, não mitigado.** Banimento é permanente e sem recurso — perderíamos o número junto com a agenda do cliente. Mitigações possíveis enquanto durar: número dedicado (nunca o pessoal do dono), volume baixo, opt-in real do paciente, e a lista de falhas já existente para a recepção ligar. Migrar para a Meta assim que houver caixa é o plano, e o código já é plugável (`MESSAGING_PROVIDER`), então a troca é de env var, não de refactor |
| Meta mudar preço ou política de conversa | Repassar como excedente transparente, nunca absorver em silêncio |
| Custo do DeepSeek por mensagem (feature de IA opcional) | Baixo por chamada, mas escala com volume — medir custo real por clínica antes de decidir se entra na franquia padrão ou é add-on pago do plano |
| IA alucinar ou distorcer um dado da mensagem | **Mitigado por design:** prompt restringe a redigir, nunca a decidir fato; validação pós-geração confere nome/data/hora/link literalmente antes de aceitar o texto — se algo faltar, cai no template fixo |

---

## Fontes

Consultadas em 30/07/2026. Preços mudam — reconfirmar antes de usar em decisão comercial.

- [Estetia CRM](https://estetiacrm.com.br/)
- [Os 6 melhores sistemas de gestão para clínica estética no Brasil — Iter Clinic](https://www.iterclinic.com/blog/os-6-melhores-sistemas-de-gestao-para-clinica-estetica-no-brasil-testados-em-2026)
- [Quanto custa o Clinicorp? Valores 2026](https://www.clinicasyspro.com.br/clinicasyspro-vs-clinicorp.html)
- [7 melhores softwares odontológicos em 2026 — Codental](https://www.codental.com.br/blog/melhores-softwares-odontologicos/)
- [Onda de banimentos no WhatsApp: por que 2026 é o fim das APIs não oficiais](https://wehsoft.com/blog/banimentos-whatsapp-2026)
- [WhatsApp Cloud API oficial vs Evolution API](https://blog.flyvet.com.br/whatsapp-cloud-api-vs-evolution-api-clinica-veterinaria/)

> ⚠️ Os comparativos de mercado são publicados por empresas do próprio setor e podem favorecer o autor. Os preços de entrada batem entre fontes diferentes, mas os "pontos fracos" atribuídos a concorrentes devem ser lidos com ceticismo.
