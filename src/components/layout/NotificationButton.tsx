"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";

export default function NotificationButton() {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      request<{ count: number }>("/api/notificacoes/count", { token })
        .then((d) => setCount(d.count))
        .catch(() => {});
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  return (
    <Link
      href="/poules"
      aria-label="Notificações"
      className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-panel-2 text-base hover:bg-white/5"
    >
      🔔
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-loss px-1 text-[10px] font-black text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
