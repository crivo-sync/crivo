import { api, authHeaders } from "@/config/api";
import type { ConversationEntry } from "../types";

export async function getConversation(
  patientId: string,
  accessToken: string,
): Promise<ConversationEntry[]> {
  return api
    .get(`messages/conversation/${patientId}`, {
      headers: authHeaders(accessToken),
    })
    .json<ConversationEntry[]>();
}
