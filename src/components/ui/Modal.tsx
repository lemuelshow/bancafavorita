"use client";

import { type ReactNode, useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl border border-line bg-panel p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          {title ? <h2 className="text-lg font-black">{title}</h2> : <span />}
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-1.5 text-muted hover:bg-white/10 hover:text-text">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
