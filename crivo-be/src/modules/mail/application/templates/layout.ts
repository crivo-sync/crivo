const BRAND = '#4F46E5';

export type MailContent = {
  /** Título grande, no topo do card. */
  heading: string;
  /** Parágrafos de abertura, antes da tabela de dados. */
  intro: string[];
  /** Linhas rótulo/valor — vira a tabela de destaque. */
  rows?: { label: string; value: string }[];
  cta?: { label: string; url: string };
  /** Parágrafos de fechamento, depois do botão. */
  outro?: string[];
};

/**
 * Layout compartilhado dos e-mails transacionais.
 *
 * **Tabelas e estilo inline, não flexbox e CSS externo.** Cliente de e-mail
 * (Outlook, Gmail) ignora `<style>` em `<head>` e não implementa layout
 * moderno — o que funciona no navegador quebra na caixa de entrada. É feio de
 * escrever e é o que chega inteiro do outro lado.
 *
 * Toda mensagem sai também em texto puro (`toPlainText`): cliente antigo
 * mostra isso, e filtro de spam desconfia de e-mail só-HTML.
 */
export function renderMail(content: MailContent): { html: string; text: string } {
  return { html: toHtml(content), text: toPlainText(content) };
}

function toHtml(content: MailContent): string {
  const rows = (content.rows ?? [])
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join('');

  const table = rows
    ? `<table role="presentation" width="100%" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:24px 0;">${rows}</table>`
    : '';

  const cta = content.cta
    ? `<table role="presentation" style="margin:24px 0;">
         <tr><td style="background:${BRAND};border-radius:9999px;">
           <a href="${encodeURI(content.cta.url)}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(content.cta.label)}</a>
         </td></tr>
       </table>`
    : '';

  const paragraphs = (list: string[]) =>
    list
      .map(
        (p) =>
          `<p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.6;">${escapeHtml(p)}</p>`,
      )
      .join('');

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <tr><td>
        <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:${BRAND};">Crivo</p>
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">${escapeHtml(content.heading)}</h1>
        ${paragraphs(content.intro)}
        ${table}
        ${cta}
        ${paragraphs(content.outro ?? [])}
        <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;">
          Este é um e-mail automático do Crivo. Não responda a esta mensagem.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;
}

function toPlainText(content: MailContent): string {
  const parts = [content.heading, '', ...content.intro];

  for (const row of content.rows ?? []) {
    parts.push(`${row.label}: ${row.value}`);
  }

  if (content.cta) parts.push('', `${content.cta.label}: ${content.cta.url}`);
  if (content.outro?.length) parts.push('', ...content.outro);

  return parts.join('\n');
}

/**
 * Nome de clínica e de plano entram no HTML. Sem escapar, um `&` já quebra o
 * markup, e um nome com `<` viraria tag — dado do usuário nunca vai cru.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
