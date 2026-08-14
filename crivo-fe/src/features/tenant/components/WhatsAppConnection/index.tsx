"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import { ErrorServer } from "@/components/ui/error-server";
import { formatPhone } from "@/lib/br-masks";
import { useWhatsAppConnection } from "../../hooks/use-whatsapp-connection";

/**
 * Conecta o WhatsApp da clínica lendo um QR code.
 *
 * Antes disso, o vínculo era um campo de texto onde a clínica digitava o
 * "nome da instância" — uma pergunta que nenhum dono de clínica sabe
 * responder, e que ainda permitia digitar o nome da instância de outra
 * clínica. Agora o nome é derivado do tenant no backend e nunca aparece aqui.
 */
export const WhatsAppConnection = () => {
  const { connection, isLoading, error, connect, disconnect } =
    useWhatsAppConnection();
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  if (isLoading) return <Skeleton variant="rounded" height={320} />;
  if (error && !connection) {
    return <ErrorServer message={error} onRetry={() => connect.mutate()} />;
  }

  const status = connection?.status ?? "DISCONNECTED";
  const actionError = connect.error?.message ?? disconnect.error?.message;

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", mb: 0.5 }}
        >
          <WhatsAppIcon sx={{ color: "success.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            WhatsApp da clínica
          </Typography>
          <StatusChip status={status} />
        </Stack>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          É deste número que saem os lembretes e as confirmações dos seus
          pacientes.
        </Typography>

        {actionError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {actionError}
          </Alert>
        )}

        {status === "CONNECTED" && (
          <ConnectedState
            phone={connection?.phone ?? null}
            profileName={connection?.profileName ?? null}
            onDisconnect={() => setConfirmingDisconnect(true)}
            isDisconnecting={disconnect.isPending}
          />
        )}

        {status === "CONNECTING" && (
          <PairingState
            qrCode={connection?.qrCode ?? null}
            onRegenerate={() => connect.mutate()}
            isRegenerating={connect.isPending}
          />
        )}

        {status === "DISCONNECTED" && (
          <DisconnectedState
            onConnect={() => connect.mutate()}
            isConnecting={connect.isPending}
          />
        )}
      </CardContent>

      <Dialog
        open={confirmingDisconnect}
        onClose={() => setConfirmingDisconnect(false)}
      >
        <DialogTitle>Desconectar o WhatsApp?</DialogTitle>
        <DialogContent>
          {/* A consequência é grande e invisível: a clínica não descobriria
              que parou de avisar os pacientes até alguém faltar. */}
          <DialogContentText>
            Enquanto estiver desconectado, seus pacientes deixam de receber
            lembretes e confirmações. Os agendamentos continuam na agenda
            normalmente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmingDisconnect(false)}>
            Manter conectado
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              disconnect.mutate();
              setConfirmingDisconnect(false);
            }}
          >
            Desconectar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

const StatusChip = ({ status }: { status: string }) => {
  if (status === "CONNECTED") {
    return <Chip label="Conectado" color="success" size="small" />;
  }
  if (status === "CONNECTING") {
    return <Chip label="Aguardando leitura" color="warning" size="small" />;
  }
  return <Chip label="Desconectado" size="small" />;
};

const ConnectedState = ({
  phone,
  profileName,
  onDisconnect,
  isDisconnecting,
}: {
  phone: string | null;
  profileName: string | null;
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) => (
  <Stack spacing={2.5}>
    <Alert severity="success" icon={<WhatsAppIcon fontSize="inherit" />}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {/* Mostrar o número é o que permite à clínica conferir que pareou o
            telefone certo — "Conectado" sozinho não prova nada. */}
        {phone ? formatWhatsAppPhone(phone) : "Número conectado"}
      </Typography>
      {profileName && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {profileName}
        </Typography>
      )}
    </Alert>

    <Box>
      <Button
        variant="outlined"
        color="error"
        onClick={onDisconnect}
        disabled={isDisconnecting}
      >
        Desconectar
      </Button>
    </Box>
  </Stack>
);

const PairingState = ({
  qrCode,
  onRegenerate,
  isRegenerating,
}: {
  qrCode: string | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) => (
  <Stack spacing={2.5} sx={{ alignItems: "center" }}>
    {qrCode ? (
      <Box
        component="img"
        src={qrCode}
        alt="QR code para conectar o WhatsApp"
        sx={{
          width: 260,
          height: 260,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          bgcolor: "#fff",
          p: 1,
        }}
      />
    ) : (
      /* O QR expira em segundos: sem código na mão, a saída é gerar outro,
         não deixar um quadrado vazio na tela. */
      <Stack
        spacing={2}
        sx={{ alignItems: "center", py: 4, textAlign: "center" }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          O código expirou.
        </Typography>
        <Button
          variant="contained"
          onClick={onRegenerate}
          disabled={isRegenerating}
        >
          Gerar novo código
        </Button>
      </Stack>
    )}

    {qrCode && (
      <>
        <Box sx={{ maxWidth: 380 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Como conectar:
          </Typography>
          {/* `listStyle` explícito: o reset global tira os marcadores, e três
              passos sem número perdem justamente a ordem que importa. */}
          <Typography
            variant="body2"
            component="ol"
            sx={{
              color: "text.secondary",
              pl: 2.5,
              m: 0,
              listStyle: "decimal",
              "& li": { mb: 0.5 },
            }}
          >
            <li>Abra o WhatsApp no celular da clínica</li>
            <li>
              Toque em <strong>Configurações</strong> →{" "}
              <strong>Dispositivos conectados</strong>
            </li>
            <li>
              Toque em <strong>Conectar dispositivo</strong> e aponte para o
              código acima
            </li>
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", color: "text.secondary" }}
        >
          <CircularProgress size={14} />
          <Typography variant="caption">
            Esperando a leitura — esta tela avisa sozinha quando conectar.
          </Typography>
        </Stack>

        <Button size="small" onClick={onRegenerate} disabled={isRegenerating}>
          Gerar novo código
        </Button>
      </>
    )}
  </Stack>
);

const DisconnectedState = ({
  onConnect,
  isConnecting,
}: {
  onConnect: () => void;
  isConnecting: boolean;
}) => (
  <Stack spacing={2.5}>
    <Alert severity="warning">
      Sem um WhatsApp conectado, seus pacientes não recebem lembrete nem
      conseguem confirmar presença.
    </Alert>

    <Box>
      <Button
        variant="contained"
        startIcon={<WhatsAppIcon />}
        onClick={onConnect}
        disabled={isConnecting}
      >
        {isConnecting ? "Gerando código…" : "Conectar WhatsApp"}
      </Button>
    </Box>
  </Stack>
);

/**
 * A Evolution devolve o número com DDI (`5511952861726`); `formatPhone`
 * espera só DDD + número.
 */
function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withoutCountry =
    digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;

  return formatPhone(withoutCountry);
}
