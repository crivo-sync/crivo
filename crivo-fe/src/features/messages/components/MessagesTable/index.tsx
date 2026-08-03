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
};

export const MessagesTable = ({
  messages,
  meta,
  loading,
  onUpdateParams,
}: MessagesTableProps) => {
  const columns = useMemo(() => buildMessageColumns(), []);

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
