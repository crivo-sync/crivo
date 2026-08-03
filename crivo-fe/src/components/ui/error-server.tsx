import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

type ErrorServerProps = {
  message: string;
  onRetry: () => void;
};

/**
 * Estado de erro padrão para toda feature que busca dados via Server Action:
 * antes de existir, cada `*Management`/`*Page` repetia o mesmo bloco
 * (Alert + botão "Tentar novamente") — 11 cópias idênticas espalhadas.
 */
export const ErrorServer = ({ message, onRetry }: ErrorServerProps) => {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Tentar novamente
        </Button>
      }
    >
      {message}
    </Alert>
  );
};
