"use client";

import { Controller, type Control } from "react-hook-form";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

type ProcedureFiltersProps = {
  control: Control<{ search: string }>;
  onClear: () => void;
};

export const ProcedureFilters = ({ control, onClear }: ProcedureFiltersProps) => {
  return (
    // `flex: 1` para acompanhar o espaço livre — ver PatientFilters.
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
      <Controller
        control={control}
        name="search"
        render={({ field }) => (
          <TextField
            {...field}
            placeholder="Buscar por nome ou descrição"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                    />
                  </InputAdornment>
                ),
                endAdornment: field.value && (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      onClick={onClear}
                      size="small"
                      sx={{ color: "text.secondary" }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />
    </Box>
  );
};
