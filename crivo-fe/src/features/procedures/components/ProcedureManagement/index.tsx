"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { useIsAdmin } from "@/components/providers/session-provider";
import { useProceduresFiltersState } from "../../hooks/use-procedures-filters-state";
import { useProcedures } from "../../hooks/use-procedures";
import type { Procedure } from "../../types";
import { ProcedureFilters } from "../ProcedureFilters";
import { ProceduresTable } from "../ProceduresTable";
import { ProcedureFormDialog } from "../ProcedureFormDialog";
import { DeleteProcedureDialog } from "../DeleteProcedureDialog";

export const ProcedureManagement = () => {
  // Só ADMIN cria/edita/remove (o crivo-be exige @Roles(ADMIN) nessas rotas).
  // Aqui é decisão de UI; a barreira real está nas Server Actions e na API.
  const canManage = useIsAdmin();

  const { control, page, perPage, urlSearch, updateParams, clearFilters } =
    useProceduresFiltersState();
  const { procedures, meta, isLoading, error, refetch } = useProcedures({
    page,
    perPage,
    search: urlSearch || undefined,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<
    Procedure | undefined
  >();
  const [deletingProcedure, setDeletingProcedure] = useState<
    Procedure | undefined
  >();

  const openCreateForm = () => {
    setEditingProcedure(undefined);
    setFormOpen(true);
  };

  const openEditForm = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setFormOpen(true);
  };

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        }
      >
        {error.message}
      </Alert>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <ProcedureFilters control={control} onClear={clearFilters} />
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateForm}
          >
            Novo procedimento
          </Button>
        )}
      </Box>

      <ProceduresTable
        procedures={procedures}
        meta={meta}
        loading={isLoading}
        canManage={canManage}
        onEdit={openEditForm}
        onDelete={setDeletingProcedure}
        onUpdateParams={updateParams}
      />

      {canManage && (
        <>
          <ProcedureFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            procedure={editingProcedure}
          />

          <DeleteProcedureDialog
            open={!!deletingProcedure}
            onOpenChange={(open) => !open && setDeletingProcedure(undefined)}
            procedure={deletingProcedure}
          />
        </>
      )}
    </Paper>
  );
};
