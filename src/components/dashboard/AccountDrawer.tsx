"use client";

import { type ReactNode, useEffect } from "react";

export default function AccountDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-[320px] max-w-[88vw] overflow-y-auto border-l border-line bg-navy p-4 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">Meu painel</h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-1.5 text-muted hover:bg-white/10 hover:text-text">
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
