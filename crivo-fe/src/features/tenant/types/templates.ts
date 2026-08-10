/** Tipos de mensagem que a clínica pode personalizar. */
export type TemplateType = "APPOINTMENT_REMINDER" | "APPOINTMENT_BOOKED";

export type MessageTemplate = {
  type: TemplateType;
  /** O que está no editor: o rascunho salvo, ou o padrão como ponto de partida. */
  body: string;
  /**
   * O texto padrão do sistema, sempre presente. É o que o paciente recebe
   * quando `isActive` é `false` — sem ele a tela mostraria o rascunho e o
   * paciente receberia outra coisa.
   */
  defaultBody: string;
  isActive: boolean;
  /** `false` = a clínica nunca salvou nada para este tipo. */
  isCustom: boolean;
  updatedAt: string | null;
};

export type TemplatePlaceholder = {
  name: string;
  description: string;
};

export type MessageTemplatesResponse = {
  templates: MessageTemplate[];
  placeholders: TemplatePlaceholder[];
};

export type SaveTemplateInput = {
  type: TemplateType;
  body: string;
  isActive: boolean;
};
