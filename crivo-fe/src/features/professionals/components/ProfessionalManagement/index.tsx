"use client";

import { useState } from "react";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { ErrorServer } from "@/components/ui/error-server";

import { useIsAdmin } from "@/components/providers/session-provider";
import { useProfessionalsFiltersState } from "../../hooks/use-professionals-filters-state";
import { useProfessionals } from "../../hooks/use-professionals";
import { useOverLimitStatus } from "../../hooks/use-over-limit";
import type { Professional } from "../../types";
import { ProfessionalFilters } from "../ProfessionalFilters";
import { ProfessionalsTable } from "../ProfessionalsTable";
import { ScheduleDialog } from "../ScheduleDialog";
import { ProfessionalFormDialog } from "../ProfessionalFormDialog";
import { DeleteProfessionalDialog } from "../DeleteProfessionalDialog";
import { OverLimitDialog } from "../OverLimitDialog";

export const ProfessionalManagement = () => {
  // Só ADMIN cria/edita/remove (o crivo-be exige @Roles(ADMIN) nessas rotas).
  // Aqui é decisão de UI; a barreira real está nas Server Actions e na API.
  const canManage = useIsAdmin();

  const { control, page, perPage, urlSearch, updateParams, clearFilters } =
    useProfessionalsFiltersState();
  const { professionals, meta, isLoading, error, refetch } = useProfessionals({
    page,
    perPage,
    search: urlSearch || undefined,
  });

  /**
   * O excedente vem do backend, não de uma conta local com `meta.total`.
   * A contagem da listagem é paginada e filtrada pela busca — comparar ela
   * com o teto do plano dava número errado sempre que alguém digitava algo
   * no filtro. Aqui a resposta é uma só, e é a mesma que o cadastro usa.
   */
  const { status: overLimit } = useOverLimitStatus();

  const [overLimitOpen, setOverLimitOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<
    Professional | undefined
  >();
  const [deletingProfessional, setDeletingProfessional] = useState<
    Professional | undefined
  >();
  const [schedulingProfessional, setSchedulingProfessional] = useState<
    Professional | undefined
  >();

  const openCreateForm = () => {
    setEditingProfessional(undefined);
    setFormOpen(true);
  };

  const openEditForm = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormOpen(true);
  };

  if (error) {
    return (
      <ErrorServer message={error.message} onRetry={() => refetch()} />
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
    >
      {/**
       * Acontece quando a clínica testou o produto com a equipe inteira e
       * depois assinou um plano menor — caminho legítimo, não erro dela: o
       * trial libera até o teto do maior plano.
       *
       * O alerta **oferece a ação** em vez de só descrever o problema. Antes
       * ele dizia "desative N profissionais" e deixava a clínica procurar
       * como; agora abre a tela de escolha, que é onde isso de fato se
       * resolve. Ninguém é desativado sem ela escolher — ver
       * `ResolveOverLimitUseCase`.
       */}
      {canManage && overLimit?.overLimit && (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setOverLimitOpen(true)}
            >
              Escolher quem fica
            </Button>
          }
        >
          Sua clínica tem {overLimit.activeCount} profissionais ativos, e o
          plano {overLimit.planName ?? "atual"} inclui{" "}
          {overLimit.maxProfessionals}. Escolha quem continua atendendo ou{" "}
          <Link href="/painel/configuracoes?tab=subscription">
            faça upgrade em Configurações → Assinatura
          </Link>
          .
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <ProfessionalFilters control={control} onClear={clearFilters} />
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateForm}
          >
            Novo profissional
          </Button>
        )}
      </Box>

      <ProfessionalsTable
        professionals={professionals}
        meta={meta}
        loading={isLoading}
        canManage={canManage}
        onEdit={openEditForm}
        onDelete={setDeletingProfessional}
        onManageSchedule={setSchedulingProfessional}
        onUpdateParams={updateParams}
      />

      {canManage && (
        <>
          {/* A `key` remonta o dialog a cada abertura, zerando o rascunho da
              grade sem um efeito de limpeza — que o React Compiler acusa
              como render em cascata. */}
          <ProfessionalFormDialog
            key={`${editingProfessional?.id ?? "new"}-${formOpen}`}
            open={formOpen}
            onOpenChange={setFormOpen}
            professional={editingProfessional}
          />

          <DeleteProfessionalDialog
            open={!!deletingProfessional}
            onOpenChange={(open) => !open && setDeletingProfessional(undefined)}
            professional={deletingProfessional}
          />

          {/* Montado só quando aberto: carrega grade e bloqueios do
              profissional, requisições que não fazem sentido na listagem. */}
          {schedulingProfessional && (
            <ScheduleDialog
              open
              onOpenChange={(open) =>
                !open && setSchedulingProfessional(undefined)
              }
              professional={schedulingProfessional}
            />
          )}

          {/* Também só quando aberto: busca a equipe inteira (sem paginação),
              requisição que não faz sentido antes de a clínica abrir. */}
          {overLimitOpen && overLimit?.overLimit && (
            <OverLimitDialog
              open
              onOpenChange={setOverLimitOpen}
              status={overLimit}
            />
          )}
        </>
      )}
    </Paper>
  );
};
