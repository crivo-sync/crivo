import { api, authHeaders } from "@/config/api";
import type { Message, PaginatedResponse } from "../types";
import type { MessagesQueryParams } from "../schemas/messages-query-params";

export async function getMessages(
  params: MessagesQueryParams,
  accessToken: string,
): Promise<PaginatedResponse<Message>> {
  return api
    .get("messages", {
      headers: authHeaders(accessToken),
      searchParams: {
        page: params.page,
        perPage: params.perPage,
        ...(params.status ? { status: params.status } : {}),
        ...(params.from ? { from: params.from } : {}),
        ...(params.to ? { to: params.to } : {}),
      },
    })
    .json<PaginatedResponse<Message>>();
}
