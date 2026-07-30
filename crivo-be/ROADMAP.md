# Roadmap — Crivo

Onde estamos, o que a concorrência já entrega e o que falta construir.

> Última atualização: 2026-07-30. Análise competitiva baseada em material público dos sites e comparativos de mercado consultados em 30/07/2026.

---

## Onde estamos hoje

| Módulo | Status |
| --- | --- |
| `auth` | 🟢 Registro, login, refresh com rotação, RBAC (ADMIN/STAFF) |
| `tenants` | 🟢 CRUD + branding público por subdomínio |
| `users` | 🟢 Gestão de equipe (ADMIN) |
| `patients` | 🟢 CRUD, busca, paginação, soft delete |
| `scheduling` | 🟢 Profissionais, procedimentos, agenda com conflito de horário e ciclo de status |
| `messaging` | 🟢 Lembrete D-1, confirmação por link, retry e lista de falhas (falta template Meta e webhooks) |
| `prediction` | ⚪ Não iniciado |
| `billing` | ⚪ Não iniciado |

Temos uma base sólida de cadastro e agenda. **Ainda não temos nada do que diferencia o produto** — a tríade agenda + comunicação + predição existe só no primeiro terço.

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
- **Usar a Meta Cloud API oficial desde o início é decisão de produto**, não preferência técnica. É mais caro por conversa, mas é o que impede o cenário "número banido, agenda parada".
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
| Lembrete de consulta por WhatsApp | ✅ Meta API oficial | ❌ | 🔴 Crítica |
| Confirmação de consulta pelo paciente | ✅ | ❌ (só a recepção muda status) | 🔴 Crítica |
| Prontuário eletrônico / anamnese | ✅ Ficha digital | ❌ | 🔴 Crítica |
| Fotos clínicas antes/depois | ✅ | ❌ | 🟠 Alta |
| Agendamento online pelo paciente | ✅ 24h, sem app | ❌ | 🟠 Alta |
| Lista de espera / preenchimento de lacunas | ✅ | ❌ | 🟠 Alta |
| Recall pós-procedimento | ✅ automático | ❌ | 🟠 Alta |
| Dashboard financeiro / fluxo de caixa | ✅ tempo real | ❌ | 🟠 Alta |
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
   - [x] **Fallback visível:** esgotou as tentativas → `GET /messages/failed` lista quem precisa de ligação
   - [x] Providers plugáveis (`fake` / `evolution` / `meta`) por env var
   - [x] Rastro de cada envio em `messages` (base para contar conversas por clínica)
   - [x] **Mensagens com IA (DeepSeek), opcional por clínica** (30/07/2026) — reescreve o lembrete com tom natural, mantendo nome/data/hora/link validados literalmente; qualquer falha ou omissão cai no template fixo. Ver [README → Mensagens com IA](./README.md#mensagens-com-ia-opcional-por-clínica)
   - [ ] Templates editáveis por clínica (hoje o template *fixo* — usado quando a IA está desligada ou falha — é único e fica no código)
   - [ ] Template aprovado pela Meta — texto livre só funciona dentro da janela de 24h
   - [ ] Webhook de status de entrega (`DELIVERED`) e de resposta do paciente
   - [ ] Reenvio manual a partir da lista de falhas
   - [ ] Segundo lembrete (D-3) e escalonamento por risco (depende de `prediction`)
2. **Prontuário básico** — anamnese, evolução, anexos por paciente
3. **Horário de trabalho e bloqueio de agenda** — hoje aceitamos agendar 3h da manhã de domingo (ver README)
4. **Importador de pacientes via CSV** — sem isso, migrar de concorrente é inviável na prática

### Fase 2 — Diferencial

4. **`prediction`** — começar com regra simples (histórico de faltas, antecedência, procedimento, dia da semana), evoluir para modelo
   - O que nos separa: **ação por faixa de risco** — risco alto dispara confirmação mais cedo, mais insistente e libera a vaga para lista de espera antes
5. **Lista de espera** — preenche a lacuna quando o risco se concretiza
6. **Agendamento online** — página pública por subdomínio (o branding já existe)

### Fase 3 — Monetização e retenção

7. **`billing`** — Stripe, planos, cobrança por assento
8. **Dashboard financeiro** — faturamento, taxa de comparecimento, receita perdida por falta
9. **Comissão por profissional**
10. **Pacotes e fidelidade**

### Fora de escopo por ora

- **TISS/TUSS** — só faz sentido para dermatologia com convênio; alto custo de conformidade e nos tira do foco de estética/odonto particular
- **Apps nativos** — PWA resolve enquanto não houver escala
- **LGPD certificada** — precisa acontecer antes de vender, mas é processo jurídico + técnico, não módulo

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
| Predição sem dado suficiente para treinar | Começar com regra determinística; o seed já produz histórico de `NO_SHOW` |
| Custo de WhatsApp (Meta cobra por conversa) | Modelar franquia + excedente antes de lançar, não depois |
| Migração de clínica que já usa concorrente | Importador de pacientes via CSV na Fase 1 |
| Mercado fragmentado, entrada a partir de R$ 39 | Não competir por preço; vender confiabilidade de entrega |
| Tentação de usar API não oficial para baratear | **Decidido: Meta Cloud API oficial.** Banimento é permanente e sem recurso — perderíamos a agenda do cliente junto com o número |
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
