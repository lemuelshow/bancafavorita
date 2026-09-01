"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DesignUploader from "@/components/admin/DesignUploader";

export default function AdminDesignPage() {
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
      <h1 className="mb-2 text-2xl font-black">Design</h1>
      <p className="mb-6 text-sm text-muted">
        Personalize a identidade visual do site anexando suas próprias imagens.
      </p>
      <DesignUploader />
    </div>
  );
}
