"use client";

import { useMemo } from "react";

import { AppDataGrid } from "@/components/data-grid";
import type { Message, PaginationMeta } from "../../types";
import { buildMessageColumns } from "./columns";

type MessagesTableProps = {
  messages: Message[];
  meta?: PaginationMeta;
  loading?: boolean;
  onUpdateParams: (updates: Record<string, string | null>) => void;
  /** Só a aba de falhas passa — o histórico não tem ação de reenvio. */
  onResend?: (message: Message) => void;
  /** Abre o corpo completo; vale nas duas abas. */
  onView?: (message: Message) => void;
  resendingId?: string;
};

export const MessagesTable = ({
  messages,
  meta,
  loading,
  onUpdateParams,
  onResend,
  onView,
  resendingId,
}: MessagesTableProps) => {
  const columns = useMemo(
    () => buildMessageColumns({ onResend, onView, resendingId }),
    [onResend, onView, resendingId],
  );

  return (
    <AppDataGrid
      rows={messages}
      columns={columns}
      loading={loading}
      paginationMeta={meta}
      onPageChange={(page) => onUpdateParams({ page: String(page) })}
      onPerPageChange={(perPage) =>
        onUpdateParams({ perPage: String(perPage), page: "1" })
      }
    />
  );
};
