"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminResultadosClient from "@/components/admin/AdminResultadosClient";

export default function AdminResultadosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.isAdmin) router.replace("/");
  }, [loading, user, router]);

  if (!user?.isAdmin) return null;

  return <AdminResultadosClient />;
}
