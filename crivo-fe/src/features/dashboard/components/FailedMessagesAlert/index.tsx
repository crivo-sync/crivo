"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import { formatPhone } from "@/lib/br-masks";
import type { Message } from "@/features/messages/types";

type FailedMessagesAlertProps = {
  messages: Message[];
};

export const FailedMessagesAlert = ({ messages }: FailedMessagesAlertProps) => {
  if (messages.length === 0) {
    return (
      <Alert severity="success">
        Nenhuma mensagem falhou. Todos os pacientes foram avisados.
      </Alert>
    );
  }

  return (
    <Alert severity="error">
      <AlertTitle>
        {messages.length === 1
          ? "1 mensagem falhou — ligue para o paciente"
          : `${messages.length} mensagens falharam — ligue para os pacientes`}
      </AlertTitle>
      <List disablePadding dense>
        {messages.map((message) => (
          <ListItem key={message.id} disableGutters>
            <ListItemText
              primary={message.appointment?.patient.name ?? "Paciente"}
              secondary={formatPhone(message.toPhone)}
            />
          </ListItem>
        ))}
      </List>
    </Alert>
  );
};
