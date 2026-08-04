"use client";

import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

/** Índice = valor de `Date.getDay()` (0 = domingo … 6 = sábado). */
const WEEKDAYS = [
  { value: 0, short: "D", label: "Domingo" },
  { value: 1, short: "S", label: "Segunda-feira" },
  { value: 2, short: "T", label: "Terça-feira" },
  { value: 3, short: "Q", label: "Quarta-feira" },
  { value: 4, short: "Q", label: "Quinta-feira" },
  { value: 5, short: "S", label: "Sexta-feira" },
  { value: 6, short: "S", label: "Sábado" },
] as const;

type BusinessDaysFieldProps = {
  value: number[];
  onChange: (value: number[]) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

/**
 * Linha de 7 toggles para os dias de funcionamento. O valor sai sempre
 * ordenado para o diff do react-hook-form não marcar o form como sujo só
 * porque a ordem de clique mudou.
 */
export const BusinessDaysField = ({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  helperText,
}: BusinessDaysFieldProps) => {
  return (
    <Box>
      <Typography
        variant="body2"
        component="span"
        id="businessDays-label"
        sx={{ color: "text.secondary", display: "block", mb: 1 }}
      >
        Dias de funcionamento
      </Typography>

      <ToggleButtonGroup
        value={value}
        onChange={(_event, next: number[]) => onChange([...next].sort())}
        onBlur={onBlur}
        disabled={disabled}
        aria-labelledby="businessDays-label"
        size="small"
        sx={{ flexWrap: "wrap" }}
      >
        {WEEKDAYS.map((day) => (
          <ToggleButton
            key={day.value}
            value={day.value}
            aria-label={day.label}
            title={day.label}
            sx={{ width: 44 }}
          >
            {day.short}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {helperText && (
        <FormHelperText error={error} sx={{ mx: 1.75 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};
