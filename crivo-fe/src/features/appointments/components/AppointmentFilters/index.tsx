"use client";

import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";

import { STATUS_LABELS } from "../../status";
import type { AppointmentStatus } from "../../types";

type ProfessionalOption = { id: string; name: string };
type PatientOption = { id: string; name: string };

type AppointmentFiltersProps = {
  professionalId: string;
  patientId: string;
  from: string;
  to: string;
  status: AppointmentStatus | "";
  professionals: ProfessionalOption[];
  patients: PatientOption[];
  onChange: (updates: Record<string, string | null>) => void;
  onClear: () => void;
};

export const AppointmentFilters = ({
  professionalId,
  patientId,
  from,
  to,
  status,
  professionals,
  patients,
  onChange,
  onClear,
}: AppointmentFiltersProps) => {
  const hasFilters =
    !!professionalId || !!patientId || !!from || !!to || !!status;

  const handleDateChange = (key: "from" | "to") => (value: Dayjs | null) => {
    // `value` não é `null` enquanto o usuário digita uma data parcial/
    // inválida no picker — só limpar o filtro quando estiver de fato vazio
    // ou completo, senão `toISOString()` lança e o filtro fica travado sem
    // feedback nenhum (o erro cai num console.error silencioso).
    if (!value || !value.isValid()) {
      if (!value) onChange({ [key]: null, page: "1" });
      return;
    }
    const iso =
      key === "from"
        ? value.startOf("day").toISOString()
        : value.endOf("day").toISOString();
    onChange({ [key]: iso, page: "1" });
  };

  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}
    >
      <TextField
        select
        label="Profissional"
        value={professionalId}
        onChange={(event) =>
          onChange({ professionalId: event.target.value || null, page: "1" })
        }
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">Todos</MenuItem>
        {professionals.map((professional) => (
          <MenuItem key={professional.id} value={professional.id}>
            {professional.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Paciente"
        value={patientId}
        onChange={(event) =>
          onChange({ patientId: event.target.value || null, page: "1" })
        }
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">Todos</MenuItem>
        {patients.map((patient) => (
          <MenuItem key={patient.id} value={patient.id}>
            {patient.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Status"
        value={status}
        onChange={(event) =>
          onChange({ status: event.target.value || null, page: "1" })
        }
        sx={{ minWidth: 170 }}
      >
        <MenuItem value="">Todos</MenuItem>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>

      <DatePicker
        label="De"
        value={from ? dayjs(from) : null}
        onChange={handleDateChange("from")}
        slotProps={{ textField: { sx: { minWidth: 170 } } }}
      />

      <DatePicker
        label="Até"
        value={to ? dayjs(to) : null}
        onChange={handleDateChange("to")}
        minDate={from ? dayjs(from) : undefined}
        slotProps={{ textField: { sx: { minWidth: 170 } } }}
      />

      {hasFilters && (
        <Tooltip title="Limpar filtros">
          <IconButton size="small" onClick={onClear}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
