"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import PouleBuilder, { type DrawOption } from "@/components/poule/PouleBuilder";
import HeroCarousel from "@/components/home/HeroCarousel";
import WinnersMarquee from "@/components/home/WinnersMarquee";
import ProximosSorteiosList, { type ProximoSorteio } from "@/components/home/ProximosSorteiosList";
import ResultadosRecentesList, { type ResultadoRecente } from "@/components/home/ResultadosRecentesList";
import PromocoesEspeciais from "@/components/home/PromocoesEspeciais";
import RightSidebar from "@/components/dashboard/RightSidebar";
import AccountDrawer from "@/components/dashboard/AccountDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { useDesign } from "@/contexts/DesignContext";
import { listUpcomingDraws } from "@/lib/lotteries";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [painelAberto, setPainelAberto] = useState(false);

  useEffect(() => {
    if (!loading && user?.isAdmin) router.replace("/admin");
  }, [loading, user, router]);

  if (loading) return null;

  if (user && !user.isAdmin) {
    const draws: DrawOption[] = listUpcomingDraws().map((d) => ({
      lottery: d.lottery,
      date: d.date,
      time: d.time,
      drawAt: d.drawAt.toISOString(),
      closesAt: d.closesAt.toISOString(),
    }));
    return (
      <div>
        <div id="montar-poule" className="min-w-0 lg:pr-[335px]">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <h1 className="text-2xl font-black">Montar Pôule</h1>
            <button
              onClick={() => setPainelAberto(true)}
              className="rounded-full border border-line bg-panel-2 px-4 py-2 text-xs font-bold text-gold hover:bg-white/5"
            >
              Meu painel
            </button>
          </div>
          <h1 className="mb-6 hidden text-2xl font-black lg:block">Montar Pôule</h1>
          <PouleBuilder draws={draws} balance={user.balance} />
        </div>

        <div className="hidden lg:block lg:fixed lg:top-[73px] lg:right-[5px] lg:z-10 lg:w-[300px] lg:max-h-[calc(100vh-78px)] lg:overflow-y-auto xl:w-[320px]">
          <RightSidebar />
        </div>

        <AccountDrawer open={painelAberto} onClose={() => setPainelAberto(false)}>
          {painelAberto && <RightSidebar />}
        </AccountDrawer>
      </div>
    );
  }

  if (user?.isAdmin) return null;

  return <PublicHome />;
}

function PublicHome() {
  const { banner1Url, banner2Url, banner3Url } = useDesign();
  const [proximosSorteios, setProximosSorteios] = useState<ProximoSorteio[] | null>(null);
  const [resultadosRecentes, setResultadosRecentes] = useState<ResultadoRecente[] | null>(null);
  const banners = [banner1Url, banner2Url, banner3Url].filter((b): b is string => !!b);

  useEffect(() => {
    const id = setTimeout(() => {
      fetch("/api/home/resumo-publico")
        .then((r) => r.json())
        .then((data) => {
          setProximosSorteios(data.proximosSorteios ?? []);
          setResultadosRecentes(data.resultadosRecentes ?? []);
        })
        .catch(() => {
          setProximosSorteios([]);
          setResultadosRecentes([]);
        });
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div>
      <div className="mx-auto max-w-[1200px]">
        {banners.length > 0 ? (
          <HeroCarousel banners={banners} />
        ) : (
          <Card className="relative overflow-hidden text-center bg-[radial-gradient(circle_at_15%_20%,#174d9b,#071a39_58%,#06142b)] py-14">
            <span className="pointer-events-none absolute -bottom-8 right-6 select-none text-[190px] font-black leading-none text-white/[0.03]">
              BF
            </span>
            <Image src="/logo.png" alt="Banca Favorita" width={150} height={150} className="relative z-10 mx-auto mb-6 w-[130px] object-contain" />
            <span className="relative z-10 text-[11px] font-black tracking-[0.12em] text-gold uppercase">
              A sua banca de confiança
            </span>
            <h1 className="relative z-10 mt-2 text-4xl font-black leading-tight">Banca Favorita</h1>
            <p className="relative z-10 mt-3 text-xl font-black text-gold">
              Segurança para jogar, confiança para receber. Recebimento imediato.
            </p>
            <p className="relative z-10 mx-auto mt-4 max-w-lg text-sm text-muted">
              Consulte os últimos resultados sem precisar entrar. Para montar seu pôule, faça login ou cadastre-se.
            </p>
          </Card>
        )}

        <WinnersMarquee />
      </div>

      <div className="mx-auto max-w-[1200px]">
        <section id="resultados" className="mt-5 grid gap-5 scroll-mt-6 lg:grid-cols-2">
          <ProximosSorteiosList items={proximosSorteios} />
          <ResultadosRecentesList items={resultadosRecentes} />
        </section>

        <PromocoesEspeciais />
      </div>
    </div>
  );
}
