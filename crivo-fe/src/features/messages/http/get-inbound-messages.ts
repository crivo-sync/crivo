import { api, authHeaders } from "@/config/api";
import type { InboundMessagesResponse, ReplyIntent } from "../types";

export type GetInboundMessagesParams = {
  page: number;
  perPage: number;
  unreadOnly?: boolean;
  intent?: ReplyIntent;
};

export async function getInboundMessages(
  params: GetInboundMessagesParams,
  accessToken: string,
): Promise<InboundMessagesResponse> {
  return api
    .get("inbound-messages", {
      headers: authHeaders(accessToken),
      searchParams: {
        page: params.page,
        perPage: params.perPage,
        // Só entram na query quando definidos: `unreadOnly=undefined` viraria
        // a string "undefined" e o backend rejeitaria na validação.
        ...(params.unreadOnly !== undefined
          ? { unreadOnly: params.unreadOnly }
          : {}),
        ...(params.intent ? { intent: params.intent } : {}),
      },
    })
    .json<InboundMessagesResponse>();
}
