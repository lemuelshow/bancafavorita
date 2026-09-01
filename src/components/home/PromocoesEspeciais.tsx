"use client";

import Link from "next/link";
import Image from "next/image";
import { useDesign } from "@/contexts/DesignContext";

type Promo = {
  label: string;
  destaque: string;
  descricao: string;
  icone: string;
  gradient: string;
  cta: string;
};

// Só promoções reais da plataforma — nada de cashback/clube VIP fictícios que não existem ainda.
const PROMOS: Promo[] = [
  {
    label: "Indique e ganhe",
    destaque: "Comissão por indicação",
    descricao: "Chame seus amigos pro jogo e ganhe comissão sobre as apostas de quem você indicar.",
    icone: "🎁",
    gradient: "from-[#3b1668] via-[#2a1650] to-[#1a1236]",
    cta: "Indicar agora",
  },
  {
    label: "Boas-vindas",
    destaque: "R$ 500,00",
    descricao: "Todo cadastro novo já começa com saldo de boas-vindas pra jogar na hora.",
    icone: "💰",
    gradient: "from-[#0f4d2e] via-[#0c3d26] to-[#0a2e1d]",
    cta: "Criar conta grátis",
  },
  {
    label: "Depósito via Pix",
    destaque: "Cai na hora",
    descricao: "Deposite por Pix e o saldo entra na sua carteira assim que o pagamento é confirmado.",
    icone: "⚡",
    gradient: "from-[#4a1a5c] via-[#341446] to-[#211031]",
    cta: "Começar a jogar",
  },
];

export default function PromocoesEspeciais() {
  const { promo1Url, promo2Url, promo3Url } = useDesign();
  const imagens = [promo1Url, promo2Url, promo3Url];

  return (
    <section className="mt-5">
      <span className="text-[11px] font-black tracking-[0.12em] text-gold uppercase">Promoções especiais</span>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {PROMOS.map((p, i) => {
          const imagem = imagens[i];
          if (imagem) {
            return (
              <Link
                key={p.label}
                href="/register"
                className="relative block h-40 overflow-hidden rounded-2xl bg-panel-2 transition hover:opacity-90"
              >
                <Image src={imagem} alt={p.label} fill unoptimized className="object-contain" />
              </Link>
            );
          }
          return (
            <div
              key={p.label}
              className={`relative h-40 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-4 ${p.gradient}`}
            >
              <span className="pointer-events-none absolute -right-3 -bottom-3 text-[64px] leading-none opacity-15">
                {p.icone}
              </span>
              <span className="relative text-[10px] font-black tracking-[0.1em] text-white/80 uppercase">{p.label}</span>
              <p className="relative mt-0.5 text-lg font-black text-gold">{p.destaque}</p>
              <p className="relative mt-1 line-clamp-2 text-xs text-white/70">{p.descricao}</p>
              <Link
                href="/register"
                className="relative mt-2 inline-block rounded-lg bg-gold px-3 py-1.5 text-xs font-black text-navy hover:brightness-95"
              >
                {p.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
