"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { logoutAction } from "@/features/auth/actions/logout-action";
import { getInitials } from "@/lib/initials";

type UserMenuProps = {
  displayName: string;
  /** Drawer expandido: mostra nome + botão. Colapsado: só o avatar clicável. */
  open: boolean;
};

export const UserMenu = ({ displayName, open }: UserMenuProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
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
      <Avatar sx={{ width: 36, height: 36, fontSize: 13 }}>
        {getInitials(displayName)}
      </Avatar>

      <Typography
        variant="body2"
        noWrap
        sx={{ flex: 1, minWidth: 0 }}
      >
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
