import type { SessionRole } from "@/lib/session";

export type NavIconName =
  | "agenda"
  | "pacientes"
  | "profissionais"
  | "procedimentos"
  | "mensagens"
  | "usuarios"
  | "configuracoes";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIconName;
  /** Omitido = visível para qualquer role autenticada. */
  roles?: SessionRole[];
};

/**
 * Um item por módulo do crivo-be (ver controllers em crivo-be/src/modules).
 * `roles` espelha os `@Roles(Role.ADMIN)` dos endpoints de escrita — itens
 * sem `roles` têm pelo menos leitura liberada para ADMIN e STAFF.
 *
 * `icon` é só um nome (string), não o componente em si: componentes Lucide
 * são funções e não atravessam a fronteira Server → Client Component como
 * prop. O `SidebarNav` (client) resolve o nome pro ícone real.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Agenda", href: "/painel/agenda", icon: "agenda" },
  { label: "Pacientes", href: "/painel/pacientes", icon: "pacientes" },
  {
    label: "Profissionais",
    href: "/painel/profissionais",
    icon: "profissionais",
  },
  {
    label: "Procedimentos",
    href: "/painel/procedimentos",
    icon: "procedimentos",
  },
  { label: "Mensagens", href: "/painel/mensagens", icon: "mensagens" },
  {
    label: "Usuários",
    href: "/painel/usuarios",
    icon: "usuarios",
    roles: ["ADMIN"],
  },
  {
    label: "Configurações",
    href: "/painel/configuracoes",
    icon: "configuracoes",
  },
];
