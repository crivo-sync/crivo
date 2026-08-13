# Roadmap — Crivo

Onde estamos, o que a concorrência já entrega e o que falta construir.

> Última atualização: 2026-08-13.
>
> **O que era construível está construído.** `billing` completo (checkout,
> webhook, 4 planos com limites e features por faixa — travados no backend
> **e** no painel —, franquia de mensagens com contador, expiração automática
> do trial, upgrade pelo checkout com cancelamento da assinatura anterior),
> página pública de agendamento, tela de conversa (a recepção responde pelo
> painel), checklist de onboarding, **e-mails transacionais** (boas-vindas,
> assinatura, trial acabando, falha de cobrança) e **fotos antes/depois** com
> entrega autenticada — a última feature que faltava para clínica de estética.
> Desde 13/08 o painel também abre com **quanto as faltas custaram em reais**,
> e cada clínica envia pelo **seu próprio número de WhatsApp**.
>
> O **site** passou a falar dinheiro junto com o produto (13/08): manchete na
> dor, calculadora de quanto as faltas custam na clínica do visitante, e o
> jargão de engenharia fora de todas as páginas — com teste que falha se
> voltar.
>
> **O que segue aberto e depende de código:**
> - **Pareamento da Evolution por QR code** — hoje o nome da instância é
>   digitado à mão nas Configurações
>
> **O que segue aberto e não depende de código:**
> - **Credenciais da Meta** — adiado por custo. O provider está pronto e
>   selecionável; sem as chaves, escolher META faz o envio falhar. Até lá o
>   WhatsApp roda em Evolution, com risco de banimento **assumido**
> - **Template aprovado pela Meta** — só existe com conta Meta
> - **Webhook de `DELIVERED`** — a Evolution não entrega esse status de forma
>   confiável; faz sentido junto com a Meta
> - **Validar preço com clínica real** — os R$ 79/149/289/399 seguem sendo
>   hipótese; migraram de "número no README" para "produto no Stripe", não
>   para "validado com cliente"
>
> **Chat com IA foi avaliado e descartado** (12/08/2026), no público e no
> painel. Mas o recheque de 13/08 encontrou algo diferente e maior: a
> Clinicorp lançou **agentes de IA que executam** no WhatsApp — ver
> [A IA mudou de patamar](#a-ia-mudou-de-patamar-13082026).
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
| `prediction` | 🟡 **Regra + ação + tela + medição** (10/08/2026) — risco por fatores explicados, escalonamento de lembretes por faixa, aba "Risco de falta" e `GET /no-show/accuracy` comparando previsto × real. A medição existe e é honesta, mas **ainda não há amostra** para ela concluir nada (7 casos no banco de dev). Modelo estatístico segue dependendo de volume de produção |
| `medical-records` | 🟢 Anamnese + evolução append-only e **fotos antes/depois por atendimento** (13/08/2026), com entrega autenticada e URL assinada que expira. Restrito a ADMIN/PROFESSIONAL + plano com `hasMedicalRecords`. Falta anexo de exame em PDF |
| `waitlist` | 🟢 **Ciclo completo** (10/08/2026) — fila por ordem de chegada, tela na Agenda, sugestão automática ao cancelar um agendamento e oferta por WhatsApp |
| `billing` | 🟢 Checkout Stripe, webhook, 4 planos com limites e features por faixa, franquia de mensagens com contador, expiração automática do trial (11–12/08/2026). ⚠️ Preços seguem **hipótese não validada** com cliente real |
| `dashboard` | 🟢 Resumo do dia (agenda, a confirmar, mensagens que falharam) **liberado em todos os planos** desde 13/08/2026; gráficos e faturamento seguem em `hasDashboard`. A trava passou a ser por rota: travar o resumo fazia a clínica no Solo abrir o sistema e ver uma tela de erro como primeira coisa. **Custo das faltas em reais** (13/08/2026) no topo do painel, também liberado em todos os planos |
| `onboarding` | 🟢 `GET /tenants/me/onboarding` + checklist no painel (12/08/2026) — diz à clínica nova o que falta para a agenda funcionar |
| `mail` | 🟢 Quatro e-mails transacionais (13/08/2026): boas-vindas, assinatura confirmada, trial acabando (cron D-3) e falha de cobrança. Mailtrap Sandbox em dev; sem SMTP configurado o envio vira log e nada quebra |

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

**Camada mais barata, encontrada só no recheque de 13/08/2026** — não estava
no mapeamento original e muda a leitura da faixa de entrada:

| Sistema | A partir de | Observação |
| --- | --- | --- |
| Bellagenda | R$ 23,90 | Agendamento, lembrete WhatsApp, sinal via Pix |
| SPAgenda | R$ 29 (R$ 24,17 no anual) | Agendamento puro |
| Agendiva | R$ 39,90 (Solo/Pro/Studio até R$ 99,90) | Ficha por procedimento, lembrete 24h, comissão, vitrine pública |
| Elenya | R$ 49,90 | Confirmação WhatsApp 24h, fluxo de caixa básico |
| Gestek | R$ 69,90/**ano** | Agenda multiprofissional, fichas customizáveis |
| Avec | sob consulta | **Agendamento e resposta por IA no WhatsApp** + split de pagamento |
| Belle Software | sob consulta | Recursos de IA, assinatura eletrônica (+R$ 45), app do cliente (+R$ 150) |
| Booksy | R$ 99,99 | Marketplace global, forte em barbearia |

**Leitura do mercado:**

- **A faixa de entrada real é R$ 24–100, não R$ 39–120** (corrigido em
  13/08/2026). O mapeamento de 30/07 não viu a camada de agendamento puro
  (Bellagenda, SPAgenda, Agendiva, Elenya). Nosso Solo a R$ 79 está **dentro**
  dessa faixa, mas competindo com quem entrega menos por menos.
- **O mercado é fragmentado e ninguém domina.** Cada player é forte em um nicho (estética, odonto, convênio) e fraco nos outros — há espaço, mas não por preço.
- **Todos já têm agenda, prontuário e WhatsApp.** Isso é commodity. Competir nessas três é chegar tarde.
- **Fotos antes/depois também são commodity** (13/08/2026): Iter Clinic,
  Simples Agenda, Belle Software e Booksy já têm. Entregá-las nos tira de
  desvantagem, mas **não** é diferencial — o valor está em estarem ligadas ao
  atendimento e com entrega autenticada, que ninguém anuncia.
- **Franquia de mensagens já é praticada na faixa de entrada** — há plano de
  R$ 57 com 20 notificações/mês e R$ 99,86 com 50. Isso **valida a decisão de
  cota** do Crivo (Solo 500, Básico 1.500): não é invenção nossa, é como o
  mercado lida com o custo variável do WhatsApp. E mostra que nossas cotas são
  generosas em comparação.
- **Ninguém vende confiabilidade de entrega.** Todos anunciam "lembrete por WhatsApp"; nenhum anuncia o que acontece quando ele falha. É aí que a história da recepcionista vira oportunidade.
- **IA no WhatsApp desceu do topo para a faixa de entrada.** Não é mais só a
  Clinicorp Premium: Avec e Belle Software (ambos "sob consulta", perfil de
  salão/estética pequena) já anunciam agendamento e resposta por IA. O sinal
  que o ROADMAP mandava monitorar — "IA chegar na base do mercado" — está
  acontecendo agora.

---

## Análise competitiva detalhada: Estetia CRM

Escolhido como referência por ser o mais próximo do nosso posicionamento (estética + odonto, white-label).

### O que eles têm e nós não

| Funcionalidade | Deles | Nosso status | Prioridade |
| --- | --- | --- | --- |
| Lembrete de consulta por WhatsApp | ✅ Meta API oficial | ⚠️ funcionando em dev (Evolution); falta credencial Meta | 🔴 Crítica |
| Confirmação de consulta pelo paciente | ✅ | ✅ página pública `/c/:token` + botão (04/08/2026) | — |
| Prontuário eletrônico / anamnese | ✅ Ficha digital | ✅ anamnese + evolução (04/08/2026); sem anexos | — |
| Fotos clínicas antes/depois | ✅ | ✅ entrega autenticada + URL assinada (13/08/2026) | — |
| Agendamento online pelo paciente | ✅ 24h, sem app | ✅ backend (10/08) + página `/agendar/:subdomain` (12/08/2026) | — |
| Lista de espera / preenchimento de lacunas | ✅ | ✅ com sugestão automática ao cancelar e oferta por WhatsApp (10/08/2026) | — |
| Recall pós-procedimento | ✅ automático | ❌ (base do "reativação inteligente", Fase 2) | 🟠 Alta |
| Dashboard financeiro / fluxo de caixa | ✅ tempo real | ❌ (há faturamento por procedimento, não fluxo de caixa) | 🟠 Alta |
| Métricas de ocupação de agenda | ✅ | ❌ — exige modelar capacidade instalada | 🟡 Média |
| Multi-unidade (rede/franquia) | ✅ (Clinicorp) | ❌ — hoje 1 tenant = 1 clínica, sem hierarquia | 🟡 Média |
| **Agente de IA no WhatsApp** (agenda/confirma/cobra sozinho) | ✅ Clinicorp (3 agentes, plano Premium) **e agora também na faixa de entrada**: Avec e Belle Software | ❌ — ver ["A IA mudou de patamar"](#a-ia-mudou-de-patamar-13082026) | 🔴 **Reavaliar após 1º cliente** |
| Chat de IA na landing (qualificar visitante) | ⚠️ raro no setor | ❌ **por decisão** (12/08/2026) | — |
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

Conclusões que mudam o plano:

1. **WhatsApp não é diferencial, é bilhete de entrada.** Qualquer concorrente sério já tem. Sem lembrete automático, o produto não é comparável — independente de quão boa seja a predição.
2. **Prontuário é obrigatório para odontologia/dermato.** É requisito legal e operacional, não recurso "nice to have". Uma clínica não troca de sistema se perder o prontuário.
3. **Nosso diferencial real não é "prever no-show", é o que fazemos com a previsão.** Eles reduzem falta com lembrete e lista de espera — regras simples. O espaço para nos diferenciarmos é a ação automática e personalizada por risco, não o número em si.
4. **Confiabilidade de entrega é o diferencial que ninguém anuncia.** Todos prometem lembrete; ninguém promete que ele *chega*. Ver [A dor que valida o produto](#a-dor-que-valida-o-produto).
5. **O mercado virou "agente de IA que executa"** — e não só no topo. Em
   30/07 a IA era "rara no setor"; em 13/08 já está na Clinicorp Premium
   **e** na faixa de entrada (Avec, Belle Software). A frase que este
   documento escreveu duas semanas antes — "a faixa de entrada não seguiu" —
   envelheceu em duas semanas. Ver [A IA mudou de patamar](#a-ia-mudou-de-patamar-13082026).
6. **Fotos antes/depois entraram como paridade, não como diferencial**
   (13/08/2026). Iter Clinic, Simples Agenda, Belle e Booksy já tinham. Ter
   nos tira de desvantagem — uma clínica de estética descartava o produto sem
   isso —, mas não ganha venda sozinho.

### A IA mudou de patamar (13/08/2026)

A pesquisa de 30/07 registrou "chat com IA: raro no setor". **Isso envelheceu
em duas semanas.** Reconferido em 13/08/2026:

- **Clinicorp lançou os "Agentes Clinicorp IA"** — três agentes que operam no
  WhatsApp da clínica 24/7: **Agendamento** (marca, remarca, cancela),
  **Relacionamento** (confirma, persegue no-show, cobra orçamento e
  inadimplente) e **Captação** (qualifica lead de campanha). Com handoff para
  humano no meio da conversa e painel de "tempo economizado". O CEO declarou
  publicamente a meta de **dobrar de tamanho até 2027** com essa aposta.
- **Preço não divulgado** — a página manda falar com consultor. Combinado com
  o histórico deles de cobrar IA à parte (o comparativo de 30/07 já registrava
  "IA cobrada à parte"), a leitura é que é **add-on caro**, provavelmente
  ancorado no plano Premium (R$ 369,90).
- **A faixa de entrada NÃO seguiu.** Iter Clinic (R$ 39) e Clínica nas Nuvens
  (R$ 99) seguem vendendo prontuário + agenda + WhatsApp, sem agente autônomo.

**O que isso muda para o Crivo:**

1. **A decisão de 12/08 (não fazer chat de IA) continua certa para o que foi
   decidido** — chat na landing e "IA que conversa sobre o painel" seguem sem
   função. O que apareceu é **outra coisa**: agente que *executa* (marca,
   remarca, cobra), não que conversa.
2. **Não é ameaça no nosso preço, ainda.** Quem paga R$ 79–149 não está
   comparando com o Premium da Clinicorp. Vira ameaça quando (a) o preço do
   agente cair para a faixa de entrada, ou (b) a Clinicorp usar o agente como
   argumento para puxar cliente pequeno para cima.
3. **Metade do caminho já existe aqui, e é a metade difícil.** O agente deles
   precisa de: agenda com disponibilidade real ✅, lembrete automático ✅,
   confirmação por resposta ✅ (já interpretamos "sim"/"não" com
   `reply-intent`), lista de espera ✅, fila com retry ✅. O que falta é a
   camada de decisão — e é justamente onde IA erra caro (marcar horário
   errado, prometer preço).
4. **O risco de fazer errado é assimétrico.** Um agente que confirma consulta
   que não existe, ou marca em cima de outro paciente, destrói a confiança que
   o produto inteiro vende ("a agenda que não deixa de avisar"). Nossa regra
   de ouro atual — *IA redige, nunca decide fato* — foi escrita exatamente
   para isso.

**Encaminhamento:** não entra agora. Fica registrado como **o próximo
diferencial a avaliar depois de ter cliente pagante**, com escopo estreito
(um agente só, o de agendamento, com confirmação humana antes de gravar) em
vez de copiar os três de uma vez. Ver [Riscos](#riscos).

### Modelo de preço deles (conferido em 11/08/2026)

**Não usam tiers.** É **base R$ 39/mês + módulos avulsos**, e o cliente monta a
configuração:

| Módulo | Preço | Módulo | Preço |
| --- | --- | --- | --- |
| Plataforma Base (2 usuários, 1 profissional, 1 sala) | R$ 39 | WhatsApp Evolution | R$ 79 |
| Prontuário Eletrônico | R$ 29 | WhatsApp Cloud API (Meta oficial) | R$ 149 |
| Procedimentos & Tratamentos | R$ 19 | Marketing Clínico | R$ 49 |
| Fotos Before/After | R$ 19 | Financeiro & Fluxo de Caixa | R$ 39 |
| Pacotes de Sessões | R$ 15 | Analytics Avançado | R$ 39 |
| Recall Automático | R$ 25 | IA (Lite/Pro/Scale) | R$ 49 / 129 / 299 |

Capacidade extra: **+R$ 19/usuário**, **+R$ 15/profissional**, +R$ 9/sala.

Os exemplos que eles próprios publicam: **clínica solo R$ 166/mês**, clínica
média R$ 362, dermato com convênios R$ 660. Teste grátis sem cartão, **sem
duração declarada**.

**O que isso significa para o nosso preço:**

- **A porta de entrada deles é R$ 39, a nossa é R$ 149.** Na primeira
  comparação que o cliente faz — e ele faz — aparecemos ~4x mais caros, mesmo
  que a conta real feche perto (o "solo" deles dá R$ 166).
- **Somos mais baratos no meio da tabela.** Uma clínica que lá paga R$ 362
  paga R$ 289 aqui, com WhatsApp e predição inclusos. O problema é de
  *percepção de entrada*, não de valor entregue.
- **O modular favorece quem quer pouco; o pacote favorece quem quer tudo.**
  Nosso Intermediário embute IA, predição, lista de espera e painel — que lá
  seriam R$ 39+79+49+39 = R$ 206 só em módulos, sem contar prontuário.
- **Eles cobram R$ 29/mês só pelo prontuário.** Isso justifica tê-lo como
  diferencial do plano topo (Avançado), como ficou em 11/08/2026.
- **Resolvido em 12/08/2026:** criado o plano **Solo (R$ 79, 1 profissional)**
  como porta de entrada. A escada virou R$ 79 → 149 → 289 → 399. Os valores
  seguem sendo **hipótese não validada com cliente nenhum** — o que mudou foi
  a faixa de entrada, não a confiança no número.

### O que o Agendiva faz melhor que nós (13/08/2026)

Concorrente de R$ 39,90–99,90, focado em estética. Feature a feature não é
melhor — **mas vende melhor**, e isso importa mais do que parece:

1. **Vende dinheiro, não recurso.** A manchete deles é *"recupere até
   R$ 1.500/mês que sua clínica perde com faltas"*. A nossa é *"o motor que
   evita buracos na sua agenda"* — bonita, mas o dono da clínica precisa
   traduzir sozinho para reais. **Nós temos o dado para fazer essa conta e
   não fazemos**: `Appointment.priceInCents` × `NO_SHOW` do período é
   exatamente "quanto a falta te custou".
   → **Fechado em 13/08/2026**, nas duas pontas: `GET /dashboard/no-show-cost`
   + card no topo do painel (para quem já é cliente) e **calculadora na home**
   (para quem ainda não é). A calculadora não copia o "recupere até R$ 1.500":
   o visitante informa faltas/semana e ticket médio, e a conta é dele — não
   afirmamos quanto disso o Crivo evita, o que manteria a mesma régua da
   medição de acurácia (que se recusa a concluir com amostra pequena).
2. **Falam a dor em português de gente**: *"perdeu o caderninho da agenda de
   novo"*. Nós falamos "predição de risco de no-show" — que é o **como**, não
   o **quê**.
   → **Corrigido em 13/08/2026**: "no-show", "tríade integrada" e
   "multi-tenant white-label" saíram do site inteiro (home, planos e rodapé).
   Um teste E2E falha se o jargão voltar. A revisão achou de quebra quatro
   afirmações **erradas** — cobrança "por profissional ativo" (é mensalidade
   fixa), "plano Clínica" (extinto), relatórios multi-unidade (inexistentes)
   e dois módulos marcados "em desenvolvimento" já no ar.
3. **Prometem número verificável** ("reduz faltas em até 30%", "fecha
   comissão em 5 minutos"). Nós fugimos de número por honestidade — está
   certo não inventar, mas dá para prometer o que o produto **faz** com
   precisão: "todo envio que falha vira uma lista de quem ligar".

**O que temos e nenhum dos 11 concorrentes anuncia** (conferido no código,
não de memória):

- **Falha de envio nunca some**: lista de "ligue para estes pacientes" +
  reenvio manual. Todos prometem lembrete; **ninguém** promete o que
  acontece quando ele não chega.
- **Escalonamento por risco**: quem tende a faltar recebe D-72h **e** D-24h;
  quem sempre comparece recebe um só. Os outros mandam o mesmo lembrete para
  todo mundo.
- **Confirmação respondendo "sim"**, sem abrir link nem app.
- **Medição honesta da própria predição** (`GET /no-show/accuracy`), que se
  **recusa a concluir** com amostra menor que 30 casos. Nenhum concorrente
  expõe isso — e é o oposto de "reduz até 30%" sem fonte.

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
   - [x] **Recibo de confirmação com os dados da consulta** (13/08/2026) — era uma linha só ("Presença confirmada! ✅ Te esperamos na X") e destoava dos outros templates, que são estruturados. O motivo de mudar não é estética: **é a última mensagem que o paciente recebe antes da consulta**, e a que ele procura na conversa para lembrar do horário — sem os dados, precisava rolar até o lembrete antigo. Agora repete data, hora, procedimento e profissional no mesmo formato do lembrete. `confirm-by-reply` passou a carregar `patient.name`, `professional` e `procedure` na query (só tinha telefone e clínica), para o recibo ser idêntico nos dois caminhos de confirmação. Parâmetro opcional: sem ele, cai no texto curto de antes
   - [x] **Caixa de entrada** (10/08/2026) — aba "Recebidas" em Mensagens, com `GET /inbound-messages`, `PATCH :id/read` e `PATCH read-all`. O webhook já gravava tudo, mas ninguém lia: um "posso levar minha filha?" ficava no banco sem chegar a um humano. Decisões:
     - **`unreadTotal` fora do `meta` da paginação** — conta o tenant inteiro, não a página nem o filtro. É o número do badge, e dentro do `meta` mudaria a cada filtro aplicado
     - **`read-all` registrado ANTES de `:id/read`** — o Nest casa rota por ordem de registro, não por especificidade; invertido, `read-all` cairia em `:id/read` com `id = "read-all"`. Mesma armadilha já documentada em `MeController`
     - **`updateMany` com o tenant no `where`** (em vez de `update` por id) é o que impede uma clínica de marcar mensagem de outra sabendo o UUID
     - **Confirmação automática já nasce lida**, então a caixa mostra só o que precisa de gente. Não lidas aparecem em negrito e com fundo destacado
     - **Número fora da base aparece como "Não cadastrado"**, não como erro: quem escreve pela primeira vez costuma ser lead
     - Testado ao vivo: listagem, filtros `unreadOnly` true/false, marcar uma (badge cai de 3 para 2), marcar todas (vai a 0), id inexistente → 404, e **isolamento entre clínicas** — outra clínica vê 0 mensagens e recebe 404 ao tentar marcar mensagem alheia
   - [x] **Tela de conversa (responder pelo painel)** (12/08/2026) — `GET/POST /messages/conversation/:patientId`. A recepção lia e marcava como tratada, mas responder era pelo WhatsApp por fora do sistema — e aquela resposta não ficava registrada em lugar nenhum. Decisões:
     - **`Message.patientId` novo** (migration `20260812202740_add_message_patient_id`) — a tabela só ligava a paciente via `appointmentId`, que é opcional; uma resposta manual sem consulta marcada ficaria órfã. Espelha o `patientId` que `InboundMessage` já tinha desde o webhook de entrada. Migration **faz backfill** a partir de `appointment.patient_id`: sem isso todo o histórico automático apareceria como "sem paciente" na conversa. Os 4 pontos que criam mensagem (`lembrete`, `aviso`, `recibo`×2, `oferta de vaga`) passaram a gravar o campo
     - **Junção em memória, não no schema** — as duas tabelas continuam separadas pelo motivo de sempre (uma tem fila/tentativas, a outra não); `GetConversationUseCase` busca as duas por paciente e ordena. É o histórico de UM paciente, não do tenant
     - **Resposta manual usa a mesma fila dos envios automáticos** (BullMQ, retry, franquia, Bull Board) em vez de um envio síncrono à parte: o WhatsApp cai igual para os dois, e a recepção merece o mesmo fallback ("aparece em Falhas") nos dois casos
     - **Sem `@Roles`** — responder ao paciente é trabalho da recepção (STAFF), mesma decisão da caixa de entrada. Paciente de outro tenant devolve 404, conferido no use case
     - 7 testes unitários + 4 E2E. Verificado ao vivo: `MANUAL` criada → fila → worker → `SENT`; 400 em corpo vazio, 404 em paciente inexistente, 400 em uuid inválido, 401 sem token
   - ❌ **Chat com IA — descartado em 12/08/2026.** Cogitado nos dois lugares e recusado nos dois: no público, quem conversa é visitante anônimo (custo DeepSeek variável sem dono, e risco de a IA prometer horário ou preço errado para quem nem é cliente); no painel interno, não apareceu pergunta que a clínica faria a um chat e que as telas de Agenda, Risco de falta e Painel já não respondam melhor — seria custo por uso para reembalar dado que já está na tela. A IA segue onde tem função definida e verificável: **reescrever a mensagem de lembrete** (`aiMessagesEnabled`, com validação literal de nome/data/hora/link)
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
   - [x] **Fotos clínicas antes/depois** (13/08/2026) — a feature que faltava para estética, e a que o concorrente cobra à parte. Ligada ao **atendimento**, não só ao paciente: o que a clínica mostra é "resultado da aplicação de 12/08", e o atendimento dá data, procedimento e profissional de graça. Decisões:
     - **Não reusa o `uploadImage` existente**, que grava URL pública (correto para logo e avatar, inaceitável para foto clínica: abre para qualquer um com o link, sem login, para sempre). `uploadPrivateImage` sobe como `type: 'authenticated'`
     - **A URL nunca é guardada no banco** — é assinada e gerada a cada leitura, com 5 min de validade. Guardar significaria ter um campo com link morto
     - **`authenticated` e não `private`**: só o primeiro permite transformação assinada (o thumbnail da grade)
     - **O original não é transformado no upload**: foto clínica é prova de resultado, e recortar ou comprimir destrói o que ela documenta
     - **Pode ser excluída**, diferente da evolução (append-only): foto do paciente errado ou sem consentimento precisa sair de verdade. Arquivo primeiro, registro depois — na ordem inversa, um erro deixaria arquivo órfão sem ninguém saber que existe
     - Verificado ao vivo: URL assinada → 200; sem assinatura → 401; forçando `/upload/` → 401; `expires_at` no passado → 400; após excluir → 404 (o 200 inicial era **cache de CDN**, não o arquivo — parar no primeiro teste teria dado diagnóstico errado)
   - [ ] **Anexos de exame (PDF)** — as fotos resolveram o caso de imagem; PDF exige outro tratamento (`resource_type: 'raw'`) e ainda não tem demanda
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
5. **Onboarding da clínica nova** — 🟢 **entregue em 12/08/2026**
   - O cadastro self-service criava a clínica, mas ela nascia **sem profissional e sem procedimento** — e sem os dois o produto não funciona: a agenda não calcula horário, e a página `/agendar` divulgada pela clínica responde "Agenda ainda não disponível". Nada no painel dizia isso: ele abria todo zerado, sem explicação, e a clínica descobria pelo paciente reclamando que o link não funciona
   - [x] **`GET /tenants/me/onboarding`** — devolve `hasProfessional`/`hasProcedure`/`hasAppointment`/`subdomain`/`isComplete`. Decisões:
     - **Endpoint próprio, não `GET /dashboard/summary`** — aquele já devolve as contagens de profissional e procedimento **mas está atrás de `@RequiresPlanFeature('hasDashboard')`**, que Solo e Básico não têm. Reusá-lo faria o checklist sumir com 403 justamente no plano de entrada, que é quem mais precisa dele. Verificado ao vivo: com o tenant no Solo, `me/onboarding` → 200 e `dashboard/summary` → 403
     - **Mesmos guards de `GET /tenants/me`** (sem `TrialGuard`, sem `PlanFeatureGuard`): quem venceu o teste também precisa ver o que falta
     - **Os filtros são idênticos aos de `booking-options`** (profissional `isActive` + não excluído, procedimento `isActive`) — divergir faria o checklist dizer "tudo pronto" enquanto a página pública segue recusando, que é exatamente o problema que ele existe para evitar. Há teste garantindo os filtros
     - **`isComplete` exige os três**, incluindo o primeiro agendamento: só cadastrar profissional e procedimento não prova que a clínica sabe usar a agenda
     - **Divulgar o link não é item de checklist** — é ação fora do sistema, não temos como saber se aconteceu, e marcá-lo pendente para sempre deixaria o card eterno na tela. O link aparece com botão de copiar e um aviso de que ainda não aceita agendamento enquanto faltar cadastro
     - 5 testes unitários + 4 E2E

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
   - [x] **Medir a regra contra o que aconteceu** (10/08/2026) — `GET /prediction/no-show/accuracy?days=180` compara o risco previsto com o desfecho real, por faixa. Decisões:
     - **Reconstrói o risco COMO ERA antes de cada consulta** — usar o histórico de hoje seria trapaça: uma consulta de março seria avaliada sabendo das faltas de abril, e a regra pareceria muito melhor do que é. Só conta o que já tinha acontecido antes de `startsAt`, inclusive descartando `confirmedAt` posterior à consulta
     - **Só desfecho conhecido** (`COMPLETED`/`NO_SHOW`) — incluir `SCHEDULED` como "não faltou" contaria o futuro a favor da regra
     - **Se recusa a concluir com amostra pequena** — abaixo de 30 casos devolve `separates: null` e um veredito dizendo que os números são indicação, não conclusão. Um "33% de falta" apresentado como fato levaria a mexer nos pesos com base em ruído
     - **`separates: null` quando falta amostra numa ponta** — responder `false` sugeriria que a regra falhou, quando ela nem chegou a ser testada
     - **O veredito vem do backend**, não da tela: quem lê o número precisa da mesma ressalva em qualquer lugar
     - 7 testes, incluindo um que compara dois cenários (falta antes × falta depois) para provar que a ordem temporal é respeitada — se a falta futura vazasse, os dois dariam o mesmo resultado
     - **Estado hoje**: 7 atendimentos com desfecho no banco de dev — amostra insuficiente, e a medição diz isso. Validada com 140 casos sintéticos: HIGH 33,3% × LOW 0%, `separates: true`
   - [x] **Custo das faltas em reais** (13/08/2026) — `GET /dashboard/no-show-cost` + card no topo do painel. Nasceu da análise do Agendiva: o produto media no-show em contagem e percentual, que é linguagem de produto; dono de clínica pensa em dinheiro, e `Appointment.priceInCents` (preço congelado no ato) já permitia a conta. Decisões:
     - **Não afirma "R$ X recuperados pela lista de espera"**, que seria o número mais vendável e o que o concorrente anuncia. `WaitlistEntry` vira `OFFERED` e para por aí — não registra se a oferta virou agendamento. Fazer a conta assim mesmo seria inventar o principal número da tela
     - **"Falta evitada" exige `COMPLETED` + `confirmedAt`** — sem a confirmação seria só "veio à consulta", que aconteceria com ou sem o Crivo. É o mais perto de "o produto salvou isso" que o dado sustenta
     - **Taxa é `null`, não `0`, em mês sem desfecho** — 0% afirmaria "nenhum paciente falta aqui". E na tela ela só aparece com 5+ atendimentos concluídos: "100% de faltas" com um atendimento é ruído, não diagnóstico
     - **Fora do `hasDashboard`**, como o `summary`: esconder de quem está no Solo esconderia o próprio argumento de venda
     - Mês sem falta vira card verde ("Nenhuma falta este mês"), não um card de alerta zerado — que passaria a impressão oposta
     - 5 testes do use case + verificado ao vivo no painel: "As faltas custaram este mês · R$ 350,00 · 1 paciente faltou"
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
   - [x] **Backend** (10/08/2026) — `GET /public/:subdomain/booking-options`, `GET .../availability` e `POST .../bookings`. Sem autenticação: a clínica vem do subdomínio. Decisões:
     - **Reserva direto** (decisão do produto): o horário some da agenda na hora e o paciente recebe confirmação imediata — é o que ele espera de "agendamento 24h". A recepção vê a origem e cancela se precisar
     - **`Appointment.origin`** (`STAFF`/`ONLINE`) — a recepção precisa distinguir horário nobre ocupado por alguém que ela não atendeu, e saber que aquele cadastro entrou sem triagem
     - **Reusa `CreateAppointmentUseCase` e `GetAvailabilityUseCase`** do painel, em vez de reimplementar. Duplicar as regras de expediente/grade/conflito garantiria divergência — e a rota pública é justamente a que não pode falhar em silêncio
     - **Todo id é conferido contra o subdomínio** — sem isso, alguém marcaria na clínica A com o id de um profissional da B. Verificado: 404
     - **Resposta enxuta de propósito** — a página é aberta na internet; não devolve telefone/e-mail de profissional nem id interno de paciente
     - **Paciente é reusado pelo telefone** — evita duplicar a mesma pessoa a cada agendamento e preserva o histórico de faltas que alimenta a predição
     - Verificado ao vivo **sem token**: opções → 11 vagas → agendamento criado com `origin: ONLINE`, paciente cadastrado e **2 lembretes** disparados (a predição classificou como risco alto). Recusas corretas: clínica inexistente (404), profissional de outra clínica (404), horário ocupado (409), passado e telefone inválido (400)
   - [x] **Página pública** (crivo-fe, 12/08/2026) — `/agendar/[subdomain]`, o paciente marca sozinho sem login. Cascata profissional → procedimento → dia → horário (a mesma do painel: sem os dois primeiros o backend não calcula horário livre). Chips mostram início → fim, e não só o começo. Clínica inexistente cai em 404 via `notFound()`, em vez de um formulário que nunca funcionaria. `robots: noindex` — página de clínica não deve ser indexada como conteúdo do Crivo. Verificado ao vivo: agendamento criado com `origin: ONLINE`, paciente cadastrado pelo telefone e **as duas mensagens** enfileiradas (aviso de marcação + lembrete); recusas corretas em horário ocupado (409) e data no passado (400). 5 testes E2E novos

### Fase 3 — Monetização e retenção

8. **`billing`** — 🟢 **checkout, webhook, limites por plano, tela de assinatura e site conectado — tudo entregue em 11/08/2026** (Stripe modo teste)
   - [x] **Model `Plan`** — 3 planos seedados a partir dos produtos reais do Stripe Dashboard (`Básico`/`Intermediário`/`Avançado`, `stripeProductId`+`stripePriceId`). Preço ainda é placeholder (R$149/289/399) — o dono do produto vai validar os valores finais antes de qualquer lançamento comercial; ver aviso em "Website — o que falta"
   - [x] **`Tenant.planId`/`stripeCustomerId`/`stripeSubscriptionId`** — a assinatura continua como colunas do próprio Tenant, não um model `Subscription` separado (é sempre 1:1, nunca precisou da tabela própria que o Stripe-por-usuário do snap-financial tem)
   - [x] **`POST /billing/checkout`** — cria/reaproveita o Stripe Customer, abre Checkout Session com `metadata: {tenantId, planId}` (não `client_reference_id` — é o que o webhook lê de volta, mesmo padrão do snap-financial)
   - [x] **`POST /billing/webhook`** — trata `checkout.session.completed` (grava plano+status+ids), `customer.subscription.updated` (`mapStripeStatus`) e `customer.subscription.deleted` (`CANCELED`). Sem guard de propósito: a única credencial é a assinatura HMAC, verificada com `req.rawBody` (`NestFactory.create(..., { rawBody: true })` — o Nest já expõe isso nativamente, sem precisar do middleware `verify` manual que o snap-financial usa)
   - [x] **`TrialGuard` estendido** — bloqueia `EXPIRED` (trial vencido) e agora também `CANCELED` (assinatura cancelada no Stripe). `PAST_DUE` passa de propósito: dá margem ao retry automático do Stripe antes de cortar acesso por uma falha momentânea de cartão
   - [x] **Limites por plano** (11/08/2026) — dois mecanismos diferentes, por natureza da regra:
     - **`PlanFeatureGuard` + `@RequiresPlanFeature(...)`** — feature toda-ou-nada, aplicada no controller inteiro. Tenant em trial (sem `planId`) sempre passa
     - **Limite de profissionais dentro do `CreateProfessionalUseCase`** (não um guard) — é um contador, não um booleano; a regra de negócio (contar `deletedAt: null`, ignorar quem foi removido) vive na camada de aplicação, não espalhada num guard genérico
     - `hasAiMessages` do `Plan` existe no schema mas **não trava nada ainda** — débito consciente: `Tenant.aiMessagesEnabled` já é um toggle livre em Configurações, e cruzar os dois exige decidir qual vence, o que não foi feito ainda
   - [x] **Diferenciais reais por plano** (11/08/2026) — **Intermediário e Avançado eram idênticos no banco**: mesmos limites, mesmas features, R$110/mês de diferença por nada. Nenhum ajuste de UI resolvia — as colunas mostravam o mesmo porque *eram* o mesmo. Três flags novas em `Plan` (`hasWaitlist`, `hasDashboard`, `hasMedicalRecords`) passaram a vender módulos que o backend **já entregava e nenhum plano cobrava**:

     | | Básico | Intermediário | Avançado |
     | --- | --- | --- | --- |
     | Profissionais | 2 | ilimitados | ilimitados |
     | Predição de no-show | ❌ | ✅ | ✅ |
     | Lista de espera | ❌ | ✅ | ✅ |
     | Painel com gráficos | ❌ | ✅ | ✅ |
     | Mensagens com IA | ❌ | ✅ | ✅ |
     | Prontuário | ❌ | ❌ | ✅ |

     - **Prontuário como diferencial do topo** porque é exatamente o que o concorrente cobra à parte (R$ 29/mês avulso) — ver "Modelo de preço deles"
     - **Agendamento online fica em todos os planos**, de propósito: é a feature que traz paciente novo sem trabalho da recepção, e travá-la no Básico reduziria o valor de entrada justo onde já estamos caros vs. concorrência. Além disso é rota pública (`/public/:subdomain`), então travá-la exigiria resolver o plano pelo subdomínio, não pelo token
     - `RequiresPlanFeature` deixou de ter uma união escrita à mão e passou a **derivar o tipo do próprio `Plan`** (`{[K in keyof Plan]: Plan[K] extends boolean ? K : never}`) — flag nova no schema já fica disponível sem ninguém lembrar de atualizar lista
     - Testado ao vivo nos **quatro** planos (12/08/2026): Solo e Básico recusam 403 em `waitlist`, `dashboard/summary`, `prediction` e `anamnesis`; Intermediário libera os três primeiros e recusa prontuário; Avançado libera tudo. Limite de profissionais respeitado em cada faixa (Solo recusa o 2º, Básico o 3º), com o nome do plano na mensagem
   - [x] 🐞 **`prisma:seed:clean` quebrado** (12/08/2026) — `clean()` apagava `procedure` antes de `waitlist_entries`, que a referencia (`waitlist_entries_procedure_id_fkey`). Faltavam três tabelas criadas depois que a ordem de exclusão foi escrita: `waitlistEntry`, `inboundMessage` e `messageTemplate`. Recriar o banco do zero era impossível desde que a lista de espera entrou
   - [x] **Tela "Assinatura" em `/painel/configuracoes`** (`crivo-fe`) — mostra plano atual, alerta por status (`TRIALING`/`PAST_DUE`/`CANCELED`), grid dos 3 planos com o de origem destacado (`isCurrent`) e botão que chama `POST /billing/checkout` e redireciona pro Stripe. Restrito a ADMIN nas duas camadas (backend `@Roles` + frontend desabilita o botão e mostra aviso)
   - [x] **Site institucional lendo `GET /plans` de verdade** — `/planos` e a home pararam de usar `_data/pricing-plans.ts` (removido) e passaram a buscar os planos reais via `usePlans()`, com um mapeador (`plan-to-pricing-card.ts`) que nunca hardcoda preço. Como consequência, os nomes dos planos no site mudaram de Essencial/Clínica/Rede para Básico/Intermediário/Avançado — os antigos prometiam cobrança por assento (+R$49/profissional) e multi-unidade, nenhum dos dois existe no backend; decisão explícita do dono do produto de alinhar o marketing ao que existe, em vez de manter a promessa e re-seedar nomes. Página `(website)` ganhou `PublicQueryProvider` (React Query sem a lógica de logout automático do provider do painel — não faz sentido numa página sem sessão)
   - [x] Testado ao vivo, ponta a ponta: checkout completado com cartão de teste (`4242...`) via Playwright → webhook grava `subscriptionStatus: ACTIVE` + `planId` + `stripeSubscriptionId` → cancelamento via API → webhook grava `CANCELED` → `GET /patients` passa a responder 403 com mensagem clara. Tela de assinatura testada como ADMIN (checkout redireciona pro Stripe de verdade) e como STAFF (botão desabilitado, aviso visível)
   - [x] **Expiração automática do trial** (12/08/2026) — `ExpireTrialsCron`, primeiro cron do projeto (`ScheduleModule` nunca tinha sido registrado). Roda 3h da manhã porque o efeito é bloquear acesso: fazê-lo no expediente tiraria a agenda da recepção no meio de um atendimento. O `SubscriptionGuard` já marcava `EXPIRED` em request-time, mas só para quem *tenta usar* — clínica que parou de entrar ficava com o status errado no banco por tempo indeterminado, distorcendo qualquer contagem de trials vencidos. Idempotente e filtrado por `TRIALING`, o que protege quem paga em dia. 3 testes
   - [x] **Cota de mensagens no trial** (12/08/2026) — 30 mensagens. Medi o custo real antes de escolher o número: com o volume do seed (~19 msgs/15 dias numa agenda de 30 consultas) e utility a ~R$0,04–0,08, um trial de uso pesado custaria R$5–10. Trinta mensagens dão para percorrer o produto inteiro (marcar, receber aviso, lembrete e confirmar) mantendo o custo por trial abaixo de R$3. **O custo unitário nunca foi o problema — é o volume de contas que não convertem.**
   - [x] **WhatsApp obrigatório no cadastro** (12/08/2026) — o formulário não pedia telefone nem e-mail da clínica, então clínica criada pelo cadastro nascia sem nenhum contato próprio (só o e-mail do usuário admin). Agora `phone` é obrigatório em `RegisterDto` (`^\d{10,11}$`) e no schema Zod do frontend
   - [x] 🔁 **Upgrade voltou a passar pelo checkout do Stripe** (13/08/2026) — a correção anterior (trocar o preço da assinatura via `subscriptions.update`) resolvia a duplicidade, mas tirava a tela de pagamento **e** silenciava o e-mail de confirmação: o `planId` era gravado antes do webhook chegar, então `planChanged` dava `false` e `checkout.session.completed` não disparava nada. Agora:
     - **Upgrade e primeira assinatura → checkout**, onde o cliente vê o valor e confirma. É o `checkout.session.completed` que dispara o e-mail
     - **Downgrade → `subscriptions.update` com `proration_behavior: 'none'`**, sem passar pelo checkout: cobrar de novo para descer de plano seria absurdo, e o mês do plano maior já foi pago
     - **A assinatura anterior é cancelada pelo webhook**, quando a nova confirma — o checkout do Stripe sempre cria assinatura nova, nunca substitui. Cancelamento **antes** de gravar a nova: se falhar, o tenant continua apontando para a antiga e o `stripe:pull` detecta; gravando primeiro, uma falha deixaria a antiga cobrando em silêncio
     - Reprocessar o mesmo evento não cancela a assinatura vigente (o Stripe reentrega quando não recebe 200 a tempo). 4 testes novos
   - [x] 🐞 **Troca de plano criava assinatura nova em vez de trocar a existente** (13/08/2026) — o checkout era sempre aberto, sem checar se já havia assinatura. Cada mudança de plano virava mais uma cobrança: chegou a **três assinaturas ativas simultâneas no mesmo cliente (R$ 727/mês)** antes de ser notado. Agora `POST /billing/checkout` decide: sem assinatura abre o checkout; **com** assinatura troca o preço dela (`subscriptions.update`). Decisões:
     - **Upgrade vale na hora** (`proration_behavior: always_invoice`): cobra a diferença proporcional e libera o acesso imediatamente
     - **Downgrade só no fim do ciclo** (`none` + `planId` NÃO gravado agora): o cliente já pagou o mês inteiro do plano maior, e rebaixar na hora tiraria recurso pago. Quem grava o plano novo é o webhook `customer.subscription.updated`, quando o ciclo vira
     - **O preço da assinatura é a fonte da verdade do plano** no webhook — é isso que faz o downgrade agendado ser efetivado no momento certo, sem cron próprio
     - Recusa assinar o plano que já está contratado (400). 5 testes
   - [x] 🐞 **`hasAiMessages` não travava nada** (13/08/2026) — débito registrado desde 11/08 e que apareceu na prática: clínica no Básico com o toggle de IA ligado em Configurações usava DeepSeek sem pagar por ele. Agora a decisão cruza `Tenant.aiMessagesEnabled` **e** `Plan.hasAiMessages`, nos dois pontos: o envio (`ScheduleAppointmentReminder`) e o próprio toggle (`UpdateTenantUseCase` recusa com 400 dizendo o plano e para onde ir). Trial (`plan: null`) continua liberado — é como a clínica experimenta. Desligar nunca é bloqueado, senão quem tem o toggle ligado por dado antigo ficaria travado. 5 testes
   - [x] **E-mails transacionais** (13/08/2026) — módulo `mail` novo, com quatro mensagens: boas-vindas no cadastro, assinatura confirmada (plano, valor, franquia e próxima cobrança), trial acabando (D-3, cron às 9h) e falha de cobrança. Decisões:
     - **`MailService.send` nunca lança.** Todo e-mail aqui é acessório à operação que o disparou; deixar uma falha de SMTP derrubar o pagamento recém-aprovado seria trocar um problema pequeno por um grave. Falha vira log
     - **Sem SMTP configurado, o envio vira log e nada quebra** — dá para rodar o projeto e a suíte sem credencial nenhuma
     - **Envio fora da transação** no cadastro: segurar conexão do banco esperando SMTP derruba o pool sob carga
     - **Aviso de trial em janela de UM dia** (`gte` D+3, `lt` D+4): sem a janela fechada, o mesmo tenant receberia o aviso em toda execução diária até vencer. Às 9h, não às 3h da expiração — é e-mail para ser lido
     - **Falha de pagamento só na virada** para `PAST_DUE`: o Stripe reenvia `updated` a cada tentativa, e sem comparar com o status anterior a clínica receberia o mesmo aviso várias vezes
     - Tabelas e estilo inline no HTML (cliente de e-mail ignora `<style>` e não faz flexbox), com versão em texto puro junto
   - [x] **Contador de uso de mensagens** (12/08/2026) — `GET /billing/usage` devolve `{used, limit, isTrial}` do mês corrente (ou da janela de trial). Método `usage()` separado de `execute()` no mesmo `CheckMessageQuotaUseCase`: o primeiro sempre devolve o consumo real, o segundo só devolve `used`/`limit` quando a cota já estourou (contrato de bloqueio, não de exibição). Ficou no `BillingController`, não no `MessageController` — este último tem `TrialGuard`, que bloquearia justamente a clínica que mais precisa ver o próprio consumo ao vencer o trial. Card correspondente em `crivo-fe` na aba Assinatura, no padrão visual do `LimitCard` do Snap Financial
   - [x] **Dados de contato e horário no agendamento público** (12/08/2026) — `GET /public/:subdomain/booking-options` passou a incluir `email`, `businessHoursStart`, `businessHoursEnd` e `businessDays` da clínica (antes só `phone`/`address`). Frontend mostra "Seg a Sex · 08:00 às 18:00" (dias soltos viram faixas contínuas) e o telefone do rodapé passou a usar `formatPhone`, que já existia mas não estava aplicado nessa página
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
3. **Medir a regra** contra o que de fato aconteceu — ✅ construído em
   10/08/2026 (`GET /prediction/no-show/accuracy`). O mecanismo existe e
   reconstrói o risco como era **antes** de cada consulta, sem deixar o
   futuro vazar. O que falta agora não é código: é **volume real**. Com 7
   atendimentos concluídos, a própria medição se recusa a concluir.
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
| **Textos do site desalinhados do produto** | ✅ corrigido em 10/08/2026 — o site prometia reativação de pacientes e painel de ocupação, que não existem, e omitia lista de espera e agendamento online, que existem. Auditar o site contra o backend precisa virar hábito a cada feature nova |
| **Cadastro self-service (`/cadastro`)** | ✅ entregue em 11/08/2026 — o formulário de contato ("falamos em até 1 dia útil") virou CTA para uma página de cadastro real. Usa `POST /auth/register`, que já existia mas não devolvia token; o frontend contorna chamando login em seguida com as mesmas credenciais, sem mudar o backend. Todo CTA "Comece grátis" do site (inclusive o antigo "Rede — Falar com vendas") aponta para lá — decisão explícita de manter **inteiramente automático**, sem etapa manual de vendas |
| **Trial real (14 dias, sem cartão)** | ✅ entregue em 11/08/2026 — deixou de ser só copy. `Tenant.subscriptionStatus`/`trialEndsAt` gravados na hora do cadastro; `TrialGuard` bloqueia (403) todo controller autenticado do painel quando vence, exceto `GET /tenants/me` (de propósito — é de lá que o painel lê a data para avisar a clínica). Sem cron: o guard checa `trialEndsAt` em request-time e marca `EXPIRED` no banco de forma preguiçosa, no primeiro request depois do vencimento. Frontend mostra banner nos últimos 3 dias e mensagem clara quando bloqueado (`crivo-fe/src/app/(dashboard)/_components/trial-banner.tsx`) |
| **`/planos` com 4 colunas (Teste + 3 planos)** | ✅ entregue em 11/08/2026 — a grade abre com um card de **Teste grátis** (14 dias, sem cartão) seguido de Essencial (R$ 149), Clínica (R$ 289 + R$ 49/profissional extra) e Rede (sob consulta), no mesmo padrão visual do Snap Financial. Os valores seguem sendo **hipótese não validada** (ver abaixo) e o rodapé da grade diz isso; nenhum CTA leva a checkout — todos vão para `/cadastro`, que inicia o trial. A página chegou a ser reduzida a um card único de trial no mesmo dia, revertido a pedido do dono do produto. Features inexistentes ("Reativação inteligente", "Painel de métricas de ocupação") **não** voltaram: a auditoria de 10/08 segue valendo |
| **Chat com IA (DeepSeek)** | ❌ **Descartado em 12/08/2026** | Atendimento/qualificação do visitante na landing. Recusado: conversa com visitante anônimo é custo variável sem dono, e uma IA que fala de preço/horário para quem ainda não é cliente erra caro. O `DeepSeekTextGenerator` continua onde tem função verificável (reescrever lembrete, com validação literal dos dados) |
| **Planos pagos com Stripe** | 🟢 **checkout, limites, tela de assinatura e site conectado — 11/08/2026** | Ver detalhe completo em "Prioridades revisadas → Fase 3 → `billing`". O site (`/planos` e a home) lê `GET /plans` de verdade — nomes migraram de Essencial/Clínica/Rede para Básico/Intermediário/Avançado, batendo com o Stripe Dashboard. **Antes de anunciar preço em produção**: os R$149/289/399 seguem sendo placeholder — migraram de "hipótese no README" para "produto real no Stripe Dashboard", mas não foram validados com cliente nenhum. **Débito**: `hasAiMessages` do `Plan` não trava nada ainda — cruzar com `Tenant.aiMessagesEnabled` (toggle livre hoje) fica pendente |

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

**Decisões de cobrança — `billing` já implementado (11–12/08/2026):**

- [x] **Faixas fechadas, não cobrança por assento** (11/08/2026) — os planos vendem limite de profissionais por faixa (Solo 1, Básico 2, Intermediário/Avançado ilimitados) em vez de +R$49 por profissional extra. Resolve o "caros justamente no cliente bom": 5 profissionais custariam R$436 no modelo de assento contra R$289 na faixa
- [x] **Plano de entrada criado** (12/08/2026) — Solo a R$ 79, 1 profissional. A escada virou 79 → 149 → 289 → 399. Ainda acima dos R$39 do Estetia, mas dentro da faixa de entrada do mercado (R$39–120)
- [x] **Franquia de conversas por plano** (12/08/2026) — Solo 500, Básico 1.500, Intermediário 5.000, Avançado sem teto; trial 30 (`TRIAL_MESSAGE_QUOTA`). Bloqueio no `MessageProcessor`, antes do `provider.send()`: a mensagem é marcada `FAILED` com o motivo, então **aparece na lista de falhas** onde a recepção age — sumir em silêncio deixaria o paciente sem aviso e a clínica sem saber. Conta só `SENT` do mês corrente: mensagem na fila ainda pode ser cancelada por reagendamento, e falha não gera custo. Resposta de paciente (`InboundMessage`) não conta, porque a Meta não cobra dentro da janela de 24h. **Preço do excedente ainda não definido** — hoje bloqueia, não cobra a mais
- [x] **Duração do trial e expiração** (12/08/2026) — 14 dias, sem cartão. `SubscriptionGuard` marca `EXPIRED` em request-time e o `ExpireTrialsCron` (3h da manhã) pega quem parou de entrar. Franquia de 30 mensagens no teste, com contador na tela de Assinatura
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
| ~~Instância do WhatsApp única para o servidor inteiro~~ | ✅ **Resolvido em 13/08/2026.** Era um bloqueio de multi-tenant: `EVOLUTION_INSTANCE` é variável de ambiente, então **todas as clínicas enviariam pelo mesmo número** — o paciente da Clínica A receberia mensagem do número da Clínica B. Hoje não aparece porque só há uma clínica real. Resolver exige: campo `evolutionInstance` por `Tenant`, o `MessageProviderResolver` passando a instância ao provider (hoje ele resolve só *qual* provider), e uma tela para a clínica parear o próprio número por QR code. **Vale a mesma decisão para a Meta**: lá é um `phone_number_id` por clínica, mesma modelagem. Agora `Tenant.evolutionInstance` guarda o número de cada clínica, o `MessageProviderResolver` devolve **provider + remetente** juntos (são a mesma decisão), e o `PATCH /tenants/me` valida o formato — nome com barra viraria path traversal na URL da Evolution. `null` cai no padrão do servidor, aceitável enquanto há uma clínica. **Falta a tela de pareamento por QR code**, hoje o nome é digitado à mão |
| **Evolution API em produção** (decidido em 05/08/2026 por custo) | ⚠️ **Risco aceito, não mitigado.** Banimento é permanente e sem recurso — perderíamos o número junto com a agenda do cliente. Mitigações possíveis enquanto durar: número dedicado (nunca o pessoal do dono), volume baixo, opt-in real do paciente, e a lista de falhas já existente para a recepção ligar. Migrar para a Meta assim que houver caixa é o plano, e o código já é plugável (`MESSAGING_PROVIDER`), então a troca é de env var, não de refactor |
| Meta mudar preço ou política de conversa | Repassar como excedente transparente, nunca absorver em silêncio |
| Custo do DeepSeek por mensagem (feature de IA opcional) | Baixo por chamada, mas escala com volume — medir custo real por clínica antes de decidir se entra na franquia padrão ou é add-on pago do plano |
| IA alucinar ou distorcer um dado da mensagem | **Mitigado por design:** prompt restringe a redigir, nunca a decidir fato; validação pós-geração confere nome/data/hora/link literalmente antes de aceitar o texto — se algo faltar, cai no template fixo |
| **Webhook do Stripe apontando para rota inexistente** (dev) | ⚠️ **Diagnosticado em 13/08/2026.** O `stripe listen` estava com `--forward-to localhost:3333/stripe/webhook`, mas a rota é **`/billing/webhook`** — todo pagamento de teste ia para um 404. O sintoma engana: o checkout completa, o Stripe cobra de verdade, e o banco fica em `TRIALING` como se nada tivesse acontecido. O `.env.example` já documenta o comando certo. Em produção não se aplica (a URL é cadastrada no dashboard) |
| **Link de confirmação apontando para túnel morto** (dev) | ⚠️ **Mitigado por script** (13/08/2026). O `/c/:token` que vai no WhatsApp é montado com `PUBLIC_APP_URL`, e em dev isso é um túnel efêmero cuja URL muda a cada restart — 9 mensagens chegaram a sair com um subdomínio morto (`DNS_PROBE_FINISHED_NXDOMAIN`). `./tunnel.sh` sobe o ngrok, grava a URL nova no `.env` e restaura ao sair. **Precisa reiniciar o processo do backend** — verificado que `--watch` NÃO basta: o `ConfigService` lê o `.env` uma vez no boot do processo, e o watch recarrega os módulos mantendo o mesmo processo Node. Em produção o problema não existe: a URL é fixa. **Cloudflare não é opção nesta rede** (porta 7844 bloqueada em TCP e UDP) |
| **IA no WhatsApp virando padrão de mercado** (Clinicorp, Avec, Belle — 2026) | 🔴 **Risco subiu de nível em 13/08/2026.** O sinal que este documento mandava monitorar ("IA chegar na faixa de entrada") **já aconteceu**: não é mais só a Clinicorp Premium (R$ 369,90) — Avec e Belle Software, ambos de perfil salão/estética pequena, já anunciam agendamento e resposta por IA. Segue **não mitigado**, e a resposta continua sendo não copiar: um agente que marca em cima de outro paciente destrói a confiabilidade que o produto vende. Mas o argumento "ninguém tem IA nessa faixa" morreu. Reavaliar escopo estreito (só agendamento, com confirmação humana) **assim que houver cliente pagante** |

---

## Fontes

Consultadas em 30/07/2026, com **recheque de IA em 13/08/2026**. Preços mudam —
reconfirmar antes de usar em decisão comercial. O recheque mostrou que duas
semanas bastaram para invalidar um item ("IA rara no setor"): trate qualquer
linha com mais de um mês como suspeita.

**Recheque de 13/08/2026 (agentes de IA e faixa de entrada):**

- [Melhores sistemas para clínica de estética — comparativo Agendiva](https://agendiva.com.br/melhores-sistemas-para-clinica-de-estetica) (11 sistemas; ⚠️ publicado por concorrente)
- [Sistema de agendamento: preço em 2026 — SPAgenda](https://spagenda.com/artigo/quanto-custa-sistema-agendamento) (faixa R$ 24–100 e planos com franquia de notificação)

- [Agentes Clinicorp IA — página do produto](https://www.clinicorp.com/agentes-clinicorp-ia)
- [Clinicorp aposta em agentes de IA para dobrar de tamanho até 2027 — Brazil Economy](https://brazileconomy.com.br/empresas/2026/02/clinicorp-aposta-em-agentes-de-ia-para-automatizar-clinicas-e-dobrar-de-tamanho-ate-2027/)
- [Qual o melhor sistema para Clínica Estética no Brasil em 2026 — Iter Clinic](https://www.iterclinic.com/blog/qual-o-melhor-sistema-para-clinica-estetica-no-brasil-em-2026)

**Consulta original (30/07/2026):**

- [Estetia CRM](https://estetiacrm.com.br/)
- [Os 6 melhores sistemas de gestão para clínica estética no Brasil — Iter Clinic](https://www.iterclinic.com/blog/os-6-melhores-sistemas-de-gestao-para-clinica-estetica-no-brasil-testados-em-2026)
- [Quanto custa o Clinicorp? Valores 2026](https://www.clinicasyspro.com.br/clinicasyspro-vs-clinicorp.html)
- [7 melhores softwares odontológicos em 2026 — Codental](https://www.codental.com.br/blog/melhores-softwares-odontologicos/)
- [Onda de banimentos no WhatsApp: por que 2026 é o fim das APIs não oficiais](https://wehsoft.com/blog/banimentos-whatsapp-2026)
- [WhatsApp Cloud API oficial vs Evolution API](https://blog.flyvet.com.br/whatsapp-cloud-api-vs-evolution-api-clinica-veterinaria/)

> ⚠️ Os comparativos de mercado são publicados por empresas do próprio setor e podem favorecer o autor. Os preços de entrada batem entre fontes diferentes, mas os "pontos fracos" atribuídos a concorrentes devem ser lidos com ceticismo.
