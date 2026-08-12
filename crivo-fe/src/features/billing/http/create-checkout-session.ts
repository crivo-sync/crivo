import { api, authHeaders } from "@/config/api";
import type { CheckoutSession } from "../types";

export async function createCheckoutSession(
  accessToken: string,
  planId: string,
): Promise<CheckoutSession> {
  return api
    .post("billing/checkout", {
      headers: authHeaders(accessToken),
      json: { planId },
    })
    .json<CheckoutSession>();
}
