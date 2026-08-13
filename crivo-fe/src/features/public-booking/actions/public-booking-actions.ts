"use server";

import {
  createBooking,
  getAvailability,
  getBookingOptions,
} from "../http/public-booking";
import type {
  ActionResult,
  Availability,
  BookingConfirmation,
  BookingOptions,
  BookingRequest,
} from "../types";

/**
 * Sem `getServerSession` em nenhuma delas: é o paciente que usa, e ele não
 * tem login. A autorização é o próprio subdomínio, conferido no backend.
 */

export async function getBookingOptionsAction(
  subdomain: string,
): Promise<ActionResult<BookingOptions>> {
  try {
    const data = await getBookingOptions(subdomain);
    return { success: true, message: "Sucesso", data };
  } catch (error) {
    console.error("[Get Booking Options Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados da clínica.",
    };
  }
}

export async function getAvailabilityAction(
  subdomain: string,
  params: { professionalId: string; procedureId: string; date: string },
): Promise<ActionResult<Availability>> {
  try {
    const data = await getAvailability(subdomain, params);
    return { success: true, message: "Sucesso", data };
  } catch (error) {
    console.error("[Get Availability Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os horários.",
    };
  }
}

export async function createBookingAction(
  subdomain: string,
  input: BookingRequest,
): Promise<ActionResult<BookingConfirmation>> {
  try {
    const data = await createBooking(subdomain, input);
    return { success: true, message: "Agendamento confirmado.", data };
  } catch (error) {
    console.error("[Create Booking Error]", error);
    // O backend recusa horário ocupado (409), data no passado e telefone
    // inválido (400) com mensagem própria — repassar é mais útil que um
    // texto genérico nosso.
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o agendamento.",
    };
  }
}
