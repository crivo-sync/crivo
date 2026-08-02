import type { Metadata } from "next";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

export const metadata: Metadata = {
  title: "Painel — Crivo",
};

const DashboardPage = () => {
  return (
    <Card variant="outlined" sx={{ p: 4 }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Esqueleto do painel. As features (Agenda, Pacientes, Predição,
        Mensageria…) entram aqui seguindo a arquitetura descrita em{" "}
        <Typography
          component="code"
          sx={{ fontFamily: "monospace", color: "text.primary" }}
        >
          docs/SKILLS.md
        </Typography>
        .
      </Typography>
    </Card>
  );
};

export default DashboardPage;
