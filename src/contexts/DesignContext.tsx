"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type DesignSettings = {
  logoUrl: string | null;
  loginImageUrl: string | null;
  registerImageUrl: string | null;
  banner1Url: string | null;
  banner2Url: string | null;
  banner3Url: string | null;
  promo1Url: string | null;
  promo2Url: string | null;
  promo3Url: string | null;
  supportChatUrl: string | null;
};

type DesignContextValue = DesignSettings & { loading: boolean; refresh: () => Promise<void> };

const DEFAULTS: DesignSettings = {
  logoUrl: null,
  loginImageUrl: null,
  registerImageUrl: null,
  banner1Url: null,
  banner2Url: null,
  banner3Url: null,
  promo1Url: null,
  promo2Url: null,
  promo3Url: null,
  supportChatUrl: null,
};

const DesignContext = createContext<DesignContextValue | null>(null);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DesignSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/design", { cache: "no-store" });
      const data = await res.json();
      setSettings({
        logoUrl: data.logoUrl ?? null,
        loginImageUrl: data.loginImageUrl ?? null,
        registerImageUrl: data.registerImageUrl ?? null,
        banner1Url: data.banner1Url ?? null,
        banner2Url: data.banner2Url ?? null,
        banner3Url: data.banner3Url ?? null,
        promo1Url: data.promo1Url ?? null,
        promo2Url: data.promo2Url ?? null,
        promo3Url: data.promo3Url ?? null,
        supportChatUrl: data.supportChatUrl ?? null,
      });
    } catch {
      // silencioso: mantém os padrões
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(refresh, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  const value = useMemo<DesignContextValue>(() => ({ ...settings, loading, refresh }), [settings, loading, refresh]);

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign(): DesignContextValue {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error("useDesign deve ser usado dentro de <DesignProvider>");
  return ctx;
}
