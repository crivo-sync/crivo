"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { EntityAutocomplete } from "@/components/entity-autocomplete";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { formatCentsToBRL } from "@/lib/currency";
import { formatDuration } from "@/lib/duration";
import { useTenant } from "@/features/tenant/hooks/use-tenant";
import { useOverLimitStatus } from "@/features/professionals/hooks/use-over-limit";
import { SlotPicker } from "../SlotPicker";
import { useAppointmentFormOptions } from "../../hooks/use-appointment-form-options";
import { useCreateAppointment } from "../../hooks/use-create-appointment";
import {
  createAppointmentSchema,
  type CreateAppointmentSchema,
} from "../../schemas/appointment";

type AppointmentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMPTY_VALUES: CreateAppointmentSchema = {
  patientId: "",
  professionalId: "",
  procedureId: "",
  startsAt: "",
  notes: "",
};

export const AppointmentFormDialog = ({
  open,
  onOpenChange,
}: AppointmentFormDialogProps) => {
  const createAppointment = useCreateAppointment();
  const { patients, professionals, procedures, isLoading } =
    useAppointmentFormOptions();
  const { tenant } = useTenant();
  const { status: overLimit } = useOverLimitStatus();

  const { control, handleSubmit, reset, watch, setValue, formState } =
    useForm<CreateAppointmentSchema>({
      resolver: zodResolver(createAppointmentSchema),
      defaultValues: EMPTY_VALUES,
    });

  const { requestClose, isConfirmOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChangesGuard({
      isDirty: formState.isDirty,
      onConfirmClose: () => onOpenChange(false),
    });

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const selectedPatientId = watch("patientId");
  const selectedProfessionalId = watch("professionalId");
  const selectedProcedureId = watch("procedureId");

  const selectedProfessional = professionals.find(
    (professional) => professional.id === selectedProfessionalId,
  );

  // Sem procedimentos marcados = profissional sem restrição, faz qualquer um.
  const availableProcedures = useMemo(() => {
    if (!selectedProfessional || selectedProfessional.procedures.length === 0) {
      return procedures;
    }
    const allowedIds = new Set(
      selectedProfessional.procedures.map((procedure) => procedure.id),
    );
    return procedures.filter((procedure) => allowedIds.has(procedure.id));
  }, [procedures, selectedProfessional]);

  const selectedProcedure = availableProcedures.find(
    (procedure) => procedure.id === selectedProcedureId,
  );

  // Trocar de profissional pode tirar o procedimento já escolhido da lista
  // permitida — sem isso ficaria um valor "fantasma" que não aparece mais
  // nas opções, mas continua marcado no form.
  useEffect(() => {
    if (!selectedProcedureId) return;
    const stillAllowed = availableProcedures.some(
      (procedure) => procedure.id === selectedProcedureId,
    );
    if (stillAllowed) return;
    setValue("procedureId", "", { shouldDirty: true });
    setValue("startsAt", "");
  }, [availableProcedures, selectedProcedureId, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createAppointment.mutateAsync({
        patientId: values.patientId,
        professionalId: values.professionalId,
        procedureId: values.procedureId,
        startsAt: new Date(values.startsAt).toISOString(),
        notes: values.notes || undefined,
      });
      onOpenChange(false);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook; mantém o dialog
      // aberto para o usuário corrigir (ex.: conflito de horário).
    }
  });

  return (
    <>
      <Dialog open={open} onClose={requestClose} fullWidth maxWidth="sm">
        <form onSubmit={onSubmit}>
          <DialogTitle>Novo agendamento</DialogTitle>

          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              Duração e preço são definidos pelo procedimento escolhido.
            </DialogContentText>

            {/**
             * Acima do teto, o backend recusa o agendamento
             * (`CreateAppointmentUseCase`). Avisar aqui, antes de a recepção
             * preencher paciente/procedimento/horário, evita que ela descubra
             * o bloqueio só no "Salvar" — e diz onde resolver.
             */}
            {overLimit?.overLimit ? (
              <Alert severity="warning" sx={{ mb: 2.5 }}>
                Sua clínica tem {overLimit.activeCount} profissionais ativos, e
                o plano {overLimit.planName ?? "atual"} inclui{" "}
                {overLimit.maxProfessionals}. Novos agendamentos ficam
                bloqueados até você{" "}
                <Link href="/painel/profissionais">escolher quem continua</Link>{" "}
                ou{" "}
                <Link href="/painel/configuracoes?tab=subscription">
                  fazer upgrade
                </Link>
                . A agenda já marcada continua normal.
              </Alert>
            ) : (
              /**
               * Informativo, não de erro: plano de 1 profissional é decisão
               * normal de quem atende sozinho, não um problema a corrigir. Só
               * aparece nessa faixa — uma clínica com 3+ profissionais não
               * precisa ser lembrada de um limite que está longe de bater.
               */
              tenant?.plan?.maxProfessionals === 1 && (
                <Alert severity="info" sx={{ mb: 2.5 }}>
                  Seu plano permite 1 profissional. Para atender com mais de uma
                  pessoa,{" "}
                  <Link href="/painel/configuracoes?tab=subscription">
                    faça upgrade em Configurações → Assinatura
                  </Link>
                  .
                </Alert>
              )
            )}

            <Stack spacing={2.5}>
              <Controller
                control={control}
                name="patientId"
                render={({ field, fieldState }) => (
                  <EntityAutocomplete
                    id="patientId"
                    label="Paciente"
                    options={patients}
                    getOptionLabel={(patient) => patient.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    loading={isLoading}
                  />
                )}
              />

              <Controller
                control={control}
                name="professionalId"
                render={({ field, fieldState }) => (
                  <EntityAutocomplete
                    id="professionalId"
                    label="Profissional"
                    options={professionals}
                    getOptionLabel={(professional) => professional.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message ??
                      (!selectedPatientId ? "Escolha o paciente antes." : undefined)
                    }
                    loading={isLoading}
                    // Cascata: cada campo depende do anterior para fazer
                    // sentido — o procedimento é filtrado pelo profissional, e
                    // os horários dependem dos dois. Abrir tudo de uma vez
                    // deixava a recepção preencher fora de ordem e ver a lista
                    // mudar embaixo do que já tinha escolhido.
                    disabled={!selectedPatientId}
                  />
                )}
              />

              <Controller
                control={control}
                name="procedureId"
                render={({ field, fieldState }) => (
                  <EntityAutocomplete
                    id="procedureId"
                    label="Procedimento"
                    options={availableProcedures}
                    getOptionLabel={(procedure) => procedure.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message ??
                      (!selectedProfessionalId
                        ? "Escolha o profissional antes."
                        : undefined) ??
                      (selectedProcedure &&
                        `${formatDuration(selectedProcedure.durationMinutes)} · ${formatCentsToBRL(selectedProcedure.priceInCents)}`) ??
                      (selectedProfessional &&
                        selectedProfessional.procedures.length > 0 &&
                        "Mostrando só os procedimentos que este profissional realiza.")
                    }
                    loading={isLoading}
                    disabled={!selectedProfessionalId}
                  />
                )}
              />

              <Controller
                control={control}
                name="startsAt"
                render={({ field, fieldState }) => (
                  <SlotPicker
                    professionalId={selectedProfessionalId || undefined}
                    procedureId={selectedProcedureId || undefined}
                    value={field.value}
                    onChange={field.onChange}
                    errorMessage={fieldState.error?.message}
                    businessDays={tenant?.businessDays}
                    businessHoursEnd={tenant?.businessHoursEnd}
                    procedureDurationMinutes={
                      selectedProcedure?.durationMinutes
                    }
                    professionalSchedules={selectedProfessional?.schedules}
                  />
                )}
              />

              <Controller
                control={control}
                name="notes"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    id="notes"
                    label="Observações (opcional)"
                    placeholder="Paciente pediu anestesia."
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              type="button"
              color="inherit"
              onClick={requestClose}
              disabled={createAppointment.isPending}
            >
              Cancelar
            </Button>
            {/* Acima do teto o backend recusa de qualquer forma; deixar o
                botão ativo só levaria a recepção a preencher tudo para tomar
                um erro no fim. */}
            <Button
              type="submit"
              variant="contained"
              disabled={createAppointment.isPending || overLimit?.overLimit}
              startIcon={
                createAppointment.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              Agendar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <UnsavedChangesDialog
        open={isConfirmOpen}
        onDiscard={confirmDiscard}
        onKeepEditing={cancelDiscard}
      />
    </>
  );
};
