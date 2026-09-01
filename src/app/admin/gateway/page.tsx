"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import GatewaySettingsForm from "@/components/admin/GatewaySettingsForm";

export default function AdminGatewayPage() {
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
      <h1 className="mb-2 text-2xl font-black">Gateway</h1>
      <p className="mb-6 text-sm text-muted">Configure as credenciais do gateway de pagamento Pix.</p>
      <GatewaySettingsForm />
    </div>
  );
}
