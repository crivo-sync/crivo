# Crivo — Manual da recepção

Como operar a agenda no dia a dia. Escrito para quem atende o telefone e
marca consulta, não para quem programa.

> Este documento é feito para ser impresso ou enviado à clínica.

---

## Sumário

1. [Entrando no sistema](#1-entrando-no-sistema)
2. [O Painel: o que olhar quando chega](#2-o-painel-o-que-olhar-quando-chega)
3. [Marcar uma consulta](#3-marcar-uma-consulta)
4. [Por que o horário que eu quero não aparece?](#4-por-que-o-horário-que-eu-quero-não-aparece)
5. [Os status da agenda](#5-os-status-da-agenda)
6. [Remarcar e cancelar](#6-remarcar-e-cancelar)
7. [As mensagens de WhatsApp](#7-as-mensagens-de-whatsapp)
8. [Quando uma mensagem falha](#8-quando-uma-mensagem-falha)
9. [O que só o administrador faz](#9-o-que-só-o-administrador-faz)
10. [Perguntas rápidas](#10-perguntas-rápidas)

---

## 1. Entrando no sistema

Acesse o endereço da clínica e entre com o seu e-mail e senha.

No menu da esquerda você tem:

| Menu | Para que serve |
| ---- | -------------- |
| **Painel** | Resumo do dia — é a primeira tela |
| **Agenda** | Onde você marca, remarca e cancela |
| **Pacientes** | Cadastro de quem é atendido |
| **Profissionais** | Quem atende e em que horários |
| **Procedimentos** | O catálogo de serviços, com duração e preço |
| **Mensagens** | O que o sistema enviou por WhatsApp |
| **Configurações** | Dados da clínica |

---

## 2. O Painel: o que olhar quando chega

Três coisas, nesta ordem:

**A tarja vermelha.** Se aparecer *"X mensagens falharam — ligue para os
pacientes"*, esses pacientes **não receberam** o lembrete. Eles não sabem da
consulta. Isso é o item mais urgente do dia — veja a
[seção 8](#8-quando-uma-mensagem-falha).

**Agendamentos de hoje.** A lista mostra hora, paciente, procedimento,
profissional, valor e status. A cor da barra à esquerda repete a cor do
status, então dá para bater o olho:

| Cor | Status |
| --- | ------ |
| Cinza | Agendado (ainda não confirmou) |
| Azul | Confirmado |
| Verde | Concluído |
| Laranja | Faltou |
| Vermelho | Cancelado |

Use o filtro **Status** para ver só quem ainda não confirmou — são esses que
podem precisar de uma ligação.

**A confirmar (próximas 48h).** Quem tem consulta chegando e ainda não
respondeu ao WhatsApp.

> A tela se atualiza sozinha a cada poucos segundos. Quando um paciente
> confirma pelo celular, o status muda ali na sua frente — **não precisa
> apertar F5**.

---

## 3. Marcar uma consulta

Menu **Agenda** → botão **+ Novo agendamento**. Preencha nesta ordem, porque
cada campo depende do anterior:

1. **Paciente** — comece a digitar o nome. Se não existir, cadastre antes em
   *Pacientes → Novo paciente*.
2. **Profissional** — quem vai atender.
3. **Procedimento** — a lista mostra **só o que aquele profissional faz**.
   Se o procedimento que você procura não aparece, é porque ele não realiza
   esse serviço: escolha outro profissional.
   Abaixo do campo aparece a duração e o valor (ex.: *30 min · R$ 150,00*).
4. **Dia** — o calendário já bloqueia os dias em que a clínica não abre.
5. **Horário** — aparecem os horários livres. Toque em um para escolher.
6. **Observações** (opcional) — recado interno, o paciente não vê.

Clique em **Agendar**. Pronto: o resto acontece sozinho (veja a
[seção 7](#7-as-mensagens-de-whatsapp)).

### Sobre os horários que aparecem

Os horários vêm de 15 em 15 minutos, mas **isso não é a duração da
consulta**. É só de quanto em quanto tempo um atendimento pode começar.

A tela avisa isso: *"O atendimento ocupa 1 h 30 min. Os horários abaixo são
só as opções de começo — a agenda fica reservada até o fim."*

Ao escolher, ela mostra o intervalo real reservado, por exemplo
**"Reservado das 10:00 às 11:30"**.

### Consultar antes de marcar: o Quadro

Em **Agenda**, clique na aba **Quadro** (ao lado de *Lista*) para ver os
agendamentos de todos os profissionais de uma vez, cada um com uma cor. É o
jeito mais rápido de responder "quem tem vaga agora?" sem ficar abrindo o
formulário e trocando profissional um por um.

- O painel à esquerda lista os profissionais — desmarque quem não interessa
  para sobrar só quem você quer comparar.
- Alterne **Dia**/**Semana** no topo.
- É só para **consultar**: marcar continua pelo botão *Novo agendamento*.

#### ⚠️ Espaço vazio nem sempre é horário livre

Deixe **apenas um profissional marcado** em *Recursos*. Aí o Quadro pinta de
**cinza** todas as horas em que essa pessoa **não atende** — fora da grade
dela, no almoço, em férias, ou com a clínica fechada.

Isso importa: a Dra. Helena atende quarta só das **08:00 às 12:00**. Sem as
faixas cinza, a quarta à tarde parece livre no Quadro, e você só descobre
que não é ao tentar marcar.

Com mais de um profissional marcado as faixas somem — numa agenda
compartilhada não dá para saber de quem seria o cinza. Nesse caso, use a
legenda logo acima do calendário, que lista a grade de cada um.

---

## 4. Por que o horário que eu quero não aparece?

Esta é a dúvida mais comum. O sistema só oferece horário em que a consulta
**cabe inteira** e o profissional **realmente atende**. Confira nesta ordem:

| Motivo | Como perceber | O que fazer |
| ------ | ------------- | ----------- |
| **A clínica está fechada** naquele dia | O dia aparece apagado no calendário | Escolher outro dia |
| **A consulta não cabe antes do fechamento** | Some o fim da tarde. Um procedimento de 2 h não aparece às 17h se fecha 18h | Horário mais cedo, ou procedimento mais curto |
| **Hoje já passou do fechamento** | O dia de hoje fica apagado, com o aviso *"A clínica já fechou hoje"* | Marcar a partir de amanhã |
| **O profissional não atende naquele dia/turno** | Some o turno inteiro (ex.: nenhuma opção à tarde) | Ver o **Quadro** (acima) para comparar todos de uma vez, ou confirmar a grade com o administrador |
| **O profissional está de férias/ausente** | Somem os dias inteiros | Outro profissional, ou outra data |
| **Já tem paciente marcado** | Some só aquele intervalo | Horário vizinho |

### Como descobrir o horário de um profissional

O **Quadro** (seção anterior) é o jeito mais rápido: veja a semana de um
profissional e repare em quais dias/horas os agendamentos dele aparecem —
onde nunca aparece nada é porque ele não atende naquele turno.

A grade de horários em si (e os bloqueios de férias) é cadastrada pelo
**administrador** — hoje essa tela de edição não aparece para a recepção. Se
restar dúvida sobre um turno específico, **pergunte ao administrador**.

> Se um profissional **não tem grade cadastrada**, ele pode ser marcado em
> todo o horário de funcionamento da clínica — por isso alguns profissionais
> aparecem com muito mais opções que outros.

---

## 5. Os status da agenda

| Status | O que significa |
| ------ | --------------- |
| **Agendado** | Marcado, mas o paciente ainda não confirmou |
| **Confirmado** | O paciente confirmou (pelo WhatsApp ou você marcou) |
| **Concluído** | O atendimento aconteceu |
| **Cancelado** | Foi desmarcado com aviso |
| **Faltou** | O paciente **não avisou e não veio** |

### ⚠️ Cancelado e Faltou não são a mesma coisa

Essa diferença é importante e vale a pena registrar direito:

- **Cancelado** = o paciente avisou. Dá para tentar preencher o horário.
- **Faltou** = ninguém avisou, o horário foi perdido.

O sistema usa esse histórico para, no futuro, identificar quem tem tendência
a faltar e reforçar o aviso para essas pessoas. Se você marcar tudo como
"Cancelado" para ser gentil, essa informação se perde.

**Regra prática:** avisou, mesmo que em cima da hora → *Cancelado*. Não
apareceu e não deu notícia → *Faltou*.

---

## 6. Remarcar e cancelar

Na **Agenda**, clique nos três pontinhos da linha:

- **Reagendar** — escolhe novo dia e horário. Serve também para trocar o
  profissional. O lembrete antigo é descartado, então o paciente **nunca
  recebe aviso com a data velha**. Se a nova data tiver alguma folga, ele
  recebe na hora um WhatsApp dizendo que a consulta foi **remarcada**; se
  for para logo, recebe só o lembrete.
- **Confirmar** — quando o paciente confirma por telefone em vez do link.
- **Concluir** — depois do atendimento.
- **Marcar falta** — veja a diferença na [seção 5](#5-os-status-da-agenda).
- **Cancelar** — pede o motivo. Escreva algo útil ("paciente remarcou",
  "profissional adoeceu"): isso fica no histórico.

Consulta já **concluída, cancelada ou com falta** não pode ser reagendada —
nesse caso, marque uma nova.

---

## 7. As mensagens de WhatsApp

Você **não precisa enviar nada manualmente**. Ao marcar a consulta, o
sistema cuida:

```
Consulta marcada
      │
      ├─ Marcou com alguns dias de antecedência?
      │  └─ Sai NA HORA: "Sua consulta foi marcada… já pode confirmar"
      │
      ├─ Um dia antes: sai o LEMBRETE
      │
      └─ Paciente toca no link e confirma
         └─ Status vira "Confirmado" na sua tela, sozinho
            e ele recebe "Presença confirmada ✅"
```

Se a consulta for para daqui a poucas horas, sai só o lembrete — não faz
sentido mandar duas mensagens quase iguais seguidas.

Em **Mensagens → Histórico** você vê tudo que saiu: quando, para quem, o
texto e o status (*Enviada*, *Pendente*, *Falhou*).

---

## 8. Quando uma mensagem falha

O sistema **tenta 4 vezes** ao longo de uns 3 minutos e meio. Só depois
disso marca como *Falhou*.

Quando isso acontece, o paciente **não foi avisado**. Ele pode simplesmente
não aparecer — não porque quis faltar, mas porque não soube.

**O que fazer:**

1. Vá em **Mensagens** → aba **Falhas — ligar para o paciente** (ou clique
   direto na tarja vermelha do Painel).
2. A lista mostra o nome, o telefone e **quando falhou**.
3. **Ligue para essas pessoas.** É o único caminho.
4. Se confirmar por telefone, volte na Agenda e marque **Confirmar**.

> Motivos comuns: número errado no cadastro, paciente sem WhatsApp, ou
> instabilidade momentânea. Se o mesmo paciente falha sempre, confira o
> telefone no cadastro dele.

---

## 9. O que só o administrador faz

Você consegue **ver**, mas não alterar:

- Cadastrar, editar ou remover **profissionais**
- Cadastrar, editar ou remover **procedimentos** (duração e preço)
- Alterar **horários e bloqueios** dos profissionais
- **Importar pacientes de uma planilha** (botão *Importar CSV*) — normalmente
  feito uma vez, na implantação
- Mudar as **configurações da clínica** (horário de funcionamento, dias,
  logo, cores)
- Criar **usuários** do sistema — este menu nem aparece para você

E há uma coisa que você **não vê de forma alguma**: o **prontuário** do
paciente (ficha de saúde e evolução clínica). Ao abrir um paciente, você vê
a aba *Dados*; as abas clínicas aparecem apenas para o profissional e o
administrador.

Isso não é falta de confiança — é exigência da LGPD. Dado de saúde
(alergia, medicação, diagnóstico) é classificado como **dado sensível** e só
pode ser acessado por quem tem necessidade clínica.

---

## 10. Perguntas rápidas

**Marquei e o paciente diz que não recebeu nada.**
Confira em *Mensagens → Histórico* se saiu. Se estiver *Pendente*, o
lembrete ainda vai sair (ele sai um dia antes). Se estiver *Falhou*, ligue.

**O paciente confirmou por telefone. Preciso fazer algo?**
Sim: Agenda → três pontinhos → **Confirmar**. Assim o histórico fica certo.

**Preciso marcar duas pessoas no mesmo horário com o mesmo profissional.**
O sistema não deixa, de propósito — é o que evita a agenda dupla. Se for
encaixe real, fale com o administrador.

**Marquei no paciente errado.**
Cancele (com o motivo) e marque de novo no paciente certo. Não existe
"trocar o paciente" de um agendamento.

**O valor apareceu diferente do que combinei.**
O valor vem do procedimento e fica **congelado** no momento em que você
marca. Se a tabela mudar depois, o agendamento antigo mantém o valor antigo
— isso é proposital, para o histórico financeiro não mudar sozinho.

**Temos a lista de pacientes numa planilha. Preciso digitar tudo?**
Não. O administrador importa o arquivo de uma vez em *Pacientes → Importar
CSV*. Não precisa arrumar a planilha antes: acentos, telefone com parêntese e
CPF com ponto são entendidos, e o sistema mostra uma prévia para conferir
antes de gravar. Pacientes que já existem são ignorados, então importar duas
vezes por engano não duplica ninguém.

**A tela travou / não atualiza.**
Ela se atualiza sozinha a cada poucos segundos. Se mesmo assim parecer
parada, recarregue a página (F5). Persistindo, chame o suporte.
