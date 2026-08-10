"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { ErrorServer } from "@/components/ui/error-server";

import { useIsAdmin } from "@/components/providers/session-provider";
import { useProfessionalsFiltersState } from "../../hooks/use-professionals-filters-state";
import { useProfessionals } from "../../hooks/use-professionals";
import type { Professional } from "../../types";
import { ProfessionalFilters } from "../ProfessionalFilters";
import { ProfessionalsTable } from "../ProfessionalsTable";
import { ScheduleDialog } from "../ScheduleDialog";
import { ProfessionalFormDialog } from "../ProfessionalFormDialog";
import { DeleteProfessionalDialog } from "../DeleteProfessionalDialog";

export const ProfessionalManagement = () => {
  // Só ADMIN cria/edita/remove (o crivo-be exige @Roles(ADMIN) nessas rotas).
  // Aqui é decisão de UI; a barreira real está nas Server Actions e na API.
  const canManage = useIsAdmin();

  const { control, page, perPage, urlSearch, updateParams, clearFilters } =
    useProfessionalsFiltersState();
  const { professionals, meta, isLoading, error, refetch } = useProfessionals({
    page,
    perPage,
    search: urlSearch || undefined,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<
    Professional | undefined
  >();
  const [deletingProfessional, setDeletingProfessional] = useState<
    Professional | undefined
  >();
  const [schedulingProfessional, setSchedulingProfessional] = useState<
    Professional | undefined
  >();

  const openCreateForm = () => {
    setEditingProfessional(undefined);
    setFormOpen(true);
  };

  const openEditForm = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormOpen(true);
  };

  if (error) {
    return (
      <ErrorServer message={error.message} onRetry={() => refetch()} />
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
        <ProfessionalFilters control={control} onClear={clearFilters} />
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateForm}
          >
            Novo profissional
          </Button>
        )}
      </Box>

      <ProfessionalsTable
        professionals={professionals}
        meta={meta}
        loading={isLoading}
        canManage={canManage}
        onEdit={openEditForm}
        onDelete={setDeletingProfessional}
        onManageSchedule={setSchedulingProfessional}
        onUpdateParams={updateParams}
      />

      {canManage && (
        <>
          {/* A `key` remonta o dialog a cada abertura, zerando o rascunho da
              grade sem um efeito de limpeza — que o React Compiler acusa
              como render em cascata. */}
          <ProfessionalFormDialog
            key={`${editingProfessional?.id ?? "new"}-${formOpen}`}
            open={formOpen}
            onOpenChange={setFormOpen}
            professional={editingProfessional}
          />

          <DeleteProfessionalDialog
            open={!!deletingProfessional}
            onOpenChange={(open) => !open && setDeletingProfessional(undefined)}
            professional={deletingProfessional}
          />

          {/* Montado só quando aberto: carrega grade e bloqueios do
              profissional, requisições que não fazem sentido na listagem. */}
          {schedulingProfessional && (
            <ScheduleDialog
              open
              onOpenChange={(open) =>
                !open && setSchedulingProfessional(undefined)
              }
              professional={schedulingProfessional}
            />
          )}
        </>
      )}
    </Paper>
  );
};
