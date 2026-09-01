"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useDesign } from "@/contexts/DesignContext";
import Button from "@/components/ui/Button";
import NextDrawCountdown from "@/components/layout/NextDrawCountdown";
import UserBalance from "@/components/layout/UserBalance";
import NotificationButton from "@/components/layout/NotificationButton";
import UserDropdown from "@/components/layout/UserDropdown";
import SupportWidget from "@/components/layout/SupportWidget";
import type { PublicUser } from "@/lib/types";

type NavLink = { href: string; label: string; icon: string; hideOnDesktop?: boolean; badge?: string };

function navFor(user: PublicUser | null): NavLink[] {
  if (!user) {
    return [
      { href: "/", label: "Início", icon: "🏠" },
      { href: "/resultados", label: "Resultados", icon: "📊" },
      { href: "/tabelas", label: "Tabelas", icon: "📋" },
      { href: "/login", label: "Entrar", icon: "🔑", hideOnDesktop: true },
      { href: "/register", label: "Cadastrar", icon: "📝", hideOnDesktop: true },
    ];
  }
  if (user.isAdmin) {
    return [
      { href: "/admin", label: "Painel", icon: "🏠" },
      { href: "/admin/resultados", label: "Resultados / Extrações", icon: "🎯" },
      { href: "/admin/apostas", label: "Apostas", icon: "🎟️" },
      { href: "/admin/usuarios", label: "Usuários", icon: "👥" },
      { href: "/admin/afiliados", label: "Afiliados", icon: "🤝" },
      { href: "/admin/cambistas", label: "Cambistas", icon: "💼" },
      { href: "/admin/financeiro", label: "Financeiro", icon: "💰" },
      { href: "/admin/gateway", label: "Gateway", icon: "🔌" },
      { href: "/admin/design", label: "Design", icon: "🎨" },
      { href: "/admin/suporte", label: "Atendimento", icon: "🎧" },
      { href: "/resultados", label: "Resultados públicos", icon: "📊" },
    ];
  }
  return [
    { href: "/", label: "Início", icon: "🏠" },
    { href: "/poules", label: "Meus Pôules", icon: "🎟️" },
    { href: "/poules/resolvidas", label: "Apostas Resolvidas", icon: "✅" },
    { href: "/carteira", label: "Carteira", icon: "💳" },
    { href: "/extratos", label: "Extratos", icon: "📄" },
    { href: "/resultados", label: "Resultados", icon: "📊" },
    { href: "/tabelas", label: "Tabelas", icon: "📋" },
    { href: "/ranking", label: "Ranking", icon: "🏆" },
    { href: "/promocoes", label: "Promoções", icon: "🎁", badge: "NOVO" },
    { href: "/noticias", label: "Notícias", icon: "📰" },
    ...(user.isAffiliate ? [{ href: "/afiliado", label: "Afiliado", icon: "🤝" } satisfies NavLink] : []),
    ...(user.isCambista ? [{ href: "/cambista", label: "Cambista", icon: "💼" } satisfies NavLink] : []),
    { href: "/perfil", label: "Perfil", icon: "👤" },
  ];
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { logoUrl } = useDesign();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = navFor(user);

  function handleLogout() {
    logout();
    setOpen(false);
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-line bg-gradient-to-b from-[#06142b] to-[#071b39] p-4 transition-transform lg:translate-x-0 print:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/" className="mb-6 flex items-center gap-3 px-2" onClick={() => setOpen(false)}>
          <Image src={logoUrl ?? "/logo.png"} alt="Banca Favorita" width={480} height={480} className="h-auto w-full object-contain" />
        </Link>

        <nav className="no-scrollbar flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-[7px] text-[13px] text-[#dfeaff] hover:border-line hover:bg-[#0e2c59] ${
                link.hideOnDesktop ? "lg:hidden" : ""
              }`}
            >
              <span className="w-4 text-center text-sm text-gold">{link.icon}</span>
              {link.label}
              {link.badge && (
                <span className="ml-auto rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-black text-gold">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
          {!loading && user && (
            <button
              onClick={handleLogout}
              className="mt-1 flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-[7px] text-left text-[13px] text-[#dfeaff] hover:border-line hover:bg-[#0e2c59] lg:hidden"
            >
              <span className="w-4 text-center text-sm text-gold">🚪</span>
              Sair
            </button>
          )}
        </nav>

        <div className="mt-3 shrink-0 border-t border-line-soft pt-3">
          {!loading && (!user || !user.isAdmin) ? (
            <SupportWidget />
          ) : (
            <small className="text-muted">Simulação local • sem Pix real</small>
          )}
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <header className="fixed inset-x-0 top-0 z-30 flex h-24 items-center justify-between border-b border-line bg-[#06142b] px-4 print:hidden lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoUrl ?? "/logo.png"}
            alt="Banca Favorita"
            width={80}
            height={80}
            className="size-20 rounded-lg object-contain"
          />
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-[#2b568e] bg-[#0e2c59] text-xl"
          aria-label="Menu"
        >
          ☰
        </button>
      </header>

      <div className="fixed inset-x-0 top-24 z-20 flex h-9 items-center justify-center border-b border-line bg-[#06142b]/95 px-2 print:hidden lg:hidden">
        <NextDrawCountdown compact />
      </div>

      {!loading && (
        <div className="fixed inset-x-0 top-0 z-20 hidden h-[68px] grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-navy/90 px-8 backdrop-blur print:hidden lg:left-[250px] lg:grid">
          <div />
          <div className="flex justify-center">
            <NextDrawCountdown />
          </div>
          <div className="flex items-center justify-end gap-3">
            {user ? (
              <>
                <UserBalance balance={user.balance} />
                <NotificationButton />
                <UserDropdown user={user} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm" variant="ghost">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Cadastrar</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className="pt-[132px] pb-[76px] print:pt-0 print:pb-0 lg:ml-[250px] lg:pt-[68px] lg:pb-0 print:lg:ml-0">
        <main className="mx-auto max-w-[1440px] px-4 py-8 print:max-w-none print:px-0 print:py-0 lg:px-9 lg:py-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[64px] items-stretch border-t border-line bg-[#06142b] pb-[env(safe-area-inset-bottom)] print:hidden lg:hidden">
        {links.slice(0, 4).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] text-[#9db3d6] active:text-gold"
          >
            <span className="text-lg text-gold">{link.icon}</span>
            {link.label}
          </Link>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] text-[#9db3d6]"
        >
          <span className="text-lg text-gold">☰</span>
          Mais
        </button>
      </nav>
    </div>
  );
}
