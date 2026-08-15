"use client";

import { useState, useTransition, type MouseEvent } from "react";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";

import { useSession, roleLabel } from "@/components/providers/session-provider";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { getInitials } from "@/lib/initials";

/**
 * Dropdown de usuário na AppBar: quem está logado, papel e a clínica atual.
 * Complementa o `UserMenu` da sidebar (que só tem nome + sair) com as
 * informações que hoje não aparecem em lugar nenhum do painel.
 */
export const TopBarUserMenu = () => {
  const session = useSession();
  // Sessão (JWT) não carrega avatar — busca via React Query, invalidada pela
  // própria página de perfil quando a foto troca, então reflete sem reload.
  const { profile } = useProfile();
  const [isPending, startTransition] = useTransition();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = !!anchorEl;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    startTransition(async () => {
      await logoutAction();
      // Navegação de página completa: `router.refresh` pós-logout re-buscava
      // o RSC da página atual com a sessão já removida, e o middleware
      // respondia com um redirect que o router cliente não interpretava.
      window.location.assign("/login");
    });
  };

  const displayName = session.displayName ?? "Minha conta";

  return (
    <>
      <ButtonBase
        onClick={handleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          py: 0.5,
          borderRadius: 2,
        }}
        aria-controls={open ? "top-bar-user-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar
          src={profile?.avatarUrl ?? undefined}
          sx={{ width: 32, height: 32, fontSize: 13 }}
        >
          {getInitials(displayName)}
        </Avatar>
        <Box sx={{ textAlign: "left", display: { xs: "none", sm: "block" } }}>
          <Typography variant="body2" sx={{ lineHeight: 1.2 }} noWrap>
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", lineHeight: 1.2 }}
          >
            {roleLabel(session.role)}
          </Typography>
        </Box>
        <KeyboardArrowDownOutlinedIcon
          fontSize="small"
          sx={{
            color: "text.secondary",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </ButtonBase>

      <Menu
        id="top-bar-user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
          <Typography variant="subtitle2" noWrap>
            {displayName}
          </Typography>
          <Chip
            label={roleLabel(session.role)}
            size="small"
            color={session.role === "ADMIN" ? "primary" : "default"}
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Divider />

        <MenuItem onClick={handleClose} component="a" href="/painel/perfil">
          <ListItemIcon>
            <PersonOutlineOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Meu perfil
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} disabled={isPending}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
    </>
  );
};
