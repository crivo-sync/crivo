"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "lucide-react";

/**
 * Some por padrão e só aparece depois de rolar — numa página curta (ou já
 * no topo) o botão não teria função nenhuma, só ocuparia espaço no canto.
 * `600px` é aproximadamente a altura do hero: a partir daí a home já saiu
 * de vista o suficiente para o link "voltar ao topo" fazer sentido.
 */
const SCROLL_THRESHOLD = 600;

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className="fixed right-6 bottom-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all duration-200 hover:bg-indigo-500 hover:shadow-xl"
    >
      <ArrowUpIcon size={20} />
    </button>
  );
};
