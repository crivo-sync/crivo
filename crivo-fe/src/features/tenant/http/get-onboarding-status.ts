import { api, authHeaders } from "@/config/api";
import type { OnboardingStatus } from "../types";

export async function getOnboardingStatus(
  accessToken: string,
): Promise<OnboardingStatus> {
  return api
    .get("tenants/me/onboarding", { headers: authHeaders(accessToken) })
    .json<OnboardingStatus>();
}
