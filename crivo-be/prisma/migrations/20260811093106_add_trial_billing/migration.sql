-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
ADD COLUMN     "trial_ends_at" TIMESTAMP(3);

-- Backfill: tenants existentes (criados antes do trial existir) ganham
-- 14 dias de trial a partir de agora, em vez de nascerem já expirados.
UPDATE "tenants" SET "trial_ends_at" = NOW() + INTERVAL '14 days' WHERE "trial_ends_at" IS NULL;

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "trial_ends_at" SET NOT NULL;
