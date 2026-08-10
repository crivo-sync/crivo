import { api, authHeaders } from "@/config/api";
import type {
  AddToWaitlistInput,
  SlotCandidatesResponse,
  WaitlistEntry,
  WaitlistResponse,
} from "../types";

export async function getWaitlist(
  accessToken: string,
): Promise<WaitlistResponse> {
  return api
    .get("waitlist", { headers: authHeaders(accessToken) })
    .json<WaitlistResponse>();
}

export async function postWaitlistEntry(
  input: AddToWaitlistInput,
  accessToken: string,
): Promise<WaitlistEntry> {
  return api
    .post("waitlist", { json: input, headers: authHeaders(accessToken) })
    .json<WaitlistEntry>();
}

export async function getSlotCandidates(
  appointmentId: string,
  accessToken: string,
): Promise<SlotCandidatesResponse> {
  return api
    .get(`waitlist/candidates/${appointmentId}`, {
      headers: authHeaders(accessToken),
    })
    .json<SlotCandidatesResponse>();
}

export async function patchWaitlistOffered(
  id: string,
  appointmentId: string | undefined,
  accessToken: string,
): Promise<{ offered: boolean; notified: boolean }> {
  return api
    .patch(`waitlist/${id}/offered`, {
      json: appointmentId ? { appointmentId } : {},
      headers: authHeaders(accessToken),
    })
    .json<{ offered: boolean; notified: boolean }>();
}

export async function deleteWaitlistEntry(
  id: string,
  accessToken: string,
): Promise<{ cancelled: boolean }> {
  return api
    .delete(`waitlist/${id}`, { headers: authHeaders(accessToken) })
    .json<{ cancelled: boolean }>();
}
