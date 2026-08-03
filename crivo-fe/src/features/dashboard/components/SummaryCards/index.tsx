"use client";

import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import type { DashboardCounts } from "../../types";

type SummaryCardsProps = {
  counts: DashboardCounts;
};

export const SummaryCards = ({ counts }: SummaryCardsProps) => {
  const items = [
    {
      label: "Agendamentos hoje",
      value: counts.appointmentsToday,
      icon: <EventOutlinedIcon />,
    },
    {
      label: "Pacientes",
      value: counts.patients,
      icon: <PersonOutlineOutlinedIcon />,
    },
    {
      label: "Profissionais ativos",
      value: counts.activeProfessionals,
      icon: <GroupsOutlinedIcon />,
    },
    {
      label: "Procedimentos",
      value: counts.procedures,
      icon: <MedicalServicesOutlinedIcon />,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2,
      }}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          variant="outlined"
          sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              flexShrink: 0,
            }}
          >
            {item.icon}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {item.value}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {item.label}
            </Typography>
          </Box>
        </Card>
      ))}
    </Box>
  );
};
