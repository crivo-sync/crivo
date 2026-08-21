-- Impede a RESERVA DUPLA do mesmo horário: a checagem de conflito vive em
-- memória (`findOverlapping` → `create`), então duas requisições simultâneas
-- podiam passar as duas e gravar duas consultas no mesmo profissional+horário
-- (condição de corrida na página pública e no painel).
--
-- Parcial de propósito: só os status que ocupam a agenda participam do
-- índice. CANCELLED/NO_SHOW liberam o horário — um novo agendamento no mesmo
-- slot precisa voltar a ser permitido.
--
-- Não cobre sobreposição com horários de início DIFERENTES (ex.: 10:00 e
-- 10:30 de 60min); para isso seria preciso uma exclusion constraint, que o
-- Prisma não gera. Este índice elimina o caso realista (duas pessoas clicando
-- no MESMO slot).
CREATE UNIQUE INDEX "appointments_blocking_slot_unique"
ON "appointments" ("tenant_id", "professional_id", "starts_at")
WHERE "status" IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED');
