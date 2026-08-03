import { api, authHeaders } from "@/config/api";
import type { Message, PaginatedResponse } from "../types";

export async function getFailedMessages(
  params: { page: number; perPage: number },
  accessToken: string,
): Promise<PaginatedResponse<Message>> {
  return api
    .get("messages/failed", {
      headers: authHeaders(accessToken),
      searchParams: { page: params.page, perPage: params.perPage },
    })
    .json<PaginatedResponse<Message>>();
}
