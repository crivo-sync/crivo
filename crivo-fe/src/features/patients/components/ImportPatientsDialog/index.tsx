"use client";

import { useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import { formatCpf, formatPhone } from "@/lib/br-masks";
import { CSV_ACCEPT_ATTRIBUTE, validateCsvFile } from "@/lib/csv-upload";
import { useSnackbar } from "@/components/providers/snackbar-provider";
import { useImportPatients } from "../../hooks/use-import-patients";
import type { ImportResult } from "../../types";
import { IssueList } from "./issue-list";

type ImportPatientsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Importação em duas etapas: o arquivo é primeiro analisado (`dryRun`) e só
 * grava depois que a pessoa confere a prévia.
 *
 * O passo extra existe porque o modo de falhar da importação é silencioso —
 * uma coluna trocada não dá erro, gera 400 cadastros errados. Ver a primeira
 * linha já mapeada em "Nome / Telefone / CPF" é o que denuncia isso antes de
 * virar problema.
 */
export const ImportPatientsDialog = ({
  open,
  onOpenChange,
}: ImportPatientsDialogProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImportResult | null>(null);
  const [done, setDone] = useState<ImportResult | null>(null);

  const importPatients = useImportPatients();
  const snackbar = useSnackbar();

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setDone(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const handlePick = async (picked: File) => {
    const invalid = validateCsvFile(picked);
    if (invalid) {
      snackbar.showError(invalid);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFile(picked);
    setAnalysis(null);
    setDone(null);

    try {
      const result = await importPatients.mutateAsync({
        file: picked,
        dryRun: true,
      });
      setAnalysis(result);
    } catch {
      // Mensagem já exibida pelo snackbar; o arquivo fica selecionado para a
      // pessoa corrigir e tentar de novo.
    }
  };

  const handleConfirm = async () => {
    if (!file) return;

    try {
      const result = await importPatients.mutateAsync({ file, dryRun: false });
      setDone(result);
    } catch {
      // idem
    }
  };

  const isBusy = importPatients.isPending;

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth>
      <DialogTitle>Importar pacientes</DialogTitle>

      <DialogContent dividers>
        {done ? (
          <Alert severity="success">
            <AlertTitle>Importação concluída</AlertTitle>
            {done.created === 1
              ? "1 paciente foi adicionado à sua base."
              : `${done.created} pacientes foram adicionados à sua base.`}
          </Alert>
        ) : (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Envie um arquivo <strong>.csv</strong> com uma linha por
                paciente. São obrigatórias as colunas <strong>nome</strong> e{" "}
                <strong>telefone</strong>; <strong>cpf</strong> e{" "}
                <strong>email</strong> entram se existirem.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Não precisa formatar nada: acentos, <code>(11) 98765-4321</code>{" "}
                e <code>111.222.333-44</code> são entendidos. Nada é gravado
                até você confirmar.
              </Typography>
            </Box>

            <Box>
              <input
                ref={inputRef}
                type="file"
                accept={CSV_ACCEPT_ATTRIBUTE}
                hidden
                onChange={(event) => {
                  const picked = event.target.files?.[0];
                  if (picked) void handlePick(picked);
                }}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => inputRef.current?.click()}
                disabled={isBusy}
              >
                {file ? "Trocar arquivo" : "Escolher arquivo"}
              </Button>
              {file && (
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ ml: 2 }}
                  color="text.secondary"
                >
                  {file.name}
                </Typography>
              )}
            </Box>

            {isBusy && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Analisando o arquivo…</Typography>
              </Stack>
            )}

            {analysis && !isBusy && (
              <>
                <Divider />

                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Chip
                    label={`${analysis.totalRows} linhas no arquivo`}
                    size="small"
                  />
                  <Chip
                    label={`${analysis.created} a importar`}
                    color="success"
                    size="small"
                  />
                  {analysis.duplicates.length > 0 && (
                    <Chip
                      label={`${analysis.duplicates.length} já cadastrados`}
                      color="warning"
                      size="small"
                    />
                  )}
                  {analysis.errors.length > 0 && (
                    <Chip
                      label={`${analysis.errors.length} com erro`}
                      color="error"
                      size="small"
                    />
                  )}
                </Stack>

                {analysis.created === 0 ? (
                  <Alert severity="info">
                    Nenhum paciente novo neste arquivo. Confira a lista abaixo:
                    ou já estão cadastrados, ou as linhas têm algum problema.
                  </Alert>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Confira se as colunas foram entendidas
                      {analysis.created > analysis.preview.length &&
                        ` (primeiros ${analysis.preview.length} de ${analysis.created})`}
                    </Typography>
                    <TableContainer sx={{ maxHeight: 260 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Nome</TableCell>
                            <TableCell>Telefone</TableCell>
                            <TableCell>CPF</TableCell>
                            <TableCell>E-mail</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analysis.preview.map((row) => (
                            <TableRow key={`${row.phone}-${row.name}`}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{formatPhone(row.phone)}</TableCell>
                              <TableCell>
                                {row.cpf ? formatCpf(row.cpf) : "—"}
                              </TableCell>
                              <TableCell>{row.email ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                <IssueList
                  title="Já cadastrados — serão ignorados"
                  issues={analysis.duplicates}
                  severity="warning"
                />
                <IssueList
                  title="Linhas com erro — não serão importadas"
                  issues={analysis.errors}
                  severity="error"
                />
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={close} disabled={isBusy}>
          {done ? "Fechar" : "Cancelar"}
        </Button>
        {!done && (
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={isBusy || !analysis || analysis.created === 0}
          >
            {analysis && analysis.created > 0
              ? `Importar ${analysis.created}`
              : "Importar"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
