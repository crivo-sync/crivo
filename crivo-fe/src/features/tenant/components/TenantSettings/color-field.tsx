"use client";

import { useId, useRef, useState } from "react";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputAdornment from "@mui/material/InputAdornment";
import Popover from "@mui/material/Popover";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { HEX_COLOR_RE } from "../../hex-color";

/** Fallback para o `<input type="color">`, que não aceita valor vazio. */
const FALLBACK_COLOR = "#000000";

/** Presets alinhados à identidade padrão do produto. */
const PRESETS = [
  "#4F46E5",
  "#22D3EE",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#111827",
  "#6B7280",
] as const;

/** `#abc` -> `#aabbcc`; qualquer outro valor volta como veio. */
const expandShorthand = (hex: string) =>
  hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;

type ColorFieldProps = Omit<TextFieldProps, "slotProps"> & { value: string };

/**
 * TextField de cor com swatch clicável: abre um popover com o seletor nativo
 * (`<input type="color">`) e alguns presets. O input de texto continua
 * editável para quem cola o hex exato da marca.
 */
export const ColorField = ({
  value,
  onChange,
  disabled,
  ...props
}: ColorFieldProps) => {
  const isValidHex = HEX_COLOR_RE.test(value);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const popoverId = useId();

  // `<input type="color">` só aceita `#rrggbb` — encurtado ou vazio quebra.
  const nativeValue = isValidHex ? expandShorthand(value) : FALLBACK_COLOR;

  /**
   * O seletor nativo sempre emite minúsculo (`#4f46e5`). Se a cor escolhida
   * for a mesma que já está salva em maiúsculo, preservamos o texto original
   * para o react-hook-form não marcar o form como sujo à toa.
   */
  const emit = (next: string) => {
    const preserved =
      next.toLowerCase() === expandShorthand(value).toLowerCase() ? value : next;

    onChange?.({
      target: { value: preserved, name: props.name },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Sem guarda de `disabled`: o `ButtonBase` que chama isto já recebe
  // `disabled`, e um ButtonBase desabilitado não dispara `onClick`.
  const openPicker = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const swatch = (
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        bgcolor: isValidHex ? value : "transparent",
        border: "1px solid",
        borderColor: "divider",
        flexShrink: 0,
        // Xadrez discreto quando não há cor válida, para o alvo de clique
        // não ficar invisível.
        backgroundImage: isValidHex
          ? undefined
          : "linear-gradient(45deg, rgba(0,0,0,.12) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.12) 75%)",
        backgroundSize: "8px 8px",
      }}
    />
  );

  return (
    <>
      <TextField
        {...props}
        value={value}
        onChange={onChange}
        disabled={disabled}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={disabled ? "" : "Escolher cor"}>
                  <Box component="span">
                    <ButtonBase
                      onClick={openPicker}
                      disabled={disabled}
                      aria-label="Escolher cor"
                      aria-haspopup="dialog"
                      aria-controls={anchorEl ? popoverId : undefined}
                      aria-expanded={anchorEl ? true : undefined}
                      sx={{
                        borderRadius: "50%",
                        p: 0.25,
                        "&.Mui-disabled": { opacity: 0.5 },
                      }}
                    >
                      {swatch}
                    </ButtonBase>
                  </Box>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
      />

      <Popover
        id={popoverId}
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { p: 2, width: 232 } } }}
      >
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 1 }}
        >
          Sugestões
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 1,
            mb: 2,
          }}
        >
          {PRESETS.map((preset) => (
            <ButtonBase
              key={preset}
              onClick={() => {
                emit(preset);
                setAnchorEl(null);
              }}
              aria-label={preset}
              title={preset}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: preset,
                border: "2px solid",
                borderColor:
                  expandShorthand(value).toLowerCase() === preset.toLowerCase()
                    ? "text.primary"
                    : "divider",
              }}
            />
          ))}
        </Box>

        <ButtonBase
          onClick={() => nativeInputRef.current?.click()}
          sx={{
            width: "100%",
            gap: 1,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            justifyContent: "flex-start",
          }}
        >
          {swatch}
          <Typography variant="body2">Cor personalizada…</Typography>
        </ButtonBase>

        {/* O seletor nativo do SO. Fica fora de tela em vez de
            `display:none` para continuar clicável/programável. */}
        <Box
          component="input"
          type="color"
          ref={nativeInputRef}
          id={props.id ? `${props.id}-picker` : undefined}
          aria-label="Seletor de cor"
          value={nativeValue}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            emit(event.target.value)
          }
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </Popover>
    </>
  );
};
