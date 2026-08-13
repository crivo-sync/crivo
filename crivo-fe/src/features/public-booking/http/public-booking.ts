import { api } from "@/config/api";
import type {
  Availability,
  BookingConfirmation,
  BookingOptions,
  BookingRequest,
} from "../types";

/**
 * Rotas abertas na internet: nenhuma leva Bearer token. A clínica vem do
 * `subdomain` na URL, e o backend confere cada id contra ela.
 */

export async function getBookingOptions(
  subdomain: string,
): Promise<BookingOptions> {
  return api
    .get(`public/${subdomain}/booking-options`)
    .json<BookingOptions>();
}

export async function getAvailability(
  subdomain: string,
  params: { professionalId: string; procedureId: string; date: string },
): Promise<Availability> {
  return api
    .get(`public/${subdomain}/availability`, { searchParams: params })
    .json<Availability>();
}

export async function createBooking(
  subdomain: string,
  input: BookingRequest,
): Promise<BookingConfirmation> {
  return api
    .post(`public/${subdomain}/bookings`, { json: input })
    .json<BookingConfirmation>();
}
