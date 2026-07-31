"use client";

import { useState } from "react";
import { CheckIcon } from "lucide-react";

type ContactFormData = {
  name: string;
  clinic: string;
  phone: string;
};

const INITIAL_FORM: ContactFormData = { name: "", clinic: "", phone: "" };

const FIELDS: {
  id: keyof ContactFormData;
  label: string;
  placeholder: string;
  type?: string;
}[] = [
  { id: "name", label: "Seu nome", placeholder: "Seu nome" },
  { id: "clinic", label: "Nome da clínica", placeholder: "Nome da clínica" },
  { id: "phone", label: "WhatsApp", placeholder: "WhatsApp", type: "tel" },
];

export const ContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const handleChange =
    (field: keyof ContactFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: integrar com Server Action quando definirmos o destino do lead.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-indigo-600">
          <CheckIcon className="size-5 text-white" strokeWidth={2.5} />
        </span>
        <h3 className="mb-2 text-lg font-bold text-gray-900">
          Recebemos seu contato
        </h3>
        <p className="text-sm text-gray-600">
          Nosso time fala com {formData.name.split(" ")[0]} em breve.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900">Comece grátis</h3>
      <p className="mt-1.5 mb-6 text-sm text-gray-600">
        Resposta em até 1 dia útil. Sem cartão de crédito.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {FIELDS.map((field) => (
          <div key={field.id} className="flex flex-col gap-1.5">
            <label htmlFor={`contact-${field.id}`} className="sr-only">
              {field.label}
            </label>
            <input
              id={`contact-${field.id}`}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              value={formData[field.id]}
              onChange={handleChange(field.id)}
              required
              className="h-13 w-full rounded-xl border border-black/10 bg-black/2 px-5 py-3.5 text-base text-gray-900 transition-all duration-200 outline-none placeholder:text-gray-400 focus:border-indigo-500/50 focus:bg-indigo-50/50 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        ))}

        <button
          type="submit"
          className="mt-2 h-13 w-full rounded-full bg-indigo-600 px-6 text-base font-semibold text-white shadow-[0_0_30px_rgba(79,70,229,0.25)] transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_45px_rgba(79,70,229,0.4)]"
        >
          Solicitar contato
        </button>

        <p className="text-center text-xs text-gray-500">
          Ao enviar, você concorda em receber contato do time Crivo.
        </p>
      </form>
    </div>
  );
};
