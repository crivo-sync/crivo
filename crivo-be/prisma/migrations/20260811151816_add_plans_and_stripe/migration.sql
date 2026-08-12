-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "plan_id" TEXT,
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT;

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_in_cents" INTEGER NOT NULL,
    "max_professionals" INTEGER,
    "has_prediction" BOOLEAN NOT NULL DEFAULT false,
    "has_ai_messages" BOOLEAN NOT NULL DEFAULT false,
    "stripe_product_id" TEXT NOT NULL,
    "stripe_price_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_key_key" ON "plans"("key");

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripe_product_id_key" ON "plans"("stripe_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripe_price_id_key" ON "plans"("stripe_price_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripe_customer_id_key" ON "tenants"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripe_subscription_id_key" ON "tenants"("stripe_subscription_id");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed dos 3 planos já criados no Stripe Dashboard (sandbox de teste).
-- Preços são PLACEHOLDER — o dono do produto ainda vai validar os valores
-- finais; `stripe_price_id` fica NULL até um Price ativo ser configurado
-- para cada produto (checkout exige um price, não só o product).
INSERT INTO "plans" ("id", "key", "name", "price_in_cents", "max_professionals", "has_prediction", "has_ai_messages", "stripe_product_id", "is_active", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'BASICO', 'Básico', 14900, 2, false, false, 'prod_V3QEEFHXf1InQt', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'INTERMEDIARIO', 'Intermediário', 28900, NULL, true, true, 'prod_V3QFWHwYZvozeV', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AVANCADO', 'Avançado', 39900, NULL, true, true, 'prod_V3QFzoziEp5xOX', true, NOW(), NOW());
