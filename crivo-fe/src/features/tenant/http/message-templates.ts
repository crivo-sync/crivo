import { api, authHeaders } from "@/config/api";
import type {
  MessageTemplate,
  MessageTemplatesResponse,
  SaveTemplateInput,
} from "../types/templates";

export async function getMessageTemplates(
  accessToken: string,
): Promise<MessageTemplatesResponse> {
  return api
    .get("message-templates", { headers: authHeaders(accessToken) })
    .json<MessageTemplatesResponse>();
}

export async function putMessageTemplate(
  input: SaveTemplateInput,
  accessToken: string,
): Promise<MessageTemplate> {
  return api
    .put("message-templates", {
      json: input,
      headers: authHeaders(accessToken),
    })
    .json<MessageTemplate>();
}
