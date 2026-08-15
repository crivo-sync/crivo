"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  connectWhatsAppAction,
  disconnectWhatsAppAction,
  getWhatsAppConnectionAction,
} from "../actions/whatsapp-connection-action";
import type { WhatsAppConnection } from "../types";

const QUERY_KEY = ["whatsapp-connection"];

/**
 * Enquanto o QR está na tela, o pareamento conclui **fora do painel** — a
 * pessoa aponta a câmera do celular e nada avisa a página. 3s aqui, e não os
 * 8s de `LIVE_REFETCH_INTERVAL_MS`: com o QR na frente, alguém está olhando
 * e esperando, e 8s de espera depois de ler o código parecem travamento.
 */
const PAIRING_POLL_MS = 3_000;

export function useWhatsAppConnection() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await getWhatsAppConnectionAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    // Só insiste enquanto há pareamento em curso: conectado ou desconectado
    // são estados estáveis, e reconsultar à toa gastaria requisição por nada.
    refetchInterval: (q) =>
      q.state.data?.status === "CONNECTING" ? PAIRING_POLL_MS : false,
    /**
     * **O QR pertence à sessão de pareamento, não à resposta do status.**
     *
     * Só `POST /whatsapp-connection` gera código; o `GET` sempre devolve
     * `qrCode: null`. Sem este `structuralSharing`, o primeiro polling (3s
     * depois) sobrescrevia o QR com `null` e a clínica via o código
     * **desaparecer sozinho** com "Aguardando leitura" ainda na tela —
     * verificado no navegador: presente aos 5s, sumido aos 10s.
     *
     * Mantém o código anterior enquanto o pareamento segue pendente; quando
     * conecta ou desconecta, o estado novo manda e o QR sai de cena.
     */
    structuralSharing: (previous, next) => {
      const anterior = previous as WhatsAppConnection | undefined;
      const atual = next as WhatsAppConnection;

      if (atual.status === "CONNECTING" && !atual.qrCode && anterior?.qrCode) {
        return { ...atual, qrCode: anterior.qrCode };
      }

      return atual;
    },
  });

  const connect = useMutation({
    mutationFn: async () => {
      const result = await connectWhatsAppAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    // Escreve a resposta direto no cache: ela já traz o QR, e refazer o GET
    // devolveria `qrCode: null` (o status não gera código novo) — a tela
    // piscaria o QR e o perderia.
    onSuccess: (data: WhatsAppConnection) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      const result = await disconnectWhatsAppAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (data: WhatsAppConnection) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  return {
    connection: query.data,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    connect,
    disconnect,
  };
}
