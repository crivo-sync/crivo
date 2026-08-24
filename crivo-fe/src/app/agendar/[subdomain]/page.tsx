import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import { BookingForm } from "@/features/public-booking/components/booking-form";
import { getBookingOptionsAction } from "@/features/public-booking/actions/public-booking-actions";
import { formatPhone } from "@/lib/br-masks";

type PageProps = {
  // `params` é Promise nesta versão do Next — precisa de `await`.
  params: Promise<{ subdomain: string }>;
};

/** Índice = `Date.getDay()` (0 = domingo … 6 = sábado), igual ao usado em
 * Configurações → Dados da clínica. */
const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** Dias soltos viram faixas contínuas: [1,2,3,4,5] → "Seg a Sex", em vez de
 * listar os 5 nomes por extenso. */
function formatBusinessDays(days: number[]): string {
  if (days.length === 0) return "";

  const sorted = [...days].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const day = sorted[i];
    if (day === prev + 1) {
      prev = day;
      continue;
    }
    ranges.push(
      start === prev
        ? WEEKDAY_SHORT[start]
        : `${WEEKDAY_SHORT[start]} a ${WEEKDAY_SHORT[prev]}`,
    );
    start = day;
    prev = day;
  }

  return ranges.join(", ");
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const result = await getBookingOptionsAction(subdomain);

  if (!result.success) return { title: "Agendamento — Crivo Sync" };

  return {
    title: `Agendar consulta — ${result.data.clinic.name}`,
    description: `Escolha o horário e marque sua consulta na ${result.data.clinic.name}.`,
    // Página de cada clínica não deve ser indexada como conteúdo do Crivo Sync.
    robots: { index: false, follow: false },
  };
}

/**
 * Página pública de agendamento — o paciente marca sozinho, sem login.
 *
 * A clínica vem do subdomínio na URL (`/agendar/clinica-sorriso`), o mesmo
 * identificador que o backend usa em `public/:subdomain`. Não é subdomínio
 * de DNS: é um segmento de caminho, como já era no backend.
 */
const AgendarPage = async ({ params }: PageProps) => {
  const { subdomain } = await params;
  const result = await getBookingOptionsAction(subdomain);

  // Clínica inexistente ou desativada: o backend devolve 404 e aqui virou
  // página não encontrada, em vez de um formulário que nunca funcionaria.
  if (!result.success) notFound();

  const { clinic, bookingBlocked } = result.data;

  /**
   * Bloqueado = o backend vai recusar o agendamento de qualquer forma (hoje:
   * a clínica tem mais profissionais ativos do que o plano permite). Mostrar
   * o formulário levaria o paciente a escolher horário, digitar nome e
   * telefone e só descobrir no "Confirmar agendamento" — foi o que acontecia
   * até 17/08/2026.
   *
   * O motivo **não** aparece: pendência de plano é assunto entre a clínica e
   * nós, e o paciente não pode resolver nada. O que ele precisa é do
   * telefone, que já está logo abaixo.
   */

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        px: 2,
        py: 5,
        // Valor literal, não `(theme) => ...`: esta página é Server
        // Component, e função no `sx` não atravessa a fronteira
        // servidor→cliente (o erro só aparece em runtime, não no tsc).
        background:
          "linear-gradient(to bottom, rgba(79,70,229,0.05), transparent 60%)",
      }}
    >
      <Box sx={{ mx: "auto", width: "100%", maxWidth: 520 }}>
        <Box component="header" sx={{ mb: 4, textAlign: "center" }}>
          {clinic.logoUrl ? (
            /* `<img>` e não `next/image`: o logo vem de domínio arbitrário
               da clínica (white-label), e o otimizador exige declarar cada
               host em `next.config`. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clinic.logoUrl}
              alt={clinic.name}
              style={{
                display: "block",
                margin: "0 auto 16px",
                height: 48,
                objectFit: "contain",
              }}
            />
          ) : (
            <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
              {clinic.name}
            </Typography>
          )}

          {/* Bloqueado, o convite a escolher horário contradiz o card logo
              abaixo ("agenda indisponível") — some em vez de confundir. */}
          {!bookingBlocked && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Escolha o horário que funciona para você.
            </Typography>
          )}

          {clinic.address && (
            <Typography
              variant="caption"
              sx={{ mt: 1.5, display: "block", color: "text.secondary" }}
            >
              {clinic.address}
            </Typography>
          )}

          {clinic.businessDays.length > 0 && (
            <Typography
              variant="caption"
              sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
            >
              {formatBusinessDays(clinic.businessDays)} ·{" "}
              {minutesToLabel(clinic.businessHoursStart)} às{" "}
              {minutesToLabel(clinic.businessHoursEnd)}
            </Typography>
          )}
        </Box>

        <Card variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
          {bookingBlocked ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h6" component="p" sx={{ mb: 1.5 }}>
                Agenda online indisponível
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Não é possível marcar por aqui neste momento.
                {clinic.phone
                  ? ` Fale com a clínica no ${formatPhone(clinic.phone)} para marcar sua consulta.`
                  : " Entre em contato com a clínica para marcar sua consulta."}
              </Typography>
            </Box>
          ) : (
            <BookingForm subdomain={subdomain} />
          )}
        </Card>

        {(clinic.phone || clinic.email) && (
          <Typography
            variant="body2"
            sx={{ mt: 3, textAlign: "center", color: "text.secondary" }}
          >
            Prefere falar com a gente?{" "}
            {[clinic.phone && formatPhone(clinic.phone), clinic.email]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AgendarPage;
