-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "max_messages_per_month" INTEGER;

-- Franquia mensal por plano. É o único custo variável por clínica: a Meta
-- cobra por conversa iniciada pela empresa (~R$0,04–0,08 em utility no
-- Brasil). Sem teto, uma clínica de R$79 pode gerar custo ilimitado.
--
-- Volume de referência medido no seed: ~19 mensagens/15 dias para uma
-- agenda com 30 consultas. As faixas abaixo dão folga sobre isso.
UPDATE "plans" SET "max_messages_per_month" = 500  WHERE "key" = 'SOLO';
UPDATE "plans" SET "max_messages_per_month" = 1500 WHERE "key" = 'BASICO';
UPDATE "plans" SET "max_messages_per_month" = 5000 WHERE "key" = 'INTERMEDIARIO';
-- Avançado sem teto: é o plano de maior ticket, e um limite ali viraria
-- atrito de venda no cliente que mais paga.
