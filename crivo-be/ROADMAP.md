# Roadmap — Crivo

Onde estamos, o que a concorrência já entrega e o que falta construir.

> Última atualização: 2026-08-10 (Fase 2 iniciada: predição por regra,
> escalonamento de lembretes por risco e lista de espera com oferta por
> WhatsApp).
>
> **Fase 1: o que era construível está construído.** O que segue aberto
> depende de coisas fora do código:
> - **Credenciais da Meta** — adiado por custo. O provider está pronto e
>   selecionável; sem as chaves, escolher META faz o envio falhar. Até lá o
>   WhatsApp roda em Evolution, com risco de banimento **assumido**
> - **Template aprovado pela Meta** — só existe com conta Meta
> - **Webhook de `DELIVERED`** — a Evolution não entrega esse status de forma
>   confiável; faz sentido junto com a Meta
> - **Tela de conversa** (responder pelo painel) — lacuna que a caixa de
>   entrada tornou visível; é feature nova, não pendência da entrega
> - **Segundo lembrete D-3** — depende de `prediction` (Fase 2)
>
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
| `messaging` | 🟢 Lembretes **escalonados por risco** (D-72h/D-48h/D-24h), confirmação pelo link **e por resposta** ("sim" no WhatsApp), caixa de entrada, reenvio manual, templates editáveis por clínica e provider selecionável. ⚠️ A Meta foi **adiada por custo**: o provider é `evolution`, com risco de banimento assumido — ver [Riscos](#riscos) |
| `prediction` | 🟡 **Regra + ação + tela** (10/08/2026) — risco por fatores explicados, escalonamento automático de lembretes por faixa e aba "Risco de falta" na Agenda. Falta **medir a regra** contra o que aconteceu (é o que diz se os pesos estão certos) e o modelo estatístico, que depende de volume real. Ver [Predição](#predição--o-que-existe-de-verdade-hoje) |
| `medical-records` | 🟢 Anamnese + evolução append-only, restrito a ADMIN/PROFESSIONAL (04/08/2026). Falta anexos |
| `waitlist` | 🟢 **Ciclo completo** (10/08/2026) — fila por ordem de chegada, tela na Agenda, sugestão automática ao cancelar um agendamento e oferta por WhatsApp |
| `billing` | ⚪ Não iniciado |

Temos base sólida de cadastro e agenda, e a comunicação (WhatsApp + confirmação por link e por resposta) funcionando em dev. **A tríade agenda + comunicação + predição está completa em primeira versão** — a predição saiu do zero e já *age*: escalona lembretes por risco e alimenta a lista de espera.

O que falta não é construir a predição, é **provar que ela acerta**: ninguém mediu ainda se os pesos da regra correspondem ao comportamento real do paciente. Ver [Predição](#predição--o-que-existe-de-verdade-hoje).

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
| Lista de espera / preenchimento de lacunas | ✅ | ✅ com sugestão automática ao cancelar e oferta por WhatsApp (10/08/2026) | — |
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
   - [x] **Provider escolhido por clínica** (10/08/2026) — `Tenant.messagingProvider` (`FAKE`/`EVOLUTION`/`META`), com seletor em Configurações. Antes `MESSAGING_PROVIDER` valia para o processo inteiro, o que impedia uma clínica migrar para a Meta enquanto outra segue na Evolution — e é exatamente essa a transição em curso. Decisões:
     - **Credenciais continuam em variáveis de ambiente** — a clínica escolhe o *caminho*, não guarda segredo no banco. Token da Meta dá acesso ao WhatsApp da clínica; guardá-lo exigiria criptografia em repouso e mascaramento na API, que é projeto próprio
     - **Nulo = padrão do servidor** — clínicas existentes não mudam de comportamento, e a opção "Padrão do sistema" continua alcançável para voltar atrás
     - **Resolvido por mensagem, não injetado no boot** — `MessageProviderResolver` consulta o tenant a cada envio, então trocar o provider pela tela vale **sem reiniciar**. Verificado ao vivo: `fake` → troca para `evolution` pela API → o envio seguinte já saiu pela Evolution
     - **A tela explica a consequência** — "o WhatsApp não autoriza esse tipo de conexão, o número pode ser bloqueado em definitivo" no não oficial, e "nada é enviado de verdade" no simulado. Quem marcasse "simulado" sem entender acharia que avisou o paciente
   - [ ] **Credenciais da Meta** — 🅿️ **adiado por custo** (05/08/2026). O provider `meta` está pronto e selecionável, mas `META_WHATSAPP_TOKEN`/`META_WHATSAPP_PHONE_NUMBER_ID` seguem vazios — escolher META sem eles faz o envio falhar. Até lá o caminho é `evolution`. Ver [Risco: Evolution em produção](#riscos)
   - [x] **Templates editáveis por clínica — backend** (10/08/2026) — `GET/PUT /message-templates`, tabela `message_templates` (uma linha por tenant+tipo). Decisões:
     - **Marcadores em português** (`{{paciente}}`, `{{data}}`, `{{link}}`) — quem escreve é a recepção, não um dev; `{{patientName}}` seria barreira sem ganho
     - **Validação ao salvar, não no envio** — exige `{{data}}`, `{{hora}}` e `{{link}}`, e recusa marcador inexistente. Template quebrado só apareceria quando o paciente não recebesse, e aí a consulta já passou
     - **O texto padrão vem com os marcadores à mostra**, como ponto de partida — verificado que ele renderiza **idêntico** ao template fixo do código, então a clínica edita exatamente o que recebe hoje
     - **Desligar preserva o rascunho** (`isActive: false` volta ao padrão sem apagar). A listagem devolve `body` **e** `defaultBody`, para a tela poder mostrar o que o paciente de fato recebe quando está desligado
     - **`@Roles(ADMIN)`** — o texto sai em nome da clínica para todos os pacientes
     - **Falha na leitura cai no padrão**: personalização não pode derrubar envio
     - 15 testes do renderizador + verificação ponta a ponta: agendamento real gerou lembrete com o texto personalizado e aviso de marcação com o padrão (só o lembrete fora personalizado)
   - [x] **Templates editáveis — tela** (10/08/2026) — aba "Mensagens automáticas" em Configurações, com editor, marcadores clicáveis e pré-visualização com dados de exemplo. Detalhes:
     - **A prévia mostra o que o paciente recebe *agora*** — com a personalização desligada, exibe o texto padrão, não o rascunho no editor. Mostrar o rascunho como se fosse o envio real era o erro que essa distinção evita
     - **Marcadores entram por clique**, não digitação: `{{paciente}}` escrito à mão é a principal fonte de erro, e marcador inválido é recusado no salvamento
     - **Substituição duplicada no front** (só para a prévia) — pedir a prévia ao servidor a cada tecla seria uma requisição por caractere. Validado que casa com o backend nos casos de borda (espaço nas chaves, maiúsculas, marcador desconhecido, chave simples)
     - **Abas em Configurações**: os textos são longos e têm prévia; empilhados abaixo do formulário esconderiam o botão de salvar dos dados da clínica
   - [ ] Template aprovado pela Meta — texto livre só funciona dentro da janela de 24h
   - [x] **Webhook de entrada — mensagem do paciente** (05/08/2026) — `POST /webhooks/inbound/:tenantId/:token` grava em `inbound_messages` e vincula ao paciente pelo telefone. É a fundação do Chat Center: até aqui a mensageria era só de saída, sem nenhum caminho de volta. Decisões que não são óbvias:
     - **Tabela separada de `messages`** — aquela é registro de envio (fila, tentativas, agendamento, destino); nada disso existe na entrada, e espremer as duas deixaria metade das colunas sempre nulas
     - **Autenticação por segredo no caminho** (`INBOUND_WEBHOOK_TOKEN`, comparado com `timingSafeEqual`) — o provider não faz login. Sem a env var configurada o endpoint recusa tudo, porque um webhook aberto aceita qualquer um injetando mensagem no nome de um paciente
     - **`tenantId` na URL** — a Evolution é uma instância por clínica e o payload não diz de quem é; derivar do telefone destino misturaria clínicas que usem o mesmo número
     - **Idempotente por `(tenantId, providerMessageId)`** — o WhatsApp reentrega o webhook quando não recebe 200 a tempo; sem o índice único a conversa duplicaria
     - **Descarta de propósito**: `fromMe` (é o nosso próprio lembrete voltando), grupos (`@g.us`), e mídia sem legenda — hoje o Crivo só lê texto
     - **Número desconhecido é gravado mesmo assim**, sem vínculo: perder o contato de quem ainda não é paciente seria perder justamente o lead. Telefone que bate com dois cadastros também fica sem vínculo — atribuir à pessoa errada é pior que não atribuir
     - Testado contra a API real: token inválido → 401, evento irrelevante → ignorado, paciente cadastrado → vinculado, reentrega do mesmo id → não duplica, número desconhecido → gravado sem vínculo. 11 testes unitários do parser do payload
   - [x] 🐞 **Dois bugs achados no teste de ponta a ponta** (10/08/2026) — simulando a jornada completa da recepção:
     - **Confirmação ignorada quando o WhatsApp está instável**: `findTarget` exigia `sentAt: { not: null }` no lembrete. Com a Evolution fora do ar as mensagens ficam `PENDING`, então o paciente que respondia "sim" era ignorado **em silêncio** — e a clínica seguia achando que ninguém confirmou. Quebrava exatamente na hora em que mais importa. Agora olha a existência da mensagem (excluindo `CANCELLED`), não o envio confirmado
     - **Cancelar não cancelava os lembretes**: `ChangeAppointmentStatusUseCase` mudava o status sem tocar na fila, então o paciente que desmarcou continuava recebendo lembrete da consulta que não existe mais — pior que não avisar, porque ele pode aparecer na clínica. O `reschedule` já fazia isso desde 04/08; o cancelamento tinha a mesma lacuna e ninguém tinha notado
   - [x] **Confirmação por resposta** (10/08/2026) — responder "sim" no WhatsApp confirma o agendamento, sem abrir link. O `/c/:token` continua existindo, mas exige sair do WhatsApp; quem já está lá só responde. Decisões que importam:
     - **`UNKNOWN` é o padrão, e casa frase inteira** (não `includes`) — "não posso, sim?" contém "sim" e é uma recusa. Confirmar presença de quem não confirmou é pior que pedir para um humano ler: a clínica reserva o horário e o paciente falta assim mesmo, que é o problema que o produto existe para reduzir
     - **`CANCEL` não cancela sozinho** — só sinaliza para a recepção. Cancelar libera horário e aciona política de remarcação; é decisão da clínica, não de um casamento de texto
     - **Só confirma agendamento futuro, `SCHEDULED`/`CONFIRMED`, que já recebeu lembrete** — sem a última regra, um "ok" solto (resposta a outra conversa) confirmaria a próxima consulta da agenda
     - **Interpreta depois de gravar** — o `create` da `inbound_messages` é o que barra a reentrega do webhook (índice único); interpretar antes faria o mesmo evento repetido confirmar de novo e mandar um segundo recibo
     - **`intent` e `appointmentId` gravados** na mensagem recebida: é o registro de *por que* um agendamento foi confirmado sozinho. Confirmação automática já nasce lida; o resto fica na caixa de entrada
     - 38 testes do interpretador + verificação ao vivo: ambígua → não confirma; "Sim! 👍" → `CONFIRMED` com recibo; segundo "sim" → sem segundo recibo; "preciso remarcar" → sinaliza sem cancelar; número desconhecido → não confirma nada
   - [x] **Caixa de entrada** (10/08/2026) — aba "Recebidas" em Mensagens, com `GET /inbound-messages`, `PATCH :id/read` e `PATCH read-all`. O webhook já gravava tudo, mas ninguém lia: um "posso levar minha filha?" ficava no banco sem chegar a um humano. Decisões:
     - **`unreadTotal` fora do `meta` da paginação** — conta o tenant inteiro, não a página nem o filtro. É o número do badge, e dentro do `meta` mudaria a cada filtro aplicado
     - **`read-all` registrado ANTES de `:id/read`** — o Nest casa rota por ordem de registro, não por especificidade; invertido, `read-all` cairia em `:id/read` com `id = "read-all"`. Mesma armadilha já documentada em `MeController`
     - **`updateMany` com o tenant no `where`** (em vez de `update` por id) é o que impede uma clínica de marcar mensagem de outra sabendo o UUID
     - **Confirmação automática já nasce lida**, então a caixa mostra só o que precisa de gente. Não lidas aparecem em negrito e com fundo destacado
     - **Número fora da base aparece como "Não cadastrado"**, não como erro: quem escreve pela primeira vez costuma ser lead
     - Testado ao vivo: listagem, filtros `unreadOnly` true/false, marcar uma (badge cai de 3 para 2), marcar todas (vai a 0), id inexistente → 404, e **isolamento entre clínicas** — outra clínica vê 0 mensagens e recebe 404 ao tentar marcar mensagem alheia
   - [ ] **Tela de conversa (responder pelo painel)** — hoje a recepção lê e marca como tratada, mas responder ainda é pelo WhatsApp da clínica. Exige envio manual avulso (`MANUAL` já existe no enum `MessageType`)
   - [ ] Webhook de status de entrega (`DELIVERED`)
   - [x] **Reenvio manual a partir da lista de falhas** (06/08/2026) — `POST /messages/:id/resend`, com ação na tela de Mensagens. Antes o retry só existia no Bull Board, ferramenta de dev protegida por Basic Auth que expõe a fila inteira; a lista "ligar para estes pacientes" era um beco sem saída. Detalhes que não são óbvios:
     - **Só aceita `FAILED`** — reenviar uma `SENT` duplicaria a mensagem no WhatsApp do paciente, e uma `PENDING` já está na fila. Nos dois casos recusa com 400 em vez de criar um segundo envio silencioso
     - **Remove o job antigo antes de reenfileirar** — `SEND_JOB_OPTIONS` usa `removeOnFail: false`, então o job falho continua na fila com o mesmo `jobId`, e o BullMQ **ignora** um `add` com id repetido. Sem o `remove`, a tela mostraria sucesso sem nada ter saído
     - **Checa o tenant, não só o id** — é o que impede uma clínica de disparar mensagem de outra sabendo o UUID
     - A ação fica no menu de três pontos da linha (padrão das demais tabelas do painel) e só aparece na aba de falhas — histórico é registro, não fila de ação
     - Testado contra a API real: `FAILED` → 204 e a mensagem volta a `PENDING` com tentativas zeradas; reenviar a mesma de novo → 400; id inexistente → 404; worker reprocessa (tentativas sobem)
   - [x] **Segundo lembrete e escalonamento por risco** (10/08/2026) — entregue junto com a ação por faixa em `prediction`: risco alto recebe D-72h + D-24h, médio D-48h, baixo D-24h. Ver [Fase 2 → prediction](#fase-2--diferencial)
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
   - [x] **Regra determinística** (10/08/2026) — `GET /prediction/no-show/upcoming` (agenda futura ordenada por risco) e `GET /prediction/no-show/:id`. Decisões:
     - **Pesos são hipótese explícita, não ajuste** — ninguém mediu ainda quanto cada fator vale nesta clínica. Ficam em `RISK_FACTORS`, num lugar só, com o raciocínio de cada um documentado para poder ser contestado
     - **`factors` acompanha todo score** — "risco alto" sem motivo é um número que a recepção não tem como checar nem discordar. Com os fatores, a decisão é auditável
     - **Calculado sob demanda, não gravado** — os sinais mudam sozinhos (o paciente confirma, o horário se aproxima); um score persistido ficaria velho sem ninguém notar. Materializar faz sentido quando o cálculo ficar caro
     - **Histórico bom desconta** (`RELIABLE_HISTORY: -20`), mas **uma falta anterior cancela o desconto**: presença repetida não vale como previsibilidade se o paciente já furou
     - **Ordena por risco, não por horário** — a tela responde "para quem eu ligo hoje?", e a recepção tem tempo limitado
     - 15 testes da regra + verificação contra a agenda real: paciente com falta anterior + sem confirmação + primeiro horário → `HIGH` (70), com os três fatores listados. Isolamento entre clínicas verificado (404)
   - [x] **Ação automática por faixa — lembretes** (10/08/2026) — a antecedência e a **quantidade** de lembretes passam a depender do risco (`REMINDER_HOURS_BY_RISK`): alto recebe D-72h **e** D-24h, médio recebe D-48h, baixo mantém o D-24h único. É o ponto em que a predição deixa de ser um número numa tela. Decisões:
     - **Risco baixo não recebe mais mensagem** — insistir com quem sempre comparece gasta conversa paga e ensina o paciente a ignorar o WhatsApp da clínica
     - **Dois lembretes no risco alto, não um mais cedo** — o cedo dá à clínica tempo de reagir ao silêncio; o da véspera pega o momento em que a falta se decide. Um só não faz as duas coisas
     - **Falha no cálculo cai no cronograma padrão** — predição não pode travar envio: sem risco, o paciente recebe o lembrete como antes
     - **Lembrete cujo horário já passou é descartado**, e consulta em cima da hora ainda recebe um envio imediato — senão marcar para amanhã não geraria lembrete nenhum
     - 7 testes da política + verificação ao vivo: paciente com falta anterior → 2 lembretes (D-72h, D-24h); paciente com histórico de presença → 1 (D-48h). **Reagendar refaz o plano inteiro**: os dois antigos viraram `CANCELLED` e dois novos foram criados com as datas certas
     - Isto fecha também o item "segundo lembrete (D-3)" que estava listado em `messaging` esperando `prediction`
   - [x] **Tela de risco** (10/08/2026) — `/painel/agenda/risco`, terceira aba da Agenda. Ordenada por risco (não por horário): responde "para quem eu ligo hoje?". Cada card mostra **os motivos**, não só a faixa — "risco alto" sozinho é um número que a recepção não tem como checar nem discordar. Aberta a STAFF: agir sobre o risco é trabalho da recepção
   - [ ] **Ação por faixa — lista de espera** — risco alto deveria liberar a vaga para outro paciente antes. Depende da lista de espera (item 5)
   - [ ] **Medir a regra contra o que aconteceu** — comparar risco previsto × falta real é o que gera o rótulo limpo que um modelo precisaria, e o que diz se os pesos estão errados
5. **Lista de espera** — preenche a lacuna quando o risco se concretiza
   - [x] **Backend** (10/08/2026) — tabela `waitlist_entries` e `GET/POST /waitlist`, `GET /waitlist/candidates/:appointmentId`, `PATCH :id/offered`, `DELETE :id`. Decisões:
     - **Sugere, não oferece sozinho** — mandar mensagem automática ao primeiro da fila parece eficiente, mas remarcar tem contexto que o sistema não tem ("essa paciente pediu para não ligar de manhã"), e oferta errada gasta conversa paga. A recepção decide; `PATCH :id/offered` registra que ela avisou
     - **Ordem de chegada, não menor risco** — a fila é uma promessa de justiça ao paciente; furar por critério interno da clínica é o tipo de coisa que ele percebe e reclama
     - **Casamento conservador**: mesmo procedimento (a duração da vaga veio dele), profissional compatível (quem escolheu alguém não é encaixado com outro) e dentro da janela declarada. Melhor não oferecer do que oferecer errado
     - **`professionalId` opcional** — "qualquer profissional" é o caso comum de quem só quer ser atendido logo
     - **Remover é `CANCELLED`, não delete** — quantos desistiram de esperar é o dado que diz se a agenda está apertada demais
     - 11 testes do casamento + verificação ao vivo: fila em ordem de chegada, duplicata recusada (400), 6 na fila → 4 candidatos (excluídos quem exigia outro profissional e quem tinha janela incompatível), oferecer duas vezes → 404, isolamento entre clínicas → 404
   - [x] **Tela** (10/08/2026) — `/painel/agenda/espera`, quarta aba da Agenda. Tabela por ordem de chegada, dialog de inclusão (paciente, procedimento, profissional opcional, janela de datas e observações) e ações "marcar como oferecida" / "tirar da fila". "Qualquer um" e "Qualquer data" aparecem escritos, não como campo vazio — o vazio parece dado faltando, quando na verdade é o caso que **aumenta** a chance de encaixe
   - [x] **Ligação com o cancelamento** (10/08/2026) — cancelar um agendamento abre um dialog com os candidatos da fila, na hora. Fecha o ciclo: antes a vaga liberada dependia de a recepção lembrar de abrir outra tela e cruzar procedimento e horário na mão
   - [x] **Oferta por WhatsApp** (10/08/2026) — botão "Avisar" em cada candidato manda a mensagem pelo mesmo canal e fila das demais. Decisões:
     - **Tipo próprio `WAITLIST_OFFER`**, não `MANUAL` — é o que permite medir quantas ofertas viram agendamento, o número que diz se a fila funciona
     - **A oferta não reserva o horário** — o texto pede resposta e avisa que "a vaga é por ordem de resposta". A mesma vaga costuma ser oferecida a mais de uma pessoa; prometer a todas geraria conflito
     - **Sem link de confirmação** — aquele token pertence a um agendamento que ainda não existe
     - **Mensagem sem `appointmentId`** — vinculá-la ao agendamento cancelado faria a oferta aparecer no histórico de um atendimento que não vai acontecer
     - **Falha no envio não desfaz a marcação** — a vaga continua oferecida e a recepção liga; voltar para `WAITING` faria a mesma pessoa ser sugerida de novo. A resposta distingue `offered` de `notified`, e a tela só diz "avisado no WhatsApp" quando a mensagem realmente saiu
     - **`appointmentId` é opcional**: sem ele, `markOffered` só registra que a recepção avisou por fora (ligou)
     - Verificado o ciclo inteiro ao vivo: cancelar → 1 candidato sugerido → "Avisar" → `OFFERED` + mensagem `WAITLIST_OFFER` na fila com o texto correto
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

**Existe uma regra determinística, não um modelo** (desde 10/08/2026). O
módulo `prediction` calcula risco somando fatores conhecidos (histórico de
falta, silêncio ao lembrete, primeira consulta, horário, antecedência) e
devolve faixa + os motivos. Não há tabela: o cálculo é sob demanda sobre
`Appointment`.

**O que ainda não existe é o diferencial**: agir por faixa. Hoje a regra
*informa* o risco; ninguém dispara nada a partir dele. Um concorrente que
mostra "risco alto" numa tela e não faz nada com isso está no mesmo lugar
que nós.

**E não há modelo estatístico** — nem deveria haver ainda, pelo motivo
abaixo.

### O que já está sendo coletado

| Sinal | Onde | Por que importa |
| --- | --- | --- |
| `CANCELLED` ≠ `NO_SHOW` | `Appointment.status` | **Cancelar é aviso; faltar é o problema.** Só a segunda categoria é o alvo da predição — separá-las desde o schema é o que torna o dado treinável depois |
| `confirmedAt` | `Appointment` | O paciente respondeu ao lembrete? Não responder é candidato natural a preditor |
| Histórico por paciente | `Appointment.patientId` | Quem já faltou tende a faltar de novo — é o sinal mais forte na literatura |
| Horário e dia | `startsAt` | Primeiro horário da manhã e véspera de feriado têm perfil de falta diferente |
| Procedimento e preço | `procedureId`, `priceInCents` | Ticket alto e procedimento eletivo têm risco diferente de retorno de rotina |

### Volume real (10/08/2026, banco de desenvolvimento)

```
total       28
COMPLETED   10
SCHEDULED    8
NO_SHOW      4     ← a classe que interessa prever
CONFIRMED    4
CANCELLED    2
```

**Isso não treina modelo nenhum.** Quatro exemplos positivos não sustentam
nem uma regressão logística simples, e pior: **é dado de seed, não de
paciente**. Os `NO_SHOW` foram escritos por um `plan` fixo em `seed.ts`, não
por alguém que faltou — um modelo treinado aqui aprenderia o padrão do
desenvolvedor. Antes de qualquer treino sério, é preciso volume real de
clínica em produção.

> O volume oscilou de 59 → 35 → 28 entre 04 e 10/08 porque o banco foi
> reseedado durante o desenvolvimento. Isso reforça o ponto: enquanto o
> histórico for seed, ele se apaga a cada limpeza e não acumula nada.

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
