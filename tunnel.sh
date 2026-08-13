#!/usr/bin/env bash
#
# Sobe um túnel público para o frontend (localhost:3000) e sincroniza a URL
# no `crivo-be/.env`.
#
# POR QUE ISSO EXISTE
# -------------------
# O link de confirmação que vai no WhatsApp (`/c/:token`) é montado pelo
# backend a partir de `PUBLIC_APP_URL`. Em desenvolvimento essa URL é de um
# túnel efêmero, que **muda toda vez que o processo reinicia**.
#
# Quando o túnel cai e volta com outra URL, as mensagens continuam saindo
# com a URL velha — o paciente recebe um link que dá "site não encontrado"
# (DNS_PROBE_FINISHED_NXDOMAIN). Foi exatamente o que aconteceu em
# 13/08/2026: 9 mensagens saíram com um subdomínio morto.
#
# Atualizar o .env na mão a cada restart é o tipo de passo que se esquece
# justamente quando se está testando outra coisa. Por isso o script faz.
#
# USO
# ---
#   ./tunnel.sh
#
# Pré-requisito (uma vez só): ngrok autenticado.
#   1. Crie a conta gratuita: https://dashboard.ngrok.com/signup
#   2. Pegue o token:         https://dashboard.ngrok.com/get-started/your-authtoken
#   3. Rode:                  ngrok config add-authtoken SEU_TOKEN
#
# Deixe rodando numa aba. Ctrl+C encerra o túnel e restaura o .env.

set -euo pipefail

PORT="${PORT:-3000}"
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/crivo-be/.env"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok não encontrado. Instale com: brew install ngrok"
  exit 1
fi

if ! ngrok config check >/dev/null 2>&1; then
  echo "ngrok sem authtoken configurado."
  echo "  1. Conta grátis: https://dashboard.ngrok.com/signup"
  echo "  2. Token:        https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "  3. ngrok config add-authtoken SEU_TOKEN"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Não achei $ENV_FILE"
  exit 1
fi

# Guarda a linha atual para restaurar na saída — sem isso, o .env fica
# apontando para um túnel morto depois que o script encerra, que é
# justamente o estado que causa o link quebrado.
ORIGINAL_URL="$(grep '^PUBLIC_APP_URL=' "$ENV_FILE" || echo '')"

cleanup() {
  echo ""
  echo "Encerrando o túnel..."
  [ -n "${NGROK_PID:-}" ] && kill "$NGROK_PID" 2>/dev/null || true

  if [ -n "$ORIGINAL_URL" ]; then
    # `.bak` e remoção logo em seguida: o `sed -i` do macOS (BSD) exige o
    # argumento de sufixo, diferente do GNU.
    sed -i.bak "s|^PUBLIC_APP_URL=.*|${ORIGINAL_URL}|" "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"
    echo "PUBLIC_APP_URL restaurado."
  fi
}
trap cleanup EXIT INT TERM

echo "Subindo túnel para localhost:${PORT}..."
ngrok http "$PORT" --log stdout > /tmp/crivo-ngrok.log 2>&1 &
NGROK_PID=$!

# A URL só aparece depois que o agente registra o túnel na borda. Espera
# ativa com teto, em vez de um `sleep` fixo que ora sobra ora falta.
URL=""
for _ in $(seq 1 30); do
  sleep 1
  URL="$(grep -oE 'https://[a-zA-Z0-9.-]+\.ngrok[a-z.-]*\.app' /tmp/crivo-ngrok.log | head -1 || true)"
  [ -n "$URL" ] && break
done

if [ -z "$URL" ]; then
  echo "Não consegui obter a URL do ngrok. Log:"
  tail -20 /tmp/crivo-ngrok.log
  exit 1
fi

sed -i.bak "s|^PUBLIC_APP_URL=.*|PUBLIC_APP_URL=\"${URL}\"|" "$ENV_FILE"
rm -f "${ENV_FILE}.bak"

cat <<EOF

  Túnel no ar: ${URL}
  PUBLIC_APP_URL atualizado em crivo-be/.env

  >>> REINICIE O BACKEND (Ctrl+C no terminal dele e \`npm run start:dev\`). <<<

      NÃO basta salvar um arquivo para o --watch recompilar: o
      ConfigService lê o .env uma vez, no boot do PROCESSO. O watch
      recarrega os módulos mas mantém o mesmo processo Node, então
      process.env continua com a URL antiga e as mensagens seguem
      saindo com o link velho.

  Teste: ${URL}/agendar/<subdomain-da-clinica>
  Ctrl+C encerra e restaura o .env.

EOF

wait "$NGROK_PID"
