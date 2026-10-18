import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Criar conta — Crivo Sync",
};

const RegisterPage = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 3,
        py: 6,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 440 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Link
            href="/"
            aria-label="Crivo Sync — início"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <Logo />
          </Link>
        </Box>

        <Card variant="outlined" sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Crie a conta da sua clínica
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Leva menos de um minuto. Você já entra direto no painel.
          </Typography>
          {/**
           * `Suspense` porque `useRegister` lê `?plano=` com
           * `useSearchParams`, e sem boundary o Next não consegue
           * pré-renderizar esta página (o build falha em
           * `missing-suspense-with-csr-bailout`, e o `tsc` não acusa).
           */}
          <Suspense fallback={<CircularProgress size={24} />}>
            <RegisterForm />
          </Suspense>
        </Card>

        <Typography
          variant="body2"
          sx={{ color: "text.secondary", textAlign: "center", mt: 3 }}
        >
          Já tem conta?{" "}
          <Link href="/login" style={{ fontWeight: 600 }}>
            Entrar
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;
