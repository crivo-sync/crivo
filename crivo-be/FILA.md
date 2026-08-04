# A fila de mensagens por dentro (BullMQ)

Documento de estudo: **como a fila funciona neste projeto** e por que ela
existe. Para o fluxo de produto (lembrete, confirmação, providers), ver
[README → Mensageria](./README.md#mensageria).

---

## Por que existe uma fila

Quando a recepção cria um agendamento, o `POST /appointments` precisa
responder rápido. Enviar o WhatsApp na mesma request criaria três problemas:

1. **Lentidão** — a tela ficaria travada esperando um serviço externo.
2. **Acoplamento a falha alheia** — se o WhatsApp estiver fora do ar, o
   agendamento (que não tem nada a ver com isso) falharia junto.
3. **Sem retry** — uma falha momentânea de rede perderia a mensagem para
   sempre, em silêncio.

A fila resolve os três: o agendamento é salvo e responde na hora, e o envio
vira um **job** processado em segundo plano, com retry automático.

E tem um quarto motivo, específico deste produto: o lembrete é **agendado
para o futuro** (D-1 por padrão). A fila sabe segurar um job por 23 horas e
executá-lo na hora certa — sem `setTimeout` perdido na memória do processo,
que sumiria no primeiro restart.

---

## As peças

| Peça | Onde | O que é |
| --- | --- | --- |
| **Redis** | container `crivo-redis` | Onde a fila mora de fato. BullMQ é uma biblioteca; o estado (jobs, tentativas, agendamentos) fica todo no Redis |
| **Queue** | `messaging.queue.ts` | O "produtor" — quem enfileira. Usado por `ScheduleAppointmentReminderUseCase` e `ConfirmByTokenUseCase` |
| **Worker** | `message.processor.ts` | O "consumidor" — pega job da fila e executa. É o `MessageProcessor` |
| **Job** | — | Uma unidade de trabalho. Aqui: "envie a mensagem `X`" |
| **Bull Board** | `/admin/queues` | Painel web para inspecionar tudo acima |

Ponto que costuma confundir: **produtor e consumidor rodam no mesmo processo
Node** neste projeto. Não precisam — poderiam ser máquinas diferentes, e é
assim que se escala. O que os conecta é o Redis, não o processo.

---

## O ciclo de vida de um job

```
             enfileirado com delay?
                    │
        ┌───────────┴───────────┐
        │ sim                   │ não
        ▼                       ▼
    ┌────────┐              ┌─────────┐
    │DELAYED │──── venceu ─>│ WAITING │
    └────────┘   o prazo    └─────────┘
                                 │ worker pegou
                                 ▼
                            ┌────────┐
                            │ ACTIVE │
                            └────────┘
                                 │
                 ┌───────────────┴──────────────┐
                 │ process() retornou            │ process() lançou erro
                 ▼                               ▼
           ┌───────────┐                  ainda tem tentativa?
           │ COMPLETED │                   │              │
           └───────────┘              sim  │              │ não
                                           ▼              ▼
                                      ┌────────┐    ┌────────┐
                                      │DELAYED │    │ FAILED │
                                      │(backoff)    └────────┘
                                      └────────┘
```

São exatamente as abas que aparecem no Bull Board. `PRIORITIZED`,
`WAITING CHILDREN` e `PAUSED` também aparecem lá, mas este projeto não usa
prioridade, jobs-filho nem pausa — por isso vivem sempre vazias.

---

## As opções de job deste projeto

```ts
// messaging.queue.ts
export const SEND_JOB_OPTIONS = {
  attempts: 4,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: 1_000,
  removeOnFail: false,
};
```

**`attempts: 4`** — tenta 4 vezes no total (1 original + 3 retries) antes de
desistir.

**`backoff: exponential, delay: 30s`** — o intervalo dobra a cada falha:

| Tentativa | Espera antes dela | Acumulado |
| --- | --- | --- |
| 1ª | — (imediata) | 0 |
| 2ª | 30s | 30s |
| 3ª | 60s | 1min30 |
| 4ª | 120s | 3min30 |

Ou seja: da primeira falha até a mensagem virar `FAILED` passam ~3min30.
A escolha do exponencial é intencional: uma instabilidade de 10 segundos é
resolvida na 2ª tentativa, e um serviço realmente fora do ar não é
martelado a cada segundo.

**`removeOnComplete: 1_000`** — guarda os últimos mil jobs bem-sucedidos e
descarta os mais antigos. Sem isso o Redis cresceria para sempre.

**`removeOnFail: false`** — jobs que falharam **nunca** são apagados
automaticamente. É deliberado e é o coração do produto: falha de envio tem
que ficar visível até alguém agir. Vale para o Bull Board e é o mesmo
princípio de `GET /messages/failed`.

---

## Como o lembrete é agendado para o futuro

```ts
// schedule-appointment-reminder.use-case.ts
const sendAt = new Date(appointment.startsAt.getTime() - hoursBefore * 3_600_000);
const delay = Math.max(0, sendAt.getTime() - Date.now());

await this.queue.add('send', { messageId: message.id }, { ...SEND_JOB_OPTIONS, delay });
```

O `delay` é o que coloca o job em `DELAYED`. Dois detalhes:

- **`Math.max(0, …)`** — se a consulta é daqui a 2 horas e a antecedência é
  24h, o cálculo dá negativo. Sem o `max`, seria um delay inválido; com ele,
  vira `0` e o lembrete sai na hora. É por isso que, para testar, basta criar
  um agendamento para daqui a pouco: o lembrete dispara quase imediatamente.
- **O job carrega só o `messageId`**, não o texto. O conteúdo fica no
  Postgres, na tabela `messages`. Assim a fila guarda o mínimo, e o worker lê
  o estado atual na hora de enviar — não uma cópia congelada de 23h atrás.

---

## Por que o worker devolve algo

```ts
async process(job: Job<SendMessageJob>): Promise<SendMessageJobResult> {
  …
  return { outcome: 'sent', provider, toPhone, type, providerMessageId };
}
```

Esse retorno vira o **`returnValue`** do job no Bull Board. Nenhum código o
consome — existe só para o painel mostrar *o que aconteceu* em vez de
`null`. Antes dessa mudança (04/08/2026) o método era `Promise<void>` e o
board exibia `returnValue: null` em todo job, que é o comportamento normal
de um worker que não retorna nada.

---

## Duas proteções no worker que valem estudar

### 1. Idempotência

```ts
if (message.sentAt) {
  return { outcome: 'skipped', reason: 'já enviada' };
}
```

Um job pode ser reprocessado — retry manual pelo board, worker que morreu no
meio, etc. Sem essa guarda, o paciente receberia a mesma mensagem duas
vezes. A regra vale para qualquer fila: **assuma que todo job pode rodar
mais de uma vez** e torne a operação segura sob repetição.

### 2. `FAILED` só na última tentativa

```ts
@OnWorkerEvent('failed')
async onFailed(job, error) {
  const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isLastAttempt) return;          // ainda vai retentar
  await this.messageRepository.markFailed(job.data.messageId, error.message);
}
```

O evento `failed` do BullMQ dispara em **toda** tentativa frustrada, não só
na última. Sem esse `if`, a mensagem apareceria como `FAILED` na tela da
recepção já na primeira falha — e a recepção ligaria para um paciente que
ia receber a mensagem 30 segundos depois. Por isso `lastError` também só é
gravado no fim.

---

## Onde acompanhar o que está acontecendo

Três lugares, com públicos diferentes:

| Onde | Para quem | Mostra |
| --- | --- | --- |
| **Tela Mensagens** (`crivo-fe`) | recepção/admin da clínica | Histórico e falhas em linguagem de negócio. É a fonte oficial do dia a dia |
| **Bull Board** (`/admin/queues`) | desenvolvedor | Estado interno da fila: jobs esperando, ativos, agendados, tentativas, payload e erro cru |
| **Log do backend** | desenvolvedor | O que está acontecendo *agora*, linha a linha |

Para ver os envios em tempo real durante o desenvolvimento, o log é o mais
direto — rodando `npm run start:dev` no terminal, cada envio aparece ali:

```
[ScheduleAppointmentReminderUseCase] Lembrete agendado para 2026-08-05T…
[EvolutionMessageProvider]           [EVOLUTION] enviada para 11952861726
[MessageProcessor]                   Envio falhou (tentativa 2), vai retentar: …
```

O Bull Board recarrega sozinho a cada 3s (`pollingInterval.forceInterval`
no `MessagingModule`) — antes disso ele só atualizava com F5, que foi a
razão de "não vi em tempo real" na primeira vez que abrimos.

Um detalhe importante do board: jobs concluídos **saem da aba `LATEST`**
conforme novos chegam, e a fila fica visualmente "parada" quando não há
nada acontecendo. Fila vazia é o estado saudável — significa que tudo já foi
processado, não que quebrou.

---

## Como testar o caminho de erro sem quebrar nada

Com `MESSAGING_PROVIDER=fake`, um telefone terminado em **`0000`** falha de
propósito:

```ts
// fake-message.provider.ts
if (input.toPhone.endsWith('0000')) {
  return Promise.reject(new Error('Falha simulada de envio (…)'));
}
```

Cadastre um paciente com `11999990000`, crie um agendamento para daqui a
pouco, e acompanhe: `attempts` sobe de 1 a 4 ao longo de ~3min30, a mensagem
vira `FAILED`, aparece em `GET /messages/failed` e no card do Painel. É o
fluxo de falha inteiro, sem depender de WhatsApp nenhum.

---

## Glossário rápido

| Termo | Significa |
| --- | --- |
| **Job** | Uma tarefa na fila. Aqui, "enviar a mensagem X" |
| **Producer** | Quem adiciona job (`queue.add`) |
| **Worker / Consumer** | Quem executa job (`MessageProcessor`) |
| **Backoff** | Quanto esperar antes de tentar de novo |
| **Idempotência** | Rodar duas vezes tem o mesmo efeito que rodar uma |
| **DLQ** (dead-letter queue) | Conceito de fila para "jobs que desistimos". Aqui o equivalente é `removeOnFail: false` + a lista de falhas na tela |
