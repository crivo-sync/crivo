-- CreateEnum
CREATE TYPE "ClinicalPhotoKind" AS ENUM ('BEFORE', 'AFTER');

-- CreateTable
CREATE TABLE "clinical_photos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "kind" "ClinicalPhotoKind" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "caption" TEXT,
    "uploaded_by_user_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinical_photos_tenant_id_patient_id_createdAt_idx" ON "clinical_photos"("tenant_id", "patient_id", "createdAt");

-- CreateIndex
CREATE INDEX "clinical_photos_appointment_id_idx" ON "clinical_photos"("appointment_id");

-- AddForeignKey
ALTER TABLE "clinical_photos" ADD CONSTRAINT "clinical_photos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_photos" ADD CONSTRAINT "clinical_photos_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_photos" ADD CONSTRAINT "clinical_photos_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_photos" ADD CONSTRAINT "clinical_photos_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

