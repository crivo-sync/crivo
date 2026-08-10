"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import {
  deleteWaitlistEntry,
  getSlotCandidates,
  getWaitlist,
  patchWaitlistOffered,
  postWaitlistEntry,
} from "../http/waitlist";
import type {
  ActionResult,
  AddToWaitlistInput,
  SlotCandidatesResponse,
  WaitlistEntry,
  WaitlistResponse,
} from "../types";

/** Toda action daqui repete o mesmo preâmbulo de sessão e tratamento de erro. */
async function withSession<T>(
  label: string,
  run: (token: string) => Promise<T>,
  successMessage: string,
): Promise<ActionResult<T>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, run);
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: successMessage, data: result.data };
  } catch (error) {
    console.error(`[${label} Error]`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function getWaitlistAction(): Promise<
  ActionResult<WaitlistResponse>
> {
  return withSession("Get Waitlist", (token) => getWaitlist(token), "Sucesso");
}

export async function addToWaitlistAction(
  input: AddToWaitlistInput,
): Promise<ActionResult<WaitlistEntry>> {
  return withSession(
    "Add To Waitlist",
    (token) => postWaitlistEntry(input, token),
    "Paciente adicionado à lista de espera.",
  );
}

export async function getSlotCandidatesAction(
  appointmentId: string,
): Promise<ActionResult<SlotCandidatesResponse>> {
  return withSession(
    "Get Slot Candidates",
    (token) => getSlotCandidates(appointmentId, token),
    "Sucesso",
  );
}

export async function markWaitlistOfferedAction(input: {
  id: string;
  appointmentId?: string;
}): Promise<ActionResult<{ offered: boolean; notified: boolean }>> {
  return withSession(
    "Mark Waitlist Offered",
    (token) => patchWaitlistOffered(input.id, input.appointmentId, token),
    // A mensagem depende do que de fato aconteceu: dizer "avisado no
    // WhatsApp" quando o envio não saiu faria a recepção não ligar.
    input.appointmentId
      ? "Paciente avisado no WhatsApp."
      : "Marcado como oferecido.",
  );
}

export async function removeFromWaitlistAction(
  id: string,
): Promise<ActionResult<{ cancelled: boolean }>> {
  return withSession(
    "Remove From Waitlist",
    (token) => deleteWaitlistEntry(id, token),
    "Paciente removido da lista de espera.",
  );
}
