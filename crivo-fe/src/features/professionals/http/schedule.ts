import { api, authHeaders } from "@/config/api";
import type { ScheduleWindow, TimeOff } from "../types";

export async function getSchedule(
  professionalId: string,
  accessToken: string,
): Promise<ScheduleWindow[]> {
  return api
    .get(`professionals/${professionalId}/schedule`, {
      headers: authHeaders(accessToken),
    })
    .json<ScheduleWindow[]>();
}

export async function putSchedule(
  professionalId: string,
  windows: ScheduleWindow[],
  accessToken: string,
): Promise<ScheduleWindow[]> {
  return api
    .put(`professionals/${professionalId}/schedule`, {
      // O backend substitui a grade inteira: mandamos o estado final, não um
      // diff de criar/atualizar/apagar.
      json: { windows },
      headers: authHeaders(accessToken),
    })
    .json<ScheduleWindow[]>();
}

export async function getTimeOff(
  professionalId: string,
  accessToken: string,
): Promise<TimeOff[]> {
  return api
    .get(`professionals/${professionalId}/time-off`, {
      headers: authHeaders(accessToken),
    })
    .json<TimeOff[]>();
}

export async function postTimeOff(
  professionalId: string,
  input: { startsAt: string; endsAt: string; reason?: string },
  accessToken: string,
): Promise<TimeOff> {
  return api
    .post(`professionals/${professionalId}/time-off`, {
      json: input,
      headers: authHeaders(accessToken),
    })
    .json<TimeOff>();
}

export async function deleteTimeOff(
  professionalId: string,
  timeOffId: string,
  accessToken: string,
): Promise<void> {
  await api.delete(`professionals/${professionalId}/time-off/${timeOffId}`, {
    headers: authHeaders(accessToken),
  });
}
