# Subagentes — como usar no Crivo

Guia prático de quando (e quando **não**) delegar trabalho a subagentes neste projeto.

---

## O que é um subagente

Um subagente é uma instância do Claude que roda **em contexto separado**, recebe uma tarefa, trabalha sozinha e devolve um relatório. Ele não enxerga a nossa conversa — começa do zero e precisa descobrir tudo de novo.

Essa é a característica que define quando vale a pena:

| | Trabalho direto | Subagente |
| --- | --- | --- |
| Contexto | já tem tudo | começa do zero |
| Custo | baixo | alto (re-descobre o projeto) |
| Paralelismo | um de cada vez | vários ao mesmo tempo |
| Ideal para | tarefas ligadas ao que estamos fazendo | exploração ampla e independente |

---

## A regra prática

> **Se eu já sei onde mexer, faço direto. Se preciso vasculhar o projeto inteiro para descobrir, vale delegar.**

Delegar tarefa pequena é mais lento que fazer: o subagente gasta várias chamadas só para reconstruir o contexto que eu já tenho.

### Vale a pena

- **Busca ampla** — "onde no código a gente valida tenant?" em um projeto grande
- **Trabalho paralelo e independente** — pesquisar 4 concorrentes ao mesmo tempo, cada um no seu agente
- **Auditoria** — revisar todos os módulos procurando um padrão (ex: query sem filtro de `tenantId`)
- **Tarefa longa e isolada** — que geraria muito ruído no nosso contexto principal

### Não vale a pena

- Corrigir um bug que já localizamos
- Criar um módulo seguindo o SKILLS.md (eu já tenho o padrão em contexto)
- Qualquer coisa que dependa de decisão sua no meio do caminho — o subagente não pode te perguntar
- Tarefas encadeadas, onde a segunda depende do resultado da primeira

---

## Como pedir

Basta dizer no pedido. Alguns exemplos que funcionam bem aqui:

```
"Use subagentes para pesquisar os 5 principais concorrentes e comparar preço e features"

"Manda um subagente auditar todos os módulos e listar queries sem filtro de tenantId"

"Usa um subagente pra investigar por que o teste X falha, enquanto seguimos no módulo Y"
```

E para o caso oposto — quando você quer que eu **não** delegue:

```
"Faz direto, sem subagente"
```

Por padrão eu **não** uso subagentes: só quando você pede, ou quando a tarefa é claramente do tipo "vasculhar o projeto inteiro".

---

## Tipos disponíveis

| Tipo | Serve para |
| --- | --- |
| `Explore` | Busca rápida e leitura de trechos. Bom para "onde está X". **Não** serve para revisão de código — lê recortes e perde contexto |
| `Plan` | Desenhar estratégia de implementação antes de codar |
| `general-purpose` | Tarefas de várias etapas, pesquisa aberta, uso de ferramentas |
| `claude-code-guide` | Dúvidas sobre o próprio Claude Code / SDK / API |

---

## O que dá errado (e como evitar)

**Instrução vaga.** O subagente não pode pedir esclarecimento. `"melhora o módulo de pacientes"` volta com qualquer coisa; `"adicione paginação em GET /patients seguindo o padrão do SKILLS.md e rode tsc"` volta com o que se pediu.

**Delegar decisão de produto.** Ele não conhece o negócio nem pode te consultar. Decisão de modelagem, preço, escopo — isso passa por você.

**Assumir que o relatório está certo.** Subagente erra e às vezes relata sucesso sem ter validado. Quando o resultado importa, eu confiro — especialmente typecheck, lint e comportamento real.

**Vários agentes no mesmo arquivo.** Rodando em paralelo, um sobrescreve o outro. Trabalho paralelo só em áreas separadas.

---

## Agentes especializados para este projeto

Dá para criar agentes sob medida em `.claude/agents/*.md` — cada arquivo vira um tipo reutilizável, com instruções e ferramentas próprias.

Três que fariam sentido aqui:

### `tenant-auditor`
Varre os módulos procurando vazamento entre clínicas: query sem `tenantId`, `findUnique` por ID sem filtro de tenant, rota sem `TenantContextGuard`. É a classe de bug mais cara do produto e a mais fácil de passar batido numa revisão manual.

### `module-scaffolder`
Cria a estrutura de um módulo novo seguindo o SKILLS.md — domain/application/infrastructure, repositório com token, DTOs, controller com guards. Trabalho repetitivo e bem especificado.

### `competitor-researcher`
Pesquisa um concorrente e devolve preço, features e posicionamento no formato da tabela do ROADMAP. Vários em paralelo cobrem o mercado rápido — foi assim que levantamos os dados que estão lá hoje.

> Nenhum está criado ainda. Se quiser, eu monto — vale começar pelo `tenant-auditor`, que é o de maior risco coberto.

---

## Onde isso já foi usado

A pesquisa de concorrentes do [ROADMAP.md](./ROADMAP.md) é o exemplo real: várias buscas independentes rodando em paralelo, cada uma trazendo preço e features de um sistema diferente. Feito em sequência, seria muito mais lento e encheria o contexto de conteúdo que só precisava virar uma linha de tabela.
