"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import type { Professional } from "../../types";
import { TimeOffList } from "./time-off-list";
import { WeeklyGrid } from "./weekly-grid";

type ScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: Professional;
};

type TabValue = "grid" | "timeOff";

/**
 * Fica fora do formulário de cadastro de propósito: a grade semanal é uma
 * tela inteira por si só, e misturar com nome/telefone deixaria o cadastro
 * simples de um profissional pesado sem necessidade.
 */
export const ScheduleDialog = ({
  open,
  onOpenChange,
  professional,
}: ScheduleDialogProps) => {
  const [tab, setTab] = useState<TabValue>("grid");

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} fullWidth maxWidth="sm">
      <DialogTitle>Horários — {professional.name}</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          A agenda só oferece horários em que o profissional atende e que não
          estejam bloqueados.
        </DialogContentText>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tab} onChange={(_, value: TabValue) => setTab(value)}>
            <Tab label="Grade semanal" value="grid" />
            <Tab label="Bloqueios" value="timeOff" />
          </Tabs>
        </Box>

        {tab === "grid" && <WeeklyGrid professionalId={professional.id} />}
        {tab === "timeOff" && <TimeOffList professionalId={professional.id} />}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button type="button" color="inherit" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
