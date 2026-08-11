-- CreateEnum
CREATE TYPE "AppointmentOrigin" AS ENUM ('STAFF', 'ONLINE');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "origin" "AppointmentOrigin" NOT NULL DEFAULT 'STAFF';
