-- CreateTable
CREATE TABLE "inbound_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP',
    "from_phone" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "provider" TEXT,
    "provider_message_id" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "read_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inbound_messages_tenant_id_createdAt_idx" ON "inbound_messages"("tenant_id", "createdAt");

-- CreateIndex
CREATE INDEX "inbound_messages_tenant_id_read_at_idx" ON "inbound_messages"("tenant_id", "read_at");

-- CreateIndex
CREATE INDEX "inbound_messages_patient_id_idx" ON "inbound_messages"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_messages_tenant_id_provider_message_id_key" ON "inbound_messages"("tenant_id", "provider_message_id");

-- AddForeignKey
ALTER TABLE "inbound_messages" ADD CONSTRAINT "inbound_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbound_messages" ADD CONSTRAINT "inbound_messages_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
