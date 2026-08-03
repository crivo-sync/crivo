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
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";

import { parseBRLToCents } from "@/lib/currency";
import { useCreateProcedure } from "../../hooks/use-create-procedure";
import { useUpdateProcedure } from "../../hooks/use-update-procedure";
import {
  procedureFormSchema,
  type ProcedureFormSchema,
} from "../../schemas/procedure";
import type { Procedure } from "../../types";

type ProcedureFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = modo edição; ausente = modo criação. */
  procedure?: Procedure;
};

const EMPTY_VALUES: ProcedureFormSchema = {
  name: "",
  description: "",
  durationMinutes: 30,
  priceInCents: 0,
  isActive: true,
};

export const ProcedureFormDialog = ({
  open,
  onOpenChange,
  procedure,
}: ProcedureFormDialogProps) => {
  const isEditing = !!procedure;
  const createProcedure = useCreateProcedure();
  const updateProcedure = useUpdateProcedure();
  const isSubmitting = createProcedure.isPending || updateProcedure.isPending;

  const { control, handleSubmit, reset } = useForm<ProcedureFormSchema>({
    resolver: zodResolver(procedureFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      procedure
        ? {
            name: procedure.name,
            description: procedure.description ?? "",
            durationMinutes: procedure.durationMinutes,
            priceInCents: procedure.priceInCents,
            isActive: procedure.isActive,
          }
        : EMPTY_VALUES,
    );
  }, [open, procedure, reset]);

  const onSubmit = handleSubmit(async ({ isActive, ...values }) => {
    const base = {
      name: values.name,
      description: values.description || undefined,
      durationMinutes: values.durationMinutes,
      priceInCents: values.priceInCents,
    };

    try {
      if (isEditing) {
        // `isActive` só existe no UpdateProcedureDto, não no cadastro.
        await updateProcedure.mutateAsync({
          id: procedure.id,
          input: { ...base, isActive },
        });
      } else {
        await createProcedure.mutateAsync(base);
      }
      onOpenChange(false);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
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
          {isEditing ? "Editar procedimento" : "Cadastrar procedimento"}
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {isEditing
              ? "Atualize os dados do procedimento."
              : "Preencha os dados do novo procedimento."}
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
                  placeholder="Limpeza dental"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="description"
                  label="Descrição (opcional)"
                  placeholder="Profilaxia e remoção de tártaro"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  multiline
                  minRows={2}
                  fullWidth
                />
              )}
            />

            <Stack direction="row" spacing={2.5}>
              <Controller
                control={control}
                name="durationMinutes"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                    id="durationMinutes"
                    type="number"
                    label="Duração"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">min</InputAdornment>
                        ),
                      },
                    }}
                    fullWidth
                  />
                )}
              />

              <Controller
                control={control}
                name="priceInCents"
                render={({ field, fieldState }) => (
                  <TextField
                    value={(field.value / 100).toFixed(2).replace(".", ",")}
                    onChange={(event) =>
                      field.onChange(parseBRLToCents(event.target.value))
                    }
                    onBlur={field.onBlur}
                    id="priceInCents"
                    label="Preço"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">R$</InputAdornment>
                        ),
                      },
                    }}
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
                    label="Procedimento ativo"
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
