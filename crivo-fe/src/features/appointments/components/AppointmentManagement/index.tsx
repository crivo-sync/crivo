"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { ErrorServer } from "@/components/ui/error-server";

import { useAppointmentFormOptions } from "../../hooks/use-appointment-form-options";
import { useAppointmentsFiltersState } from "../../hooks/use-appointments-filters-state";
import { useAppointments } from "../../hooks/use-appointments";
import type { Appointment, AppointmentStatus } from "../../types";
import { AppointmentFilters } from "../AppointmentFilters";
import { AppointmentsTable } from "../AppointmentsTable";
import { AppointmentFormDialog } from "../AppointmentFormDialog";
import { RescheduleAppointmentDialog } from "../RescheduleAppointmentDialog";
import { ChangeStatusMenu } from "../ChangeStatusMenu";
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

  const [formOpen, setFormOpen] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<
    Appointment | undefined
  >();
  const [cancelling, setCancelling] = useState<
    { appointment: Appointment; status: AppointmentStatus } | undefined
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

      <AppointmentsTable
        appointments={appointments}
        meta={meta}
        loading={isLoading}
        onReschedule={setReschedulingAppointment}
        onChangeStatus={handleChangeStatus}
        onUpdateParams={updateParams}
      />

      {/* Montados só quando abertos: os dois buscam pacientes, profissionais,
          procedimentos e a clínica ao montar — com eles sempre no ar, toda
          visita à agenda pagava essas requisições sem nem abrir o formulário. */}
      {formOpen && <AppointmentFormDialog open onOpenChange={setFormOpen} />}

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
      />
    </Paper>
  );
};
