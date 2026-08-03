"use client";

import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import { STATUS_COLORS, STATUS_LABELS } from "@/features/appointments/status";
import type { Appointment } from "@/features/appointments/types";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type AppointmentsListProps = {
  appointments: Appointment[];
  emptyMessage: string;
};

export const AppointmentsList = ({
  appointments,
  emptyMessage,
}: AppointmentsListProps) => {
  if (appointments.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <List disablePadding>
      {appointments.map((appointment) => (
        <ListItem
          key={appointment.id}
          disableGutters
          divider
          secondaryAction={
            <Chip
              size="small"
              label={STATUS_LABELS[appointment.status]}
              color={STATUS_COLORS[appointment.status]}
              variant={appointment.status === "SCHEDULED" ? "outlined" : "filled"}
            />
          }
        >
          <ListItemText
            primary={appointment.patient.name}
            secondary={`${timeFormatter.format(new Date(appointment.startsAt))} · ${appointment.professional.name} · ${appointment.procedure.name}`}
          />
        </ListItem>
      ))}
    </List>
  );
};
