"use client";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

import { formatPhone } from "@/lib/br-masks";
import { useMarkWaitlistOffered } from "../../hooks/use-waitlist";
import { useSlotCandidates } from "../../hooks/use-slot-candidates";

type SlotCandidatesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Agendamento que acabou de ser cancelado — a vaga que abriu. */
  appointmentId?: string;
};

/**
 * Aparece logo após um cancelamento, sugerindo quem da fila serve para a vaga.
 *
 * Existe porque a lista de espera só vale se alguém lembrar dela: antes disto,
 * a recepção precisava abrir outra tela e cruzar procedimento e horário na
 * mão — na prática, a vaga cancelada evaporava.
 */
export const SlotCandidatesDialog = ({
  open,
  onOpenChange,
  appointmentId,
}: SlotCandidatesDialogProps) => {
  const { candidates, slot, isLoading } = useSlotCandidates(appointmentId);
  const markOffered = useMarkWaitlistOffered();

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Abriu uma vaga</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {slot
            ? `${dayjs(slot.startsAt).format("DD/MM [às] HH:mm")} — quem da lista de espera pode ser avisado:`
            : "Verificando quem da lista de espera pode ocupar este horário…"}
        </DialogContentText>

        {isLoading ? (
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={80} />
          </Stack>
        ) : candidates.length === 0 ? (
          <Alert severity="info">
            Ninguém na lista de espera serve para esta vaga — pode ser o
            procedimento, o profissional ou a data que não batem.
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {candidates.map((candidate, index) => (
              <Card key={candidate.id} variant="outlined" sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      {/* A posição na fila é o que justifica a ordem — sem
                          ela, a lista parece arbitrária. */}
                      <Chip size="small" label={`${index + 1}º`} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {candidate.patient.name}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mt: 0.5 }}
                    >
                      {formatPhone(candidate.patient.phone)} · na fila desde{" "}
                      {dayjs(candidate.createdAt).format("DD/MM")}
                    </Typography>
                    {candidate.notes && (
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", display: "block" }}
                      >
                        {candidate.notes}
                      </Typography>
                    )}
                  </Box>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CampaignOutlinedIcon />}
                    disabled={markOffered.isPending}
                    onClick={() =>
                      markOffered.mutate({
                        id: candidate.id,
                        appointmentId,
                      })
                    }
                  >
                    Avisar
                  </Button>
                </Box>
              </Card>
            ))}
          </Stack>
        )}

        {candidates.length > 1 && (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: 2 }}
          >
            Pode avisar mais de um — a vaga fica para quem responder primeiro.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
