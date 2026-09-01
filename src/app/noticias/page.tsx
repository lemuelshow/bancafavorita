"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";

export default function NoticiasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-black">Notícias</h1>
      <p className="mb-6 text-sm text-muted">Novidades, avisos e atualizações da Banca Favorita.</p>

      <Card className="text-center text-muted">Nenhuma notícia publicada no momento. Volte em breve.</Card>
    </div>
  );
}
