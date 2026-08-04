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
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { useCreateUser } from "../../hooks/use-create-user";
import { useUpdateUser } from "../../hooks/use-update-user";
import { userFormSchema, type UserFormSchema } from "../../schemas/user";
import type { User } from "../../types";

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = modo edição; ausente = modo criação. */
  user?: User;
};

const EMPTY_VALUES: UserFormSchema = {
  name: "",
  email: "",
  password: "",
  role: "STAFF",
};

export const UserFormDialog = ({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) => {
  const isEditing = !!user;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSubmitting = createUser.isPending || updateUser.isPending;

  const { control, handleSubmit, reset, setError, formState } =
    useForm<UserFormSchema>({
      resolver: zodResolver(userFormSchema),
      defaultValues: EMPTY_VALUES,
    });

  const { requestClose, isConfirmOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChangesGuard({
      isDirty: formState.isDirty,
      onConfirmClose: () => onOpenChange(false),
    });

  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? { name: user.name, email: user.email, password: "", role: user.role }
        : EMPTY_VALUES,
    );
  }, [open, user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEditing) {
        await updateUser.mutateAsync({
          id: user.id,
          input: { name: values.name, role: values.role },
        });
        onOpenChange(false);
        return;
      }

      // email/password só existem em CreateUserDto — o schema único deixa
      // os dois opcionais para a edição não exigi-los, então a criação
      // precisa reforçar aqui.
      if (!values.email) {
        setError("email", { message: "Informe o e-mail" });
        return;
      }
      if (!values.password) {
        setError("password", { message: "Informe a senha inicial" });
        return;
      }

      await createUser.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      onOpenChange(false);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
  });

  return (
    <>
      <Dialog open={open} onClose={requestClose} fullWidth maxWidth="sm">
        <form onSubmit={onSubmit}>
          <DialogTitle>
            {isEditing ? "Editar usuário" : "Cadastrar usuário"}
          </DialogTitle>

          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              {isEditing
                ? "Atualize o nome e o papel do usuário."
                : "Preencha os dados do novo usuário. A senha inicial deve ser trocada pelo próprio usuário depois."}
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

              {!isEditing && (
                <>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="email"
                        type="email"
                        label="E-mail"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        fullWidth
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="password"
                        type="password"
                        label="Senha inicial"
                        error={!!fieldState.error}
                        helperText={
                          fieldState.error?.message ?? "Ao menos 8 caracteres."
                        }
                        fullWidth
                      />
                    )}
                  />
                </>
              )}

              <Controller
                control={control}
                name="role"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    select
                    id="role"
                    label="Papel"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  >
                    <MenuItem value="STAFF">Recepção</MenuItem>
                    <MenuItem value="PROFESSIONAL">Profissional</MenuItem>
                    <MenuItem value="ADMIN">Administrador</MenuItem>
                  </TextField>
                )}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              type="button"
              color="inherit"
              onClick={requestClose}
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

      <UnsavedChangesDialog
        open={isConfirmOpen}
        onDiscard={confirmDiscard}
        onKeepEditing={cancelDiscard}
      />
    </>
  );
};
