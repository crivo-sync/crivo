"use client";

import { useLayoutEffect, useRef } from "react";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

import {
  MAX_PRICE_IN_CENTS,
  formatCentsForInput,
  parseInputToCents,
} from "@/lib/currency";

type MoneyFieldProps = Omit<
  TextFieldProps,
  "value" | "onChange" | "type" | "slotProps" | "inputRef"
> & {
  /** Valor em centavos — o mesmo inteiro que o backend guarda. */
  value: number;
  onChange: (cents: number) => void;
  maxCents?: number;
};

/**
 * Campo de dinheiro em centavos. O texto na tela é sempre reconstruído a
 * partir do valor, então não existe estado intermediário inválido: o que o
 * usuário vê é exatamente o que será enviado.
 */
export const MoneyField = ({
  value,
  onChange,
  maxCents = MAX_PRICE_IN_CENTS,
  ...props
}: MoneyFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const text = formatCentsForInput(value);

  // Reformatar a cada tecla move o cursor para um ponto arbitrário. Como os
  // dígitos entram sempre pela direita, devolvê-lo ao fim é o comportamento
  // correto — e evita o usuário digitar no meio de "0,00" sem efeito.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input || document.activeElement !== input) return;
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }, [text]);

  return (
    <TextField
      {...props}
      value={text}
      onChange={(event) =>
        onChange(parseInputToCents(event.target.value, maxCents))
      }
      inputRef={inputRef}
      slotProps={{
        htmlInput: { inputMode: "decimal" },
        input: {
          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
        },
      }}
    />
  );
};
