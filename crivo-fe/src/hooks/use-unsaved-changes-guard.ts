"use client";

import { useCallback, useEffect, useState } from "react";

type UseUnsavedChangesGuardOptions = {
  /** Há alterações não salvas? Normalmente `formState.isDirty`. */
  isDirty: boolean;
  /** Fecha de verdade (o `onOpenChange(false)` do dialog). */
  onConfirmClose: () => void;
};

/**
 * Protege formulários de fechamento acidental. Um dialog fecha por três
 * caminhos (botão Cancelar, clique fora/ESC do MUI, e o próprio browser
 * fechando a aba) — todos passam por aqui quando `isDirty`, senão o usuário
 * perde o que digitou sem nenhum aviso.
 *
 * O alerta do browser (`beforeunload`) é separado de propósito: ele não
 * aceita UI customizada nem promessa, então o texto é do próprio navegador.
 * Dentro da app o aviso é um `<Dialog>` normal, que dá pra estilizar.
 */
export const useUnsavedChangesGuard = ({
  isDirty,
  onConfirmClose,
}: UseUnsavedChangesGuardOptions) => {
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // `preventDefault()` é o contrato moderno; alguns browsers ainda exigem
      // `returnValue` preenchido para exibir o diálogo nativo.
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  /** Chame no lugar do `onOpenChange(false)` direto. */
  const requestClose = useCallback(() => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    onConfirmClose();
  }, [isDirty, onConfirmClose]);

  const confirmDiscard = useCallback(() => {
    setConfirmOpen(false);
    onConfirmClose();
  }, [onConfirmClose]);

  const cancelDiscard = useCallback(() => setConfirmOpen(false), []);

  return { requestClose, isConfirmOpen, confirmDiscard, cancelDiscard };
};
