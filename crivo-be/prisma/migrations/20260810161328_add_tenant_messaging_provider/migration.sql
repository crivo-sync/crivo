-- CreateEnum
CREATE TYPE "MessagingProvider" AS ENUM ('FAKE', 'EVOLUTION', 'META');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "messaging_provider" "MessagingProvider";
