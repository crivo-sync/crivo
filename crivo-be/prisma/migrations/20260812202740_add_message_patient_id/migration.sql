-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "patient_id" TEXT;

-- Backfill: mensagens existentes já têm o paciente via appointment.
-- Sem isso, todo o histórico automático (lembretes, avisos) apareceria como
-- "sem paciente" na conversa até o próximo envio.
UPDATE "messages" m
SET "patient_id" = a."patient_id"
FROM "appointments" a
WHERE m."appointment_id" = a."id"
  AND m."patient_id" IS NULL;

-- CreateIndex
CREATE INDEX "messages_patient_id_idx" ON "messages"("patient_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
