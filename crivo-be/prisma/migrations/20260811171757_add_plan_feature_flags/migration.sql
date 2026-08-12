-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "has_dashboard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_medical_records" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_waitlist" BOOLEAN NOT NULL DEFAULT false;

-- Distribui os módulos que o backend já entregava mas nenhum plano vendia.
-- Antes desta migration, Intermediário e Avançado eram idênticos: mesmos
-- limites, mesmas features, R$110/mês de diferença por nada.
UPDATE "plans" SET "has_waitlist" = true, "has_dashboard" = true
WHERE "key" IN ('INTERMEDIARIO', 'AVANCADO');

UPDATE "plans" SET "has_medical_records" = true
WHERE "key" = 'AVANCADO';
