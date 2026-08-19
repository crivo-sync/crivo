"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { ErrorServer } from "@/components/ui/error-server";

import { useAppointmentFormOptions } from "../../hooks/use-appointment-form-options";
import { useAppointmentsFiltersState } from "../../hooks/use-appointments-filters-state";
import { useAppointments } from "../../hooks/use-appointments";
import { useNewAppointments } from "../../hooks/use-new-appointments";
import type { Appointment, AppointmentStatus } from "../../types";
import { AppointmentFilters } from "../AppointmentFilters";
import { AppointmentsTable } from "../AppointmentsTable";
import { AppointmentFormDialog } from "../AppointmentFormDialog";
import { RescheduleAppointmentDialog } from "../RescheduleAppointmentDialog";
import { ChangeStatusMenu } from "../ChangeStatusMenu";
import { SlotCandidatesDialog } from "@/features/waitlist/components/SlotCandidatesDialog";
import { useChangeAppointmentStatus } from "../../hooks/use-change-appointment-status";

export const AppointmentManagement = () => {
  const {
    page,
    perPage,
    professionalId,
    patientId,
    from,
    to,
    status,
    updateParams,
    clearFilters,
  } = useAppointmentsFiltersState();
  const { appointments, meta, isLoading, error, refetch } = useAppointments({
    page,
    perPage,
    professionalId: professionalId || undefined,
    patientId: patientId || undefined,
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
  });
  const { professionals, patients } = useAppointmentFormOptions();
  const changeStatus = useChangeAppointmentStatus();
  const {
    count: newCount,
    newIds,
    clear: clearNewIds,
  } = useNewAppointments(appointments);

  const [formOpen, setFormOpen] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<
    Appointment | undefined
  >();
  const [cancelling, setCancelling] = useState<
    { appointment: Appointment; status: AppointmentStatus } | undefined
  >();
  /** Agendamento recém-cancelado — abre a sugestão da lista de espera. */
  const [freedSlotId, setFreedSlotId] = useState<string | undefined>();
  /**
   * Candidato escolhido em "Agendar" no diálogo de sugestão — pré-preenche
   * `AppointmentFormDialog`. `null` no professionalId vira `undefined`
   * porque o form trata "sem escolha" como campo vazio, não `null`.
   */
  const [waitlistPrefill, setWaitlistPrefill] = useState<
    | {
        patientId: string;
        professionalId?: string;
        procedureId: string;
        waitlistEntryId: string;
      }
    | undefined
  >();

  const handleChangeStatus = (
    appointment: Appointment,
    nextStatus: AppointmentStatus,
  ) => {
    if (nextStatus === "CANCELLED") {
      setCancelling({ appointment, status: nextStatus });
      return;
    }
    changeStatus.mutate({ id: appointment.id, input: { status: nextStatus } });
  };

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <Paper
      elevation={1}
      sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
    >
      {/* `alignItems: flex-start` porque os filtros quebram em várias linhas
          em telas menores — com "center" o botão flutuaria no meio delas. */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", lg: "flex-start" },
          flexDirection: { xs: "column", lg: "row" },
          gap: 2,
        }}
      >
        <AppointmentFilters
          professionalId={professionalId}
          patientId={patientId}
          from={from}
          to={to}
          status={status}
          professionals={professionals}
          patients={patients}
          onChange={updateParams}
          onClear={clearFilters}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          // `flexShrink: 0` para o texto não quebrar quando os filtros
          // crescem; a altura casa com a dos campos "small" do tema.
          sx={{ flexShrink: 0, height: 40 }}
        >
          Novo agendamento
        </Button>
      </Box>

      {/* O aviso é o que faz a chegada ser notada: a linha nova entra no meio
          da tabela e, sozinha, passa despercebida por quem não estava olhando
          na hora. Some ao ser reconhecido — não é estado permanente.

          A contagem vem do servidor, não de `newIds`: a lista é ordenada por
          data de atendimento, então quem marca para daqui a dias cai em outra
          página, e um aviso baseado só no que está carregado nunca apareceria
          para quem está na página 1. */}
      {newCount > 0 && (
        <Alert
          severity="info"
          onClose={clearNewIds}
          sx={{ alignItems: "center" }}
        >
          {newCount === 1
            ? "1 agendamento novo chegou"
            : `${newCount} agendamentos novos chegaram`}
          {/* Só promete destaque quando a linha está mesmo visível: pode ter
              chegado em outra página, e mandar procurar destaque que não
              existe é pior que não dizer nada. */}
          {newIds.size > 0
            ? " — destacado(s) na lista abaixo."
            : " — em outra página da lista."}
        </Alert>
      )}

      <AppointmentsTable
        appointments={appointments}
        meta={meta}
        loading={isLoading}
        newIds={newIds}
        onReschedule={setReschedulingAppointment}
        onChangeStatus={handleChangeStatus}
        onUpdateParams={updateParams}
      />

      {/* Montados só quando abertos: os dois buscam pacientes, profissionais,
          procedimentos e a clínica ao montar — com eles sempre no ar, toda
          visita à agenda pagava essas requisições sem nem abrir o formulário. */}
      {formOpen && (
        <AppointmentFormDialog
          open
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setWaitlistPrefill(undefined);
          }}
          prefill={waitlistPrefill}
        />
      )}

      {reschedulingAppointment && (
        <RescheduleAppointmentDialog
          open
          onOpenChange={(open) =>
            !open && setReschedulingAppointment(undefined)
          }
          appointment={reschedulingAppointment}
        />
      )}

      <ChangeStatusMenu
        pending={cancelling}
        onOpenChange={(open) => !open && setCancelling(undefined)}
        onCancelled={setFreedSlotId}
      />

      {/* A vaga que acabou de abrir: sugere quem da fila pode ocupá-la, em
          vez de esperar a recepção lembrar de conferir a lista. */}
      {freedSlotId && (
        <SlotCandidatesDialog
          open
          appointmentId={freedSlotId}
          onOpenChange={(open) => !open && setFreedSlotId(undefined)}
          onSchedule={(candidate) => {
            setFreedSlotId(undefined);
            setWaitlistPrefill({
              patientId: candidate.patientId,
              professionalId: candidate.professionalId ?? undefined,
              procedureId: candidate.procedureId,
              waitlistEntryId: candidate.id,
            });
            setFormOpen(true);
          }}
        />
      )}
    </Paper>
  );
};
