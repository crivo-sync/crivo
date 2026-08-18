-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "stripe_extra_professional_price_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripe_extra_professional_price_id_key" ON "plans"("stripe_extra_professional_price_id");
