"use client";

import Box from "@mui/material/Box";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

type ColorFieldProps = Omit<TextFieldProps, "slotProps"> & { value: string };

/** TextField com um preview circular da cor no fim do input, quando o hex é válido. */
export const ColorField = ({ value, ...props }: ColorFieldProps) => {
  const isValidHex = HEX_COLOR_RE.test(value);

  return (
    <TextField
      {...props}
      value={value}
      slotProps={{
        input: {
          endAdornment: isValidHex ? (
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                bgcolor: value,
                border: "1px solid",
                borderColor: "divider",
                flexShrink: 0,
              }}
            />
          ) : undefined,
        },
      }}
    />
  );
};
