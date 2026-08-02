"use server";

import { cookies } from "next/headers";

import { DISPLAY_NAME_COOKIE, REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/session";
import { logout } from "../http/logout";
import type { ActionResult } from "../types";

export async function logoutAction(): Promise<ActionResult> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await logout(refreshToken);
    } catch (error) {
      // Best-effort: mesmo se o backend falhar em revogar, o cookie local
      // é removido — o usuário não pode ficar preso numa sessão local.
      console.error("[Logout Action Error]", error);
    }
  }

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(DISPLAY_NAME_COOKIE);

  return { success: true, message: "Logout realizado.", data: undefined };
}
