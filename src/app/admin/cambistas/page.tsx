"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import CambistasTable from "@/components/admin/CambistasTable";
import CambistaBetsTable from "@/components/admin/CambistaBetsTable";

export default function AdminCambistasPage() {
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
      <h1 className="mb-2 text-2xl font-black">Cambistas</h1>
      <p className="mb-6 text-sm text-muted">
        Configure a comissão (%) que cada cambista recebe sobre o valor apostado pelos jogadores que ele indicou.
      </p>
      <CambistasTable />

      <h2 className="mt-10 mb-2 text-lg font-black">Apostas de cambistas</h2>
      <p className="mb-4 text-sm text-muted">
        Apostas feitas pelos cambistas — em nome próprio ou de um cliente cadastrado. Ganhos são destacados.
      </p>
      <CambistaBetsTable />
    </div>
  );
}
