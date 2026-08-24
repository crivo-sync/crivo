import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { UserManagement } from "@/features/users/components/UserManagement";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Usuários — Crivo Sync",
};

/**
 * Primeira tela do painel bloqueada por PÁGINA inteira, não só por ação.
 * O backend exige ADMIN até para listar (`GET /users` tem `@Roles(ADMIN)`
 * no controller inteiro), então aqui a leitura também precisa barrar STAFF
 * — diferente de `profissionais`/`procedimentos`, onde o GET é aberto e só
 * as ações de escrita somem. O menu já esconde o item para STAFF
 * (`_data/nav-items.ts`), mas isso é cosmético: sem este redirect, um STAFF
 * que digitasse a URL direto veria a página renderizar (e falhar só na
 * chamada de dados, com uma mensagem genérica de erro).
 */
const UsuariosPage = async () => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/painel");
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Usuários</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Contas com acesso ao painel desta clínica. Restrito a
          administradores.
        </Typography>
      </Box>
      <UserManagement />
    </Stack>
  );
};

export default UsuariosPage;
