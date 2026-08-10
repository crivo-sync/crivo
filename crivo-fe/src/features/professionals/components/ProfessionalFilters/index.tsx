"use client";

import { Controller, type Control } from "react-hook-form";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

type ProfessionalFiltersProps = {
  control: Control<{ search: string }>;
  onClear: () => void;
};

export const ProfessionalFilters = ({
  control,
  onClear,
}: ProfessionalFiltersProps) => {
  return (
    // `flex: 1` em vez de largura fixa: a busca ocupa o espaço que sobra ao
    // lado do botão "Novo profissional", em vez dos 500px cravados que
    // deixavam cada tela do painel com uma barra de tamanho diferente.
    // Não é `width: 100%` porque o pai é flex com o botão ao lado.
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
      <Controller
        control={control}
        name="search"
        render={({ field }) => (
          <TextField
            {...field}
            placeholder="Buscar por nome, especialidade, registro ou e-mail"
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
