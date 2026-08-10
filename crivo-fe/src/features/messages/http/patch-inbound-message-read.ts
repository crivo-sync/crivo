import { api, authHeaders } from "@/config/api";
import type { InboundMessage } from "../types";

export async function patchInboundMessageRead(
  id: string,
  accessToken: string,
): Promise<InboundMessage> {
  return api
    .patch(`inbound-messages/${id}/read`, { headers: authHeaders(accessToken) })
    .json<InboundMessage>();
}

export async function patchAllInboundMessagesRead(
  accessToken: string,
): Promise<{ count: number }> {
  return api
    .patch("inbound-messages/read-all", { headers: authHeaders(accessToken) })
    .json<{ count: number }>();
}
