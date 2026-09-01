"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ClientesCambista from "@/components/cambista/ClientesCambista";
import ResumoCambista from "@/components/dashboard/ResumoCambista";

export default function CambistaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.isCambista) router.replace("/");
  }, [loading, user, router]);

  if (!user?.isCambista) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <h1 className="mb-2 text-2xl font-black">Área do Cambista</h1>
        <p className="mb-6 text-sm text-muted">
          Cadastre clientes presenciais e aposte por eles — você recebe comissão sobre cada jogo que passar.
        </p>
        <ClientesCambista />
      </div>
      <div className="lg:sticky lg:top-[84px] lg:self-start">
        <ResumoCambista />
      </div>
    </div>
  );
}
