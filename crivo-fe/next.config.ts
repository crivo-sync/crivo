import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /**
       * O padrão do Next é 1MB, mas a importação de pacientes aceita CSV de
       * até 2MB (`MAX_CSV_SIZE_BYTES`, no crivo-be). Sem alinhar os dois, um
       * arquivo entre 1 e 2MB morre aqui com erro genérico de framework em
       * vez da mensagem tratada que o backend devolve.
       */
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
