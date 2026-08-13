"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * Cinco critérios, uma barra para cada — mesmo medidor do Snap Financial.
 *
 * Mostra o que **falta**, não só uma nota: "senha fraca" sozinho não diz o
 * que fazer, e a pessoa fica tentando variações no escuro.
 */
const CRITERIA: { label: string; test: (value: string) => boolean }[] = [
  { label: "8 caracteres", test: (v) => v.length >= 8 },
  { label: "uma maiúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "uma minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "um número", test: (v) => /[0-9]/.test(v) },
  { label: "um símbolo", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const LABELS = ["", "Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];

/** Cor por pontuação. Índice 0 nunca é usado (barra vazia). */
const COLORS = [
  "transparent",
  "error.main",
  "warning.main",
  "warning.light",
  "success.light",
  "success.main",
];

export function passwordScore(password: string): number {
  return CRITERIA.filter((c) => c.test(password)).length;
}

export const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;

  const score = passwordScore(password);
  const missing = CRITERIA.filter((c) => !c.test(password)).map((c) => c.label);

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box
            key={i}
            sx={{
              height: 4,
              flex: 1,
              borderRadius: 999,
              transition: "background-color 300ms",
              bgcolor: i <= score ? COLORS[score] : "action.disabledBackground",
            }}
          />
        ))}
      </Box>

      <Typography
        variant="caption"
        sx={{
          mt: 0.75,
          display: "block",
          color:
            score >= 4
              ? "success.main"
              : score >= 3
                ? "warning.main"
                : "text.secondary",
        }}
      >
        {LABELS[score]}
        {missing.length > 0 && ` — falta ${missing.join(", ")}`}
      </Typography>
    </Box>
  );
};
