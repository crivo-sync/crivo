"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Badge from "@mui/material/Badge";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import type { SvgIconComponent } from "@mui/icons-material";

import { useFailedMessages } from "@/features/messages/hooks/use-failed-messages";
import type { NavIconName, NavItem } from "../_data/nav-items";

const ICONS: Record<NavIconName, SvgIconComponent> = {
  dashboard: DashboardOutlinedIcon,
  agenda: CalendarMonthOutlinedIcon,
  pacientes: PersonOutlineOutlinedIcon,
  profissionais: MedicalServicesOutlinedIcon,
  procedimentos: ContentCutOutlinedIcon,
  mensagens: ChatBubbleOutlineOutlinedIcon,
  usuarios: GroupOutlinedIcon,
  configuracoes: SettingsOutlinedIcon,
};

type SidebarNavProps = {
  items: NavItem[];
  /** Drawer expandido: mostra os labels. Colapsado: só ícones. */
  open: boolean;
};

/**
 * Componente visual puro: recebe os itens já filtrados por role do
 * Server Component pai e só cuida de destacar a rota ativa.
 */
export const SidebarNav = ({ items, open }: SidebarNavProps) => {
  const pathname = usePathname();

  /**
   * Contagem de mensagens que falharam, no menu.
   *
   * O alerta "ligue para estes pacientes" só existia dentro do Painel e da
   * tela de Mensagens — quem estava em Agenda ou Pacientes não descobria que
   * alguém ficou sem aviso. `perPage: 1` porque só o `meta.total` interessa
   * aqui; o hook já se reconsulta sozinho (`LIVE_REFETCH_INTERVAL_MS`).
   */
  const { meta } = useFailedMessages({ page: 1, perPage: 1 });
  const failedCount = meta?.total ?? 0;

  return (
    <List>
      {items.map((item) => {
        // "/painel" é prefixo de toda rota do dashboard — sem essa exceção,
        // o item "Painel" ficaria marcado como ativo em qualquer tela.
        const isActive =
          item.href === "/painel"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.icon];
        // O badge fica no ÍCONE, não no texto: com a sidebar recolhida o
        // rótulo tem `opacity: 0`, e um badge ali sumiria junto — justamente
        // quando o menu estreito é a única pista na tela.
        const badgeCount = item.href === "/painel/mensagens" ? failedCount : 0;

        return (
          <ListItem key={item.href} disablePadding sx={{ display: "block" }}>
            <Tooltip title={open ? "" : item.label} placement="right">
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                aria-current={isActive ? "page" : undefined}
                sx={[
                  { minHeight: 48, px: 2.5 },
                  open
                    ? { justifyContent: "initial" }
                    : { justifyContent: "center" },
                ]}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: "center" },
                    open ? { mr: 3 } : { mr: "auto" },
                  ]}
                >
                  <Badge
                    badgeContent={badgeCount}
                    color="error"
                    // Zero não vira bolinha vazia: `badgeContent={0}` some
                    // sozinho no MUI, então nenhum item sem falha ganha marca.
                    max={99}
                  >
                    <Icon />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        );
      })}
    </List>
  );
};
