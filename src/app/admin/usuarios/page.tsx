"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import UsersTable from "@/components/admin/UsersTable";

export default function AdminUsersPage() {
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
      <h1 className="mb-2 text-2xl font-black">Usuários</h1>
      <p className="mb-6 text-sm text-muted">
        Gerencie clientes: torne afiliados ou cambistas, altere senhas ou bana contas.
      </p>
      <UsersTable />
    </div>
  );
}
