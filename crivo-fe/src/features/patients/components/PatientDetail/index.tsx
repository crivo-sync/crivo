"use client";

import { useState } from "react";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { ErrorServer } from "@/components/ui/error-server";
import { useIsClinical } from "@/components/providers/session-provider";
import { formatPhone } from "@/lib/br-masks";
import { AnamnesisForm } from "@/features/medical-records/components/AnamnesisForm";
import { ClinicalNotes } from "@/features/medical-records/components/ClinicalNotes";
import { PatientConversation } from "@/features/messages/components/PatientConversation";
import { usePatient } from "../../hooks/use-patient";

type TabValue = "data" | "conversation" | "anamnesis" | "notes";

export const PatientDetail = ({ patientId }: { patientId: string }) => {
  const [tab, setTab] = useState<TabValue>("data");
  const { patient, isLoading, error, refetch } = usePatient(patientId);

  // A recepção não vê prontuário. Esconder a aba é conveniência: a
  // autoridade é o `@Roles` do crivo-be, que devolve 403 de qualquer forma.
  const isClinical = useIsClinical();

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          component={Link}
          href="/painel/pacientes"
          startIcon={<ArrowBackIcon />}
          size="small"
          color="inherit"
          sx={{ mb: 1 }}
        >
          Pacientes
        </Button>

        {isLoading || !patient ? (
          <Skeleton variant="text" width={260} height={32} />
        ) : (
          <>
            <Typography variant="h6">{patient.name}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {formatPhone(patient.phone)}
              {patient.email ? ` · ${patient.email}` : ""}
            </Typography>
          </>
        )}
      </Box>

      <Paper
        elevation={1}
        sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tab} onChange={(_, value: TabValue) => setTab(value)}>
            <Tab label="Dados" value="data" />
            {/* Sem `isClinical`: responder ao paciente é trabalho da recepção,
                mesma decisão já tomada na caixa de entrada. */}
            <Tab label="Conversa" value="conversation" />
            {isClinical && <Tab label="Anamnese" value="anamnesis" />}
            {isClinical && <Tab label="Evolução" value="notes" />}
          </Tabs>
        </Box>

        {tab === "data" &&
          (isLoading || !patient ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <Stack spacing={1.5} sx={{ py: 1 }}>
              {[
                ["Nome", patient.name],
                ["Telefone", formatPhone(patient.phone)],
                ["CPF", patient.cpf ?? "—"],
                ["E-mail", patient.email ?? "—"],
              ].map(([label, value]) => (
                <Stack key={label} direction="row" spacing={2}>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", minWidth: 100 }}
                  >
                    {label}
                  </Typography>
                  <Typography variant="body2">{value}</Typography>
                </Stack>
              ))}
            </Stack>
          ))}

        {tab === "conversation" && <PatientConversation patientId={patientId} />}

        {tab === "anamnesis" && isClinical && (
          <AnamnesisForm patientId={patientId} />
        )}

        {tab === "notes" && isClinical && (
          <ClinicalNotes patientId={patientId} />
        )}
      </Paper>
    </Stack>
  );
};
