"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

import { useAnamnesis } from "../../hooks/use-anamnesis";
import { useSaveAnamnesis } from "../../hooks/use-save-anamnesis";
import {
  anamnesisFormSchema,
  type AnamnesisFormSchema,
} from "../../schemas/medical-record";

const EMPTY: AnamnesisFormSchema = {
  allergies: "",
  medications: "",
  conditions: "",
  observations: "",
};

const FIELDS = [
  {
    name: "allergies",
    label: "Alergias",
    placeholder: "Dipirona, penicilina…",
    rows: 2,
  },
  {
    name: "medications",
    label: "Medicações em uso",
    placeholder: "Losartana 50mg (uso contínuo)…",
    rows: 2,
  },
  {
    name: "conditions",
    label: "Condições de saúde",
    placeholder: "Hipertensão, diabetes…",
    rows: 2,
  },
  {
    name: "observations",
    label: "Observações",
    placeholder: "Qualquer coisa relevante para o atendimento",
    rows: 3,
  },
] as const;

export const AnamnesisForm = ({ patientId }: { patientId: string }) => {
  const { anamnesis, isLoading } = useAnamnesis(patientId);
  const save = useSaveAnamnesis(patientId);

  const { control, handleSubmit, reset, formState } =
    useForm<AnamnesisFormSchema>({
      resolver: zodResolver(anamnesisFormSchema),
      defaultValues: EMPTY,
    });

  // A ficha chega depois do primeiro render; sem este reset o formulário
  // ficaria vazio mesmo com dado salvo.
  useEffect(() => {
    if (!anamnesis) return;
    reset({
      allergies: anamnesis.allergies ?? "",
      medications: anamnesis.medications ?? "",
      conditions: anamnesis.conditions ?? "",
      observations: anamnesis.observations ?? "",
    });
  }, [anamnesis, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
    } catch {
      // Erro já exibido pelo snackbar no onError do hook.
    }
  });

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {FIELDS.map((field) => (
          <Skeleton key={field.name} variant="rounded" height={72} />
        ))}
      </Stack>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        {FIELDS.map((field) => (
          <Controller
            key={field.name}
            control={control}
            name={field.name}
            render={({ field: controlled, fieldState }) => (
              <TextField
                {...controlled}
                id={field.name}
                label={field.label}
                placeholder={field.placeholder}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                multiline
                minRows={field.rows}
                fullWidth
              />
            )}
          />
        ))}

        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {anamnesis?.updatedBy
              ? `Atualizada por ${anamnesis.updatedBy.name} em ${dayjs(anamnesis.updatedAt).format("DD/MM/YYYY [às] HH:mm")}`
              : "Ficha ainda não preenchida."}
          </Typography>

          <Button
            type="submit"
            variant="contained"
            disabled={save.isPending || !formState.isDirty}
            startIcon={
              save.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            Salvar ficha
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
