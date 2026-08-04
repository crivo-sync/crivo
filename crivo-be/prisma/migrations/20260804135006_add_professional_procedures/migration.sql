-- CreateTable
CREATE TABLE "_ProfessionalProcedures" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfessionalProcedures_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProfessionalProcedures_B_index" ON "_ProfessionalProcedures"("B");

-- AddForeignKey
ALTER TABLE "_ProfessionalProcedures" ADD CONSTRAINT "_ProfessionalProcedures_A_fkey" FOREIGN KEY ("A") REFERENCES "procedures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfessionalProcedures" ADD CONSTRAINT "_ProfessionalProcedures_B_fkey" FOREIGN KEY ("B") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

