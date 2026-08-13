/**
 * Liga as seções de prova social do site (logos de clientes e depoimentos).
 *
 * **Desligado até existir cliente real.** As duas seções estão prontas, mas
 * com placeholder: a de logos afirma "Clínicas que confiam no Crivo" sobre
 * quatro caixas escritas "Logo cliente", e a de depoimentos repete três vezes
 * "Nome do cliente / Depoimento de cliente — a preencher".
 *
 * Placeholder honesto é melhor que depoimento inventado — mas na página
 * pública ele é pior que a ausência da seção: denuncia produto sem cliente
 * exatamente no ponto onde o visitante procura confiança.
 *
 * Para reativar: troque para `true` **depois** de substituir os dados por
 * clientes reais (com autorização de uso do nome/logo). O link "Depoimentos"
 * do menu segue esta mesma flag.
 */
export const SHOW_SOCIAL_PROOF = false;
