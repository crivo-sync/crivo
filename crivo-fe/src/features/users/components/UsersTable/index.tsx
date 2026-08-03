"use client";

import { useMemo } from "react";

import { AppDataGrid } from "@/components/data-grid";
import type { User } from "../../types";
import { buildUserColumns } from "./columns";

type UsersTableProps = {
  users: User[];
  currentUserId: string;
  loading?: boolean;
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
};

export const UsersTable = ({
  users,
  currentUserId,
  loading,
  onEdit,
  onToggleActive,
}: UsersTableProps) => {
  const columns = useMemo(
    () => buildUserColumns({ currentUserId, onEdit, onToggleActive }),
    [currentUserId, onEdit, onToggleActive],
  );

  // Sem paginação server-side: GET /users devolve a lista inteira da
  // clínica de uma vez (não é um dado que cresce sem limite, diferente de
  // pacientes/agendamentos).
  return <AppDataGrid rows={users} columns={columns} loading={loading} hideFooter />;
};
