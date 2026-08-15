"use client";

import { useTransition } from "react";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { logoutAction } from "@/features/auth/actions/logout-action";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { getInitials } from "@/lib/initials";

type UserMenuProps = {
  displayName: string;
  /** Drawer expandido: mostra nome + botão. Colapsado: só o avatar clicável. */
  open: boolean;
};

export const UserMenu = ({ displayName, open }: UserMenuProps) => {
  const { profile } = useProfile();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      // Navegação de página completa — mesmo motivo de `top-bar-user-menu.tsx`.
      window.location.assign("/login");
    });
  };

  if (!open) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 1.5 }}>
        <Tooltip title={`${displayName} — sair`} placement="right">
          <span>
            <IconButton
              onClick={handleLogout}
              disabled={isPending}
              aria-label="Sair"
            >
              <LogoutOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5 }}>
      <Avatar
        src={profile?.avatarUrl ?? undefined}
        sx={{ width: 36, height: 36, fontSize: 13 }}
      >
        {getInitials(displayName)}
      </Avatar>

      <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
        {displayName}
      </Typography>

      <Tooltip title="Sair">
        <span>
          <IconButton
            onClick={handleLogout}
            disabled={isPending}
            aria-label="Sair"
            size="small"
          >
            <LogoutOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};
