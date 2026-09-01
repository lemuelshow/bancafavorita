"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import FinanceiroDashboard from "@/components/admin/FinanceiroDashboard";
import TransacoesTable from "@/components/admin/TransacoesTable";

export default function AdminFinanceiroPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.isAdmin) router.replace("/");
  }, [loading, user, router]);

  if (!user?.isAdmin) return null;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-black">Financeiro</h1>
      <p className="mb-6 text-sm text-muted">
        Visão geral do caixa: depósitos, prêmios pagos, comissões de cambistas e afiliados.
      </p>

      <FinanceiroDashboard />

      <h2 className="mt-10 mb-4 text-lg font-black">Todas as entradas</h2>
      <TransacoesTable />
    </div>
  );
}
