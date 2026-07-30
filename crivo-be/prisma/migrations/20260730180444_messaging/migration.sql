-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMATION_RECEIPT', 'MANUAL');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "confirmation_token" TEXT;

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP',
    "type" "MessageType" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "to_phone" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "provider" TEXT,
    "provider_message_id" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "scheduled_for" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_tenant_id_status_idx" ON "messages"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "messages_tenant_id_createdAt_idx" ON "messages"("tenant_id", "createdAt");

-- CreateIndex
CREATE INDEX "messages_appointment_id_idx" ON "messages"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_confirmation_token_key" ON "appointments"("confirmation_token");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
