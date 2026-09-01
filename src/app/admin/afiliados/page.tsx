"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AffiliatesTable from "@/components/admin/AffiliatesTable";

export default function AdminAffiliatesPage() {
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
      <h1 className="mb-2 text-2xl font-black">Afiliados</h1>
      <p className="mb-6 text-sm text-muted">
        Configure a comissão de CPA (por cadastro indicado) e REV (% do lucro da casa) de cada afiliado.
      </p>
      <AffiliatesTable />
    </div>
  );
}
