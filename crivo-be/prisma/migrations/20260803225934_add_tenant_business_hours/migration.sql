-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "business_days" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
ADD COLUMN     "business_hours_end" INTEGER NOT NULL DEFAULT 1080,
ADD COLUMN     "business_hours_start" INTEGER NOT NULL DEFAULT 480;

