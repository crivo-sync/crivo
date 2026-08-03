"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";

import { MaskedTextField } from "@/components/masked-text-field";
import { PHONE_MASK } from "@/lib/br-masks";
import { useCreateProfessional } from "../../hooks/use-create-professional";
import { useUpdateProfessional } from "../../hooks/use-update-professional";
import {
  professionalFormSchema,
  type ProfessionalFormSchema,
} from "../../schemas/professional";
import type { Professional } from "../../types";

type ProfessionalFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = modo edição; ausente = modo criação. */
  professional?: Professional;
};

const EMPTY_VALUES: ProfessionalFormSchema = {
  name: "",
  specialty: "",
  councilCode: "",
  phone: "",
  email: "",
  isActive: true,
};

export const ProfessionalFormDialog = ({
  open,
  onOpenChange,
  professional,
}: ProfessionalFormDialogProps) => {
  const isEditing = !!professional;
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();
  const isSubmitting =
    createProfessional.isPending || updateProfessional.isPending;

  const { control, handleSubmit, reset } = useForm<ProfessionalFormSchema>({
    resolver: zodResolver(professionalFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      professional
        ? {
            name: professional.name,
            specialty: professional.specialty ?? "",
            councilCode: professional.councilCode ?? "",
            phone: professional.phone ?? "",
            email: professional.email ?? "",
            isActive: professional.isActive,
          }
        : EMPTY_VALUES,
    );
  }, [open, professional, reset]);

  const onSubmit = handleSubmit(async ({ isActive, ...values }) => {
    // Campos opcionais vazios não devem ir como "" para a API.
    const base = {
      name: values.name,
      specialty: values.specialty || undefined,
      councilCode: values.councilCode || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
    };

    if (isEditing) {
      // `isActive` só existe no UpdateProfessionalDto, não no cadastro.
      await updateProfessional.mutateAsync({
        id: professional.id,
        input: { ...base, isActive },
      });
    } else {
      await createProfessional.mutateAsync(base);
    }
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      fullWidth
      maxWidth="sm"
    >
      <form onSubmit={onSubmit}>
        <DialogTitle>
          {isEditing ? "Editar profissional" : "Cadastrar profissional"}
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {isEditing
              ? "Atualize os dados do profissional."
              : "Preencha os dados do novo profissional."}
          </DialogContentText>

          <Stack spacing={2.5}>
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="name"
                  label="Nome"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            <Stack direction="row" spacing={2.5}>
              <Controller
                control={control}
                name="specialty"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    id="specialty"
                    label="Especialidade (opcional)"
                    placeholder="Ortodontia"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                control={control}
                name="councilCode"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    id="councilCode"
                    label="Registro (opcional)"
                    placeholder="CRO-SP 12345"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
            </Stack>

            <Stack direction="row" spacing={2.5}>
              <Controller
                control={control}
                name="phone"
                render={({ field, fieldState }) => (
                  <MaskedTextField
                    {...field}
                    {...PHONE_MASK}
                    id="phone"
                    label="Telefone (opcional)"
                    placeholder="(11) 98765-4321"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    id="email"
                    type="email"
                    label="E-mail (opcional)"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
            </Stack>

            {isEditing && (
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Profissional ativo"
                  />
                )}
              />
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            type="button"
            color="inherit"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {isEditing ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
