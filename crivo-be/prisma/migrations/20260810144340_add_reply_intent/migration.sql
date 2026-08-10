-- CreateEnum
CREATE TYPE "ReplyIntent" AS ENUM ('CONFIRM', 'CANCEL', 'UNKNOWN');

-- AlterTable
ALTER TABLE "inbound_messages" ADD COLUMN     "appointment_id" TEXT,
ADD COLUMN     "intent" "ReplyIntent" NOT NULL DEFAULT 'UNKNOWN';

-- AddForeignKey
ALTER TABLE "inbound_messages" ADD CONSTRAINT "inbound_messages_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
