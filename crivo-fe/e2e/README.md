# Testes E2E — painel do Crivo

Clicam na tela de verdade, contra o **backend real**. Não há mock: os dois
bugs que motivaram esta suíte nasceram na costura entre frontend e backend, e
mock nenhum teria pego.

## Rodar

Precisa de três coisas no ar:

```bash
# 1. banco e fila
cd crivo-be && docker compose up -d

# 2. backend na 3333
cd crivo-be && npm run start:dev

# 3. os testes (sobem o Next sozinhos, ou reusam o que já estiver na 3000)
cd crivo-fe && npm run e2e
```

Outros modos:

| Comando | Para quê |
| --- | --- |
| `npm run e2e` | roda tudo |
| `npm run e2e:ui` | modo interativo, para investigar uma falha |
| `npm run e2e:report` | abre o relatório da última execução |
| `npx playwright test e2e/agendamento.spec.ts` | um arquivo só |

## O que cobre

| Arquivo | O que garante |
| --- | --- |
| `smoke.spec.ts` | Login, senha errada, e as quatro abas da Agenda abrem |
| `permissoes.spec.ts` | O que a recepção **não** pode — inclusive digitando a URL na mão |
| `agendamento.spec.ts` | A cascata do formulário, os horários com início→fim, e criar de ponta a ponta |
| `telas-novas.spec.ts` | Risco de falta, lista de espera (com a trava de duplicata) e caixa de entrada |

## Decisões que valem saber antes de mexer

**Roda em série (`workers: 1`).** Os testes compartilham o mesmo banco; dois
workers criando agendamento disputariam o mesmo horário e a suíte ficaria
instável sem que houvesse bug nenhum.

**Cada teste cria os próprios dados** quando precisa gravar, com nome único
(`E2E Paciente <timestamp>`). Reusar registros do seed fazia a segunda
execução esbarrar em travas de duplicata — falha por estado sujo, não por
regressão.

**Seletores por papel e rótulo**, não por classe CSS. Classe do MUI muda a
cada atualização; "o botão chamado Agendar" é o que a recepção enxerga.

**Escopo no dialog.** A tela por trás tem os mesmos rótulos nos filtros
("Paciente", "Profissional"); sem escopar, o seletor casa com dois elementos e
o teste falha por ambiguidade.

**Campo de data do MUI expõe três elementos com o mesmo rótulo** (grupo,
spinbuttons e um input escondido). Use `getByRole("spinbutton", { name: "Dia" })` —
é o único que carrega `aria-disabled`.

## Limitações conhecidas

- **Um browser só** (Chromium). Safari e Firefox não são exercitados.
- **Não testa o envio real de WhatsApp** — depende da Evolution conectada. A
  suíte verifica que a mensagem entra na fila, não que ela chega ao celular.
- **Sem limpeza automática**: os pacientes `E2E …` ficam no banco de
  desenvolvimento. Para zerar: `cd crivo-be && npm run prisma:seed:clean && npm run prisma:seed`.
