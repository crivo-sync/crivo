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
import type { MessageStatus } from "../../types";

type MessageFiltersProps = {
  status: MessageStatus | "";
  from: string;
  to: string;
  onChange: (updates: Record<string, string | null>) => void;
  onClear: () => void;
};

export const MessageFilters = ({
  status,
  from,
  to,
  onChange,
  onClear,
}: MessageFiltersProps) => {
  const hasFilters = !!status || !!from || !!to;

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
    // Grid, não flex: o tema define `fullWidth` como padrão do TextField, e
    // com flex isso vence o `minWidth` — cada campo esticava para 100% e a
    // barra virava uma coluna de filtros empilhados. O grid dá a cada um a
    // sua coluna e deixa o `fullWidth` preencher só ela.
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(3, minmax(0, 1fr)) auto",
        },
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <TextField
        select
        label="Status"
        value={status}
        onChange={(event) =>
          onChange({ status: event.target.value || null, page: "1" })
        }
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
      />

      <DatePicker
        label="Até"
        value={to ? dayjs(to) : null}
        onChange={handleDateChange("to")}
        minDate={from ? dayjs(from) : undefined}
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
