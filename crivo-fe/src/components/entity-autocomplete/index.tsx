"use client";

import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";

type EntityOption = { id: string };

type EntityAutocompleteProps<TOption extends EntityOption> = {
  id: string;
  label: string;
  options: TOption[];
  getOptionLabel: (option: TOption) => string;
  value: string;
  onChange: (id: string) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * Select com busca para listas de entidades (paciente, profissional,
 * procedimento) — o `TextField select` nativo não filtra por digitação e
 * não reflete bem o valor escolhido no label quando a lista cresce.
 * `id` sempre string (UUID), nunca o objeto inteiro, para casar 1:1 com o
 * schema Zod do formulário (`z.string().uuid()`).
 */
export function EntityAutocomplete<TOption extends EntityOption>({
  id,
  label,
  options,
  getOptionLabel,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  loading,
  disabled,
}: EntityAutocompleteProps<TOption>) {
  const selected = options.find((option) => option.id === value) ?? null;

  return (
    <Autocomplete
      id={id}
      options={options}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      value={selected}
      onChange={(_, option) => onChange(option?.id ?? "")}
      onBlur={onBlur}
      loading={loading}
      disabled={disabled}
      noOptionsText="Nenhum resultado"
      loadingText="Carregando…"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : null}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
