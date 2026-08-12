import { api } from "@/config/api";
import type { Plan } from "../types";

/** Endpoint público: não leva Bearer token. */
export async function getPlans(): Promise<Plan[]> {
  return api.get("plans").json<Plan[]>();
}
