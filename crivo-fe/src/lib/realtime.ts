/**
 * De quanto em quanto tempo as telas que mostram estado "vivo" se
 * reconsultam sozinhas.
 *
 * Existe porque o status muda **fora do painel**: o paciente confirma pelo
 * link do WhatsApp e o agendamento vira `CONFIRMED` sem ninguém tocar na
 * tela. Sem isso a recepção só descobre dando F5.
 *
 * **Isto é polling, não WebSocket.** Cada aba aberta refaz a consulta neste
 * intervalo. 8s é o piso confortável: a mudança aparece em ~8s no pior caso
 * e ainda são só ~7 requisições por minuto por aba.
 *
 * Para ficar instantâneo de verdade não adianta baixar mais esse número —
 * o custo cresce linear e a percepção quase não muda. O caminho é o
 * servidor avisar (SSE ou WebSocket), que troca "perguntar sempre" por
 * "ser avisado quando muda".
 */
export const LIVE_REFETCH_INTERVAL_MS = 8_000;
