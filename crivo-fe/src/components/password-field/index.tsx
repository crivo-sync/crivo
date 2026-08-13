"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

/**
 * Campo de senha com botão de mostrar/ocultar.
 *
 * `tabIndex={-1}` no botão de propósito: quem navega por teclado espera ir
 * do campo de senha direto para o botão de enviar, não parar num controle
 * que só muda a visualização.
 */
export const PasswordField = ({
  slotProps,
  ...props
}: Omit<TextFieldProps, "type">) => {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((v) => !v)}
                edge="end"
                tabIndex={-1}
                aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                size="small"
              >
                {visible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export { PasswordStrength, passwordScore } from "./password-strength";
