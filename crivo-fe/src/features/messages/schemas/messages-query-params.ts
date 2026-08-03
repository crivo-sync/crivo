import { z } from "zod";

// Espelha QueryMessagesDto do crivo-be.
export const messagesQueryParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(200).default(50),
  status: z.enum(["PENDING", "SENT", "DELIVERED", "FAILED"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type MessagesQueryParams = z.infer<typeof messagesQueryParamsSchema>;
