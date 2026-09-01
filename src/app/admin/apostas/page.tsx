"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ApostasTable from "@/components/admin/ApostasTable";

export default function AdminApostasPage() {
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
      <h1 className="mb-2 text-2xl font-black">Apostas</h1>
      <p className="mb-6 text-sm text-muted">
        Todas as apostas da plataforma: quem apostou, se veio de um cambista e o status (aguardando, ganhou ou perdeu).
      </p>
      <ApostasTable />
    </div>
  );
}
