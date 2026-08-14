"use client";

import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { proceduresFor, useBooking } from "../hooks/use-booking";
import { formatPhone, isValidPhone, onlyDigits } from "../phone";
import { BookingConfirmed } from "./booking-confirmed";
import { SlotPicker } from "./slot-picker";

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const BookingForm = ({ subdomain }: { subdomain: string }) => {
  const booking = useBooking(subdomain);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [startsAt, setStartsAt] = useState<string | null>(null);

  if (booking.isLoadingOptions) {
    return (
      <Stack spacing={2} aria-busy>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={56} />
        ))}
      </Stack>
    );
  }

  if (booking.loadError || !booking.options) {
    return (
      <Alert severity="error">
        {booking.loadError ?? "Clínica não encontrada."}
      </Alert>
    );
  }

  if (booking.confirmation) {
    return (
      <BookingConfirmed
        confirmation={booking.confirmation}
        clinic={booking.options?.clinic}
        onNewBooking={() => {
          // O horário é estado do formulário, não do hook — sem limpar aqui,
          // o form voltaria com o horário da consulta que acabou de ser
          // marcada já selecionado.
          setStartsAt(null);
          setPatientName("");
          setPatientPhone("");
          setNotes("");
          booking.reset();
        }}
      />
    );
  }

  const { options } = booking;

  /**
   * Clínica recém-criada não tem profissional nem procedimento cadastrado,
   * e sem os dois não existe horário nenhum para oferecer. Sem este aviso o
   * paciente encara um formulário morto — e a clínica não descobre que o
   * link que ela divulgou não funciona.
   */
  if (options.professionals.length === 0 || options.procedures.length === 0) {
    return (
      <Alert severity="info">
        <AlertTitle>Agenda ainda não disponível</AlertTitle>
        Esta clínica ainda não abriu horários para agendamento online.
        {options.clinic.phone
          ? ` Entre em contato pelo telefone ${options.clinic.phone}.`
          : " Entre em contato com a clínica."}
      </Alert>
    );
  }

  const availableProcedures = proceduresFor(options, booking.professionalId);

  // Dias em que o profissional selecionado atende, pela grade do admin.
  // Grade vazia = herda o expediente da clínica (mesma regra do backend),
  // então "sem grade" não pode virar "não atende em dia nenhum".
  const selectedProfessional = options.professionals.find(
    (p) => p.id === booking.professionalId,
  );
  const professionalHasSchedule =
    (selectedProfessional?.schedules.length ?? 0) > 0;
  const professionalWorkDays = new Set(
    (selectedProfessional?.schedules ?? []).map((s) => s.weekday),
  );

  const canSubmit =
    patientName.trim().length >= 2 &&
    isValidPhone(patientPhone) &&
    !!startsAt &&
    !booking.isSubmitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !startsAt) return;

    await booking.submit({
      patientName: patientName.trim(),
      patientPhone: onlyDigits(patientPhone),
      startsAt,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2.5} noValidate>
      <TextField
        select
        id="professional"
        label="Com quem você quer atendimento"
        value={booking.professionalId}
        onChange={(e) => {
          booking.selectProfessional(e.target.value);
          setStartsAt(null);
        }}
        fullWidth
      >
        {options.professionals.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}
            {p.specialty ? ` — ${p.specialty}` : ""}
          </MenuItem>
        ))}
      </TextField>

      {/* Travado até escolher o profissional: a lista de procedimentos
          depende de quem atende, e mudar depois trocaria a opção embaixo do
          que já foi selecionado. */}
      <TextField
        select
        id="procedure"
        label="O que você precisa"
        value={booking.procedureId}
        disabled={!booking.professionalId}
        helperText={
          booking.professionalId ? undefined : "Escolha o profissional primeiro"
        }
        onChange={(e) => {
          booking.setProcedureId(e.target.value);
          setStartsAt(null);
        }}
        fullWidth
      >
        {availableProcedures.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name} — {p.durationMinutes} min · {brl(p.priceInCents)}
          </MenuItem>
        ))}
      </TextField>

      <DatePicker
        label="Dia"
        value={dayjs(booking.date)}
        disabled={!booking.procedureId}
        disablePast
        // Mesma regra do painel (`SlotPicker` da agenda): dia fora do
        // funcionamento da clínica já aparece cinza, em vez de deixar
        // escolher e só recusar depois de buscar os horários.
        //
        // A grade do profissional entra aqui também: com grade cadastrada,
        // os dias em que ele não atende aparecem desabilitados no calendário
        // — a regra de herança é a mesma do backend (grade vazia = atende no
        // expediente da clínica). Sem isso o paciente escolhia um dia, o
        // SlotPicker avisava "O profissional não atende neste dia" e ele
        // tinha que voltar e trocar.
        shouldDisableDate={(day: Dayjs) => {
          if (!options.clinic.businessDays.includes(day.day())) return true;
          return (
            professionalHasSchedule && !professionalWorkDays.has(day.day())
          );
        }}
        onChange={(next) => {
          if (!next || !next.isValid()) return;
          booking.setDate(next.format("YYYY-MM-DD"));
          setStartsAt(null);
        }}
        slotProps={{ textField: { fullWidth: true } }}
      />

      {booking.procedureId && (
        <Box>
          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
            Horário
          </Typography>
          <SlotPicker
            availability={booking.availability}
            isLoading={booking.isLoadingSlots}
            selectedStartsAt={startsAt}
            onSelect={setStartsAt}
          />
        </Box>
      )}

      {startsAt && (
        <>
          <TextField
            id="name"
            label="Seu nome"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Maria Silva"
            autoComplete="name"
            fullWidth
          />

          <TextField
            id="phone"
            label="WhatsApp"
            value={patientPhone}
            onChange={(e) => setPatientPhone(formatPhone(e.target.value))}
            placeholder="(11) 98765-4321"
            autoComplete="tel"
            helperText="É por aqui que a clínica confirma sua consulta."
            slotProps={{ htmlInput: { inputMode: "tel" } }}
            fullWidth
          />

          <TextField
            id="notes"
            label="Quer avisar algo? (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            fullWidth
          />
        </>
      )}

      {booking.submitError && (
        <Alert severity="error">{booking.submitError}</Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={!canSubmit}
        startIcon={
          booking.isSubmitting ? (
            <CircularProgress size={16} color="inherit" />
          ) : null
        }
        fullWidth
      >
        {booking.isSubmitting ? "Confirmando…" : "Confirmar agendamento"}
      </Button>
    </Stack>
  );
};
