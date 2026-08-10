"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { ErrorServer } from "@/components/ui/error-server";
import {
  useMessageTemplates,
  useSaveMessageTemplate,
} from "../../hooks/use-message-templates";
import type {
  MessageTemplate,
  TemplatePlaceholder,
  TemplateType,
} from "../../types/templates";

const TYPE_LABELS: Record<TemplateType, string> = {
  APPOINTMENT_REMINDER: "Lembrete (véspera da consulta)",
  APPOINTMENT_BOOKED: "Aviso ao marcar a consulta",
};

/** Exemplo para a pré-visualização. Não sai para paciente nenhum. */
const PREVIEW_VALUES: Record<string, string> = {
  paciente: "Ana",
  clinica: "Clínica Sorriso",
  profissional: "Dra. Helena Prado",
  procedimento: "Limpeza dental",
  data: "12/08",
  hora: "14:30",
  link: "https://app.crivo.com.br/c/exemplo",
};

/**
 * Mesma substituição do backend, para a pré-visualização.
 *
 * É duplicação consciente: pedir a prévia ao servidor a cada tecla digitada
 * seria uma requisição por caractere. O contrato (`{{nome}}`) é estável, e a
 * validação de verdade continua no backend, que recusa o que estiver errado.
 */
function renderPreview(body: string): string {
  return body.replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (_, name: string) => PREVIEW_VALUES[name.toLowerCase()] ?? "",
  );
}

type TemplateCardProps = {
  template: MessageTemplate;
  placeholders: TemplatePlaceholder[];
};

const TemplateCard = ({ template, placeholders }: TemplateCardProps) => {
  const save = useSaveMessageTemplate();

  const [body, setBody] = useState(template.body);
  const [isActive, setIsActive] = useState(template.isActive);

  const isDirty = body !== template.body || isActive !== template.isActive;

  /**
   * O que o paciente recebe **agora**: com a personalização desligada, é o
   * texto padrão — não o rascunho que está no editor. Mostrar o rascunho
   * como se fosse o envio real é o erro que esta distinção evita.
   */
  const effectiveBody = isActive ? body : template.defaultBody;

  const handleSave = () => {
    save.mutate({ type: template.type, body, isActive });
  };

  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {TYPE_LABELS[template.type]}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                {isActive ? "Usando meu texto" : "Usando o texto padrão"}
              </Typography>
            }
          />
        </Box>

        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 1 }}
          >
            Toque para inserir no texto:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {placeholders.map((placeholder) => (
              <Tooltip key={placeholder.name} title={placeholder.description}>
                <Chip
                  size="small"
                  label={`{{${placeholder.name}}}`}
                  variant="outlined"
                  // Digitar `{{paciente}}` na mão é a principal fonte de erro
                  // de digitação — e erro de marcador é recusado no salvamento.
                  onClick={() => setBody((current) => `${current}{{${placeholder.name}}}`)}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>

        <TextField
          label="Texto da mensagem"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          multiline
          minRows={8}
          fullWidth
          helperText={`${body.length}/1000 caracteres`}
          error={body.length > 1000}
        />

        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
          >
            {isActive
              ? "Como o paciente vai receber:"
              : "Como o paciente recebe hoje (texto padrão):"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-line",
              p: 1.5,
              borderRadius: 1,
              bgcolor: "action.hover",
              wordBreak: "break-word",
            }}
          >
            {renderPreview(effectiveBody)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isDirty || save.isPending || body.length > 1000}
            startIcon={
              save.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            Salvar
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

/**
 * Textos das mensagens automáticas.
 *
 * Só ADMIN chega aqui — o texto sai em nome da clínica para todos os
 * pacientes, e o backend recusa qualquer outro papel.
 */
export const MessageTemplates = ({ canManage }: { canManage: boolean }) => {
  const { templates, placeholders, isLoading, error, refetch } =
    useMessageTemplates(canManage);

  if (!canManage) {
    return (
      <Alert severity="info">
        Somente administradores podem editar os textos das mensagens.
      </Alert>
    );
  }

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={320} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info" variant="outlined">
        Os trechos entre chaves são preenchidos na hora do envio com os dados
        de cada paciente. A mensagem precisa manter {"{{data}}"}, {"{{hora}}"} e{" "}
        {"{{link}}"} — sem eles o paciente não sabe quando é a consulta nem
        consegue confirmar.
      </Alert>

      {templates.map((template) => (
        <TemplateCard
          // A `key` inclui `updatedAt` para o card remontar depois de salvar:
          // o estado local (`body`, `isActive`) precisa voltar a espelhar o
          // servidor, senão "Salvar" continuaria habilitado com o texto já
          // gravado.
          key={`${template.type}-${template.updatedAt ?? "novo"}`}
          template={template}
          placeholders={placeholders}
        />
      ))}
    </Stack>
  );
};
