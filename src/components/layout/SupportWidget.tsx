"use client";

import Image from "next/image";
import { useDesign } from "@/contexts/DesignContext";

export default function SupportWidget() {
  const { supportChatUrl } = useDesign();

  return (
    <div className="rounded-xl border border-line bg-panel-2 p-3 text-center">
      <Image
        src="/macaco-suporte.png"
        alt="Suporte"
        width={120}
        height={120}
        className="mx-auto size-[120px] shrink-0 rounded-full object-cover"
      />
      <p className="mt-2 text-xs font-bold">Precisa de ajuda?</p>
      <p className="text-[11px] text-muted">Fale com nosso suporte</p>

      <div className="mt-2 flex items-center justify-center gap-1.5">
        <span className="size-1.5 rounded-full bg-win" />
        <span className="text-[11px] text-win">Online</span>
      </div>

      {supportChatUrl ? (
        <a
          href={supportChatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 block w-full rounded-lg bg-win py-2 text-center text-xs font-black text-navy hover:brightness-95"
        >
          Abrir chat
        </a>
      ) : (
        <button
          disabled
          title="O link do chat ainda não foi configurado em Admin → Design."
          className="mt-2.5 w-full cursor-not-allowed rounded-lg bg-win/40 py-2 text-xs font-black text-navy/60"
        >
          Abrir chat
        </button>
      )}
    </div>
  );
}
