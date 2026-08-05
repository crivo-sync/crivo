"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { ErrorServer } from "@/components/ui/error-server";
import { useIsAdmin } from "@/components/providers/session-provider";

import { usePatientsFiltersState } from "../../hooks/use-patients-filters-state";
import { usePatients } from "../../hooks/use-patients";
import type { Patient } from "../../types";
import { PatientFilters } from "../PatientFilters";
import { PatientsTable } from "../PatientsTable";
import { PatientFormDialog } from "../PatientFormDialog";
import { DeletePatientDialog } from "../DeletePatientDialog";
import { ImportPatientsDialog } from "../ImportPatientsDialog";

export const PatientManagement = () => {
  const { control, page, perPage, urlSearch, updateParams, clearFilters } =
    usePatientsFiltersState();
  const { patients, meta, isLoading, error, refetch } = usePatients({
    page,
    perPage,
    search: urlSearch || undefined,
  });

  const canImport = useIsAdmin();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [deletingPatient, setDeletingPatient] = useState<Patient | undefined>();

  const openCreateForm = () => {
    setEditingPatient(undefined);
    setFormOpen(true);
  };

  const openEditForm = (patient: Patient) => {
    setEditingPatient(patient);
    setFormOpen(true);
  };

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <Paper
      elevation={1}
      sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 2 }}
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
        <PatientFilters control={control} onClear={clearFilters} />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {canImport && (
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => setImportOpen(true)}
            >
              Importar CSV
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateForm}
          >
            Novo paciente
          </Button>
        </Box>
      </Box>

      <PatientsTable
        patients={patients}
        meta={meta}
        loading={isLoading}
        onEdit={openEditForm}
        onDelete={setDeletingPatient}
        onUpdateParams={updateParams}
      />

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={editingPatient}
      />

      {canImport && (
        <ImportPatientsDialog open={importOpen} onOpenChange={setImportOpen} />
      )}

      <DeletePatientDialog
        open={!!deletingPatient}
        onOpenChange={(open) => !open && setDeletingPatient(undefined)}
        patient={deletingPatient}
      />
    </Paper>
  );
};
