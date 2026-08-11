"use client";

import { useState } from "react";
import Link from "next/link";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from "@mui/material/AppBar";
import MuiDrawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import {
  styled,
  useTheme,
  type CSSObject,
  type Theme,
} from "@mui/material/styles";

import { LogoMark } from "@/components/ui/logo";
import type { SubscriptionStatus } from "@/features/tenant/types";
import type { NavItem } from "../_data/nav-items";
import { SidebarNav } from "./sidebar-nav";
import { TopBarUserMenu } from "./top-bar-user-menu";
import { TrialBanner } from "./trial-banner";
import { UserMenu } from "./user-menu";

const drawerWidth = 260;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // Alinha com a altura da AppBar.
  ...theme.mixins.toolbar,
}));

// Mesmo componente, mas com a borda inferior que espelha a AppBar — só faz
// sentido no header real da sidebar, não no placeholder que empurra o
// conteúdo de `main` para baixo da AppBar fixa.
const DrawerHeaderBar = styled(DrawerHeader)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  // Mesmo visual do header da sidebar (DrawerHeader): fundo do Paper, uma
  // única borda inferior fina, sem sombra — os dois precisam parecer a
  // mesma barra cortada ao meio pela sidebar, não dois blocos distintos.
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

type DashboardShellProps = {
  navItems: NavItem[];
  displayName: string;
  /** `null` quando a busca da clínica falha — o header some sem quebrar a página. */
  tenantName: string | null;
  /** `null` pelo mesmo motivo que `tenantName` — sem dado, sem banner. */
  trial: { status: SubscriptionStatus; endsAt: string } | null;
  children: React.ReactNode;
};

/**
 * Casca do painel no padrão Mini variant drawer do MUI: a sidebar colapsa
 * para uma faixa de ícones e expande sob demanda.
 */
export const DashboardShell = ({
  navItems,
  displayName,
  tenantName,
  trial,
  children,
}: DashboardShellProps) => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" open={open} elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* A marca já vive no header da sidebar; aqui só o botão de abrir
                quando ela está recolhida, para não duplicar "Crivo". */}
            <IconButton
              aria-label="Abrir menu"
              onClick={() => setOpen(true)}
              edge="start"
              color="inherit"
              sx={[{ mr: 2 }, open && { display: "none" }]}
            >
              <MenuIcon />
            </IconButton>
            {tenantName && (
              <Typography variant="subtitle1" noWrap>
                {tenantName}
              </Typography>
            )}
          </Box>

          <TopBarUserMenu />
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open}>
        <DrawerHeaderBar>
          {open && (
            <Link
              href="/painel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginRight: "auto",
                paddingLeft: 8,
              }}
            >
              <LogoMark />
              <Typography variant="h6" component="span">
                Crivo
              </Typography>
            </Link>
          )}
          <IconButton
            aria-label="Recolher menu"
            onClick={() => setOpen(false)}
            color="inherit"
          >
            {theme.direction === "rtl" ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeaderBar>

        <SidebarNav items={navItems} open={open} />

        <Box sx={{ mt: "auto" }}>
          <Divider />
          <UserMenu displayName={displayName} open={open} />
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        <DrawerHeader />
        {trial && <TrialBanner status={trial.status} endsAt={trial.endsAt} />}
        {children}
      </Box>
    </Box>
  );
};
