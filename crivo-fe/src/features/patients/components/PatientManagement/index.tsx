"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { usePatientsFiltersState } from "../../hooks/use-patients-filters-state";
import { usePatients } from "../../hooks/use-patients";
import type { Patient } from "../../types";
import { PatientFilters } from "../PatientFilters";
import { PatientsTable } from "../PatientsTable";
import { PatientFormDialog } from "../PatientFormDialog";
import { DeletePatientDialog } from "../DeletePatientDialog";

export const PatientManagement = () => {
  const { control, page, perPage, urlSearch, updateParams, clearFilters } =
    usePatientsFiltersState();
  const { patients, meta, isLoading, error, refetch } = usePatients({
    page,
    perPage,
    search: urlSearch || undefined,
  });

  const [formOpen, setFormOpen] = useState(false);
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateForm}
        >
          Novo paciente
        </Button>
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

      <DeletePatientDialog
        open={!!deletingPatient}
        onOpenChange={(open) => !open && setDeletingPatient(undefined)}
        patient={deletingPatient}
      />
    </Paper>
  );
};
