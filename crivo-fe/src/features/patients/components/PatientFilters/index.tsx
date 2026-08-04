"use client";

import { Controller, type Control } from "react-hook-form";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";

type PatientFiltersProps = {
  control: Control<{ search: string }>;
  onClear: () => void;
};

export const PatientFilters = ({ control, onClear }: PatientFiltersProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Controller
        control={control}
        name="search"
        render={({ field }) => (
          <TextField
            {...field}
            placeholder="Buscar por nome, telefone, CPF ou e-mail"
            sx={{ width: 1000, maxWidth: "100%" }}
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
