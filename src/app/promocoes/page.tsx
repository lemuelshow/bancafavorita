"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { formatBRL } from "@/lib/format";

export default function PromocoesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-black">Promoções</h1>
      <p className="mb-6 text-sm text-muted">O que está rolando na Banca Favorita agora.</p>

      <Card className="mb-4">
        <span className="mb-1 block text-[11px] font-black tracking-[0.12em] text-gold uppercase">Boas-vindas</span>
        <h2 className="text-lg font-black">Bônus de cadastro</h2>
        <p className="mt-1 text-sm text-muted">
          Todo novo cadastro na Banca Favorita já recebe {formatBRL(500)} de saldo simulado para começar a jogar.
        </p>
      </Card>

      {user.isAffiliate && (
        <Link href="/afiliado" className="mb-4 block">
          <Card className="hover:border-gold/50">
            <span className="mb-1 block text-[11px] font-black tracking-[0.12em] text-gold uppercase">Afiliado</span>
            <h2 className="text-lg font-black">Seu programa de indicação</h2>
            <p className="mt-1 text-sm text-muted">
              Acompanhe seu link, seus indicados e suas comissões de CPA e REV.
            </p>
          </Card>
        </Link>
      )}

      {user.isCambista && (
        <Link href="/cambista" className="mb-4 block">
          <Card className="hover:border-gold/50">
            <span className="mb-1 block text-[11px] font-black tracking-[0.12em] text-gold uppercase">Cambista</span>
            <h2 className="text-lg font-black">Sua área de cambista</h2>
            <p className="mt-1 text-sm text-muted">Cadastre clientes e acompanhe suas comissões.</p>
          </Card>
        </Link>
      )}

      {!user.isAffiliate && !user.isCambista && (
        <Card className="text-center text-sm text-muted">
          Quer ganhar comissão indicando amigos? Fale com nosso suporte para saber mais sobre os programas de
          afiliado e cambista.
        </Card>
      )}
    </div>
  );
}
