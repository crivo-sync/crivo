import type { Metadata } from "next";

import { PatientDetail } from "@/features/patients/components/PatientDetail";

export const metadata: Metadata = {
  title: "Paciente — Crivo",
};

type PatientPageProps = {
  params: Promise<{ id: string }>;
};

const PacienteDetalhePage = async ({ params }: PatientPageProps) => {
  const { id } = await params;

  return <PatientDetail patientId={id} />;
};

export default PacienteDetalhePage;
