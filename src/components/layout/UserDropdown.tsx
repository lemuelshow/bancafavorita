"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { iniciais } from "@/lib/format";
import type { PublicUser } from "@/lib/types";

const ITEMS = [
  { label: "Minha conta", href: "/perfil" },
  { label: "Minha carteira", href: "/carteira" },
  { label: "Minhas apostas", href: "/poules" },
  { label: "Extrato", href: "/carteira" },
  { label: "Segurança", href: "/perfil" },
  { label: "Configurações", href: "/perfil" },
];

export default function UserDropdown({ user, onLogout }: { user: PublicUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickFora);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickFora);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Minha conta"
        className="flex items-center gap-1.5 rounded-full border border-line bg-panel-2 py-1 pl-1 pr-2.5 hover:bg-white/5"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-black text-gold">
          {iniciais(user.name)}
        </span>
        <span className="text-[10px] text-muted">▾</span>
      </button>

      {open && (
        <div className="animate-pop-in absolute top-[calc(100%+8px)] right-0 z-40 w-56 rounded-xl border border-line bg-panel p-1.5 shadow-2xl">
          {ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-text hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
          <div className="my-1 border-t border-line-soft" />
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
