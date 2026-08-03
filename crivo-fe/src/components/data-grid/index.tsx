"use client";

import { DataGrid, type DataGridProps, type GridValidRowModel } from "@mui/x-data-grid";

export type DataGridPaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

type AppDataGridProps<TRow extends GridValidRowModel> = Omit<
  DataGridProps<TRow>,
  | "paginationModel"
  | "onPaginationModelChange"
  | "rowCount"
  | "paginationMode"
  | "pagination"
> & {
  /**
   * Metadados vindos da API (paginação sempre server-side).
   * Nome distinto de `pagination` de propósito: aquela é a prop booleana
   * nativa do DataGrid e colidiria com este objeto.
   */
  paginationMeta?: DataGridPaginationMeta;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
};

/**
 * Wrapper genérico do MUI X DataGrid: amarra a paginação server-side da
 * nossa API ao modelo do componente e fixa os padrões que toda tabela do
 * painel deve ter (sem menu de coluna, sem seleção por clique acidental).
 * Sem estilos customizados — o visual é o padrão do Material UI.
 *
 * Nenhuma lógica de domínio aqui — cada feature passa suas próprias
 * `columns` e `rows`. Qualquer prop nativa do DataGrid (`density`,
 * `autoHeight`, `getRowId`, `slots`, `slotProps`, `sx`, `initialState`,
 * `sortingMode`, `filterMode`, `getRowClassName`, etc.) pode ser passada
 * normalmente — o spread cobre a superfície completa do componente.
 *
 * `checkboxSelection` fica de fora por padrão: só faz sentido quando a
 * feature de fato consome a seleção (ação em lote, ou travar a exclusão da
 * própria conta em telas como Usuários). Passe explicitamente via props
 * quando houver essa necessidade real.
 *
 * `disableColumnMenu` vem `true` por padrão: o menu de "⋮" no cabeçalho
 * (ordenar/filtrar/ocultar/gerir colunas) não faz parte do design atual do
 * painel. Passe `disableColumnMenu={false}` explicitamente numa feature que
 * realmente precise dessas ações.
 */
export function AppDataGrid<TRow extends GridValidRowModel>({
  paginationMeta,
  onPageChange,
  onPerPageChange,
  disableColumnMenu = true,
  disableRowSelectionOnClick = true,
  ...props
}: AppDataGridProps<TRow>) {
  return (
    <DataGrid
      {...props}
      disableColumnMenu={disableColumnMenu}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      paginationMode="server"
      rowCount={paginationMeta?.total ?? 0}
      pageSizeOptions={[10, 20, 50, 100]}
      paginationModel={{
        // DataGrid é 0-indexed; a API do crivo-be é 1-indexed.
        page: (paginationMeta?.page ?? 1) - 1,
        pageSize: paginationMeta?.perPage ?? 10,
      }}
      onPaginationModelChange={(model) => {
        if (model.pageSize !== paginationMeta?.perPage) {
          onPerPageChange?.(model.pageSize);
          return;
        }
        onPageChange?.(model.page + 1);
      }}
    />
  );
}
