"use client";

import { forwardRef } from "react";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { IMaskInput } from "react-imask";

/**
 * Opções de máscara aceitas: um padrão fixo, ou uma lista de padrões com
 * `dispatch` customizado para decidir qual usar (necessário sempre que os
 * padrões compartilham prefixo — ver `PHONE_MASK` em `src/lib/br-masks.ts`
 * para o porquê do `dispatch` do imask ser obrigatório nesse caso).
 */
export type MaskOptions =
  | { mask: string; dispatch?: never }
  | {
      mask: { mask: string }[];
      // `dispatch` recebe a instância dinâmica em runtime (com
      // `compiledMasks` já resolvidos) — tipar como `never[]` aqui e deixar
      // o consumidor (ex: PHONE_MASK) tipar sua própria assinatura evita
      // duplicar o shape interno do imask neste componente genérico.
      dispatch: (...args: never[]) => unknown;
    };

type MaskAdapterProps = MaskOptions & {
  name: string;
  onChange: (event: { target: { name: string; value: string } }) => void;
  definitions?: Record<string, RegExp>;
};

/**
 * Adaptador entre o `inputComponent` que o TextField do MUI espera e a
 * API do react-imask. Baseado no padrão oficial de integração MUI +
 * react-imask (https://mui.com/material-ui/react-text-field/#integration-with-3rd-party-input-libraries).
 *
 * `unmask` faz o valor entregue ao form (via `onAccept`) ser só os dígitos
 * (`unmaskedValue`) — é o formato que os schemas Zod e o crivo-be esperam
 * (`\d{10,11}`, `\d{11}`). O input em TELA continua mostrando a máscara
 * completa: com `unmask` ativo, o imask formata automaticamente qualquer
 * `value` cru que receber de volta (o do react-hook-form).
 */
const MaskAdapter = forwardRef<HTMLInputElement, MaskAdapterProps>(
  function MaskAdapter({ onChange, mask, dispatch, definitions, ...props }, ref) {
    // O tipo de `mask` do IMaskInput é um union fechado por variante
    // (string | MaskedPattern | MaskedDynamic | ...) — um wrapper genérico
    // não consegue satisfazer esse overload sem cast. O runtime do imask
    // decide sozinho a classe correta a partir do formato de `mask`.
    return (
      <IMaskInput
        {...(props as object)}
        mask={mask as string}
        dispatch={dispatch as never}
        definitions={definitions}
        inputRef={ref}
        unmask
        onAccept={(value: string) =>
          onChange({ target: { name: props.name, value } })
        }
        overwrite
      />
    );
  },
);

type MaskedTextFieldProps = TextFieldProps &
  MaskOptions & {
    maskDefinitions?: Record<string, RegExp>;
  };

/**
 * TextField do MUI com máscara de digitação (react-imask). Componente
 * genérico: qualquer feature define seu próprio padrão de `mask` (telefone,
 * CPF, CEP, etc.) — nenhuma lógica de domínio aqui.
 */
export const MaskedTextField = ({
  mask,
  dispatch,
  maskDefinitions,
  slotProps,
  ...props
}: MaskedTextFieldProps) => {
  return (
    <TextField
      {...props}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          inputComponent: MaskAdapter as never,
          inputProps: { mask, dispatch, definitions: maskDefinitions },
        },
      }}
    />
  );
};
