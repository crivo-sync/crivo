"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { ErrorServer } from "@/components/ui/error-server";

import { useSession } from "@/components/providers/session-provider";
import { useUsers } from "../../hooks/use-users";
import type { User } from "../../types";
import { UsersTable } from "../UsersTable";
import { UserFormDialog } from "../UserFormDialog";
import { ToggleUserActiveDialog } from "../ToggleUserActiveDialog";

export const UserManagement = () => {
  const session = useSession();
  const { users, isLoading, error, refetch } = useUsers();

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [togglingUser, setTogglingUser] = useState<User | undefined>();

  const openCreateForm = () => {
    setEditingUser(undefined);
    setFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
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
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateForm}>
          Novo usuário
        </Button>
      </Box>

      <UsersTable
        users={users}
        currentUserId={session.userId}
        loading={isLoading}
        onEdit={openEditForm}
        onToggleActive={setTogglingUser}
      />

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />

      <ToggleUserActiveDialog
        open={!!togglingUser}
        onOpenChange={(open) => !open && setTogglingUser(undefined)}
        user={togglingUser}
      />
    </Paper>
  );
};
