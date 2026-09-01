"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useDesign } from "@/contexts/DesignContext";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB

type Field =
  | "logoUrl"
  | "loginImageUrl"
  | "registerImageUrl"
  | "banner1Url"
  | "banner2Url"
  | "banner3Url"
  | "promo1Url"
  | "promo2Url"
  | "promo3Url";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function UploadCard({
  field,
  title,
  helpText,
  currentUrl,
  aspectClass,
}: {
  field: Field;
  title: string;
  helpText: string;
  currentUrl: string | null;
  aspectClass: string;
}) {
  const { token } = useAuth();
  const { refresh } = useDesign();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(value: string | null) {
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/admin/design", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      await refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErro("Imagem muito grande — máximo 4MB.");
      return;
    }
    const dataUrl = await readAsDataUrl(file);
    await salvar(dataUrl);
  }

  return (
    <div className="rounded-2xl border border-line bg-panel-2 p-5">
      <h3 className="font-black">{title}</h3>
      <p className="mt-1 mb-4 text-xs text-muted">{helpText}</p>

      <div className={`relative mb-4 w-full overflow-hidden rounded-xl border border-line bg-navy ${aspectClass}`}>
        {currentUrl ? (
          <Image src={currentUrl} alt={title} fill className="object-contain" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">Padrão do sistema</div>
        )}
      </div>

      {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}

      <div className="flex gap-2">
        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" id={`file-${field}`} />
        <Button size="sm" disabled={enviando} onClick={() => inputRef.current?.click()}>
          {enviando ? "Enviando..." : "Anexar imagem"}
        </Button>
        {currentUrl && (
          <Button size="sm" variant="secondary" disabled={enviando} onClick={() => salvar(null)}>
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

function SupportChatUrlField() {
  const { token } = useAuth();
  const { supportChatUrl, refresh } = useDesign();
  const [valor, setValor] = useState(supportChatUrl ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza o campo com o valor vindo do contexto (ex.: após refresh externo).
    setValor(supportChatUrl ?? "");
  }, [supportChatUrl]);

  async function salvar() {
    setErro(null);
    setSucesso(false);
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/design", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ supportChatUrl: valor.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      await refresh();
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 font-black">Chat de suporte</h2>
      <p className="mb-4 text-xs text-muted">
        Cole aqui o link do seu atendimento (WhatsApp, Tawk.to, Crisp, Zendesk etc.). Ao configurar, o botão
        &quot;Abrir chat&quot; do menu lateral leva direto para essa URL em vez do chat interno.
      </p>
      <div className="flex max-w-lg gap-2">
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="https://wa.me/5583999999999"
          className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3 text-sm"
        />
        <Button size="sm" disabled={salvando} onClick={salvar}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {erro && <p className="mt-2 text-sm text-danger">{erro}</p>}
      {sucesso && <p className="mt-2 text-sm text-win">Salvo.</p>}
    </div>
  );
}

export default function DesignUploader() {
  const { logoUrl, loginImageUrl, registerImageUrl, banner1Url, banner2Url, banner3Url, promo1Url, promo2Url, promo3Url } =
    useDesign();

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-3">
        <UploadCard
          field="logoUrl"
          title="Logo do site"
          helpText="Aparece na barra lateral e no topo mobile. Recomendado: PNG com fundo transparente, quadrado (ex.: 512×512px)."
          currentUrl={logoUrl}
          aspectClass="aspect-square"
        />
        <UploadCard
          field="loginImageUrl"
          title="Imagem da tela de Entrar"
          helpText="Substitui o texto do painel de login. Exibido em 440×660px — recomendado enviar em pelo menos 880×1320px (mesma proporção), JPG ou PNG."
          currentUrl={loginImageUrl}
          aspectClass="aspect-[440/660]"
        />
        <UploadCard
          field="registerImageUrl"
          title="Imagem da tela de Cadastrar"
          helpText="Substitui o texto do painel de cadastro. Exibido em 440×660px — recomendado enviar em pelo menos 880×1320px (mesma proporção), JPG ou PNG."
          currentUrl={registerImageUrl}
          aspectClass="aspect-[440/660]"
        />
      </div>

      <div>
        <h2 className="mb-1 font-black">Carrossel da home (banners)</h2>
        <p className="mb-4 text-xs text-muted">
          Substitui o texto de boas-vindas da página inicial por um carrossel de imagens. Proporção 1200×375px
          (16:5) — recomendado enviar em pelo menos 2400×750px (mesma proporção, retina), JPG ou PNG. A largura
          se ajusta automaticamente em telas menores, mantendo a mesma proporção (sem cortar a imagem).
          Configure de 1 a 3 banners; sem nenhum, a home volta a mostrar o texto padrão.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <UploadCard
            field="banner1Url"
            title="Banner 1"
            helpText="Primeiro slide do carrossel."
            currentUrl={banner1Url}
            aspectClass="aspect-[1200/375]"
          />
          <UploadCard
            field="banner2Url"
            title="Banner 2"
            helpText="Segundo slide do carrossel."
            currentUrl={banner2Url}
            aspectClass="aspect-[1200/375]"
          />
          <UploadCard
            field="banner3Url"
            title="Banner 3"
            helpText="Terceiro slide do carrossel."
            currentUrl={banner3Url}
            aspectClass="aspect-[1200/375]"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-1 font-black">Promoções especiais (imagens clicáveis)</h2>
        <p className="mb-4 text-xs text-muted">
          Substitui os cards de texto da seção &quot;Promoções especiais&quot; da home por imagens clicáveis —
          cada uma leva para a tela de cadastro. Proporção 500×300px (5:3) — recomendado enviar em pelo menos
          1000×600px (retina), JPG ou PNG. Sem imagem em um card, ele volta a mostrar o texto padrão.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <UploadCard
            field="promo1Url"
            title="Promoção 1"
            helpText="Primeiro card — hoje: Indique e ganhe."
            currentUrl={promo1Url}
            aspectClass="aspect-[5/3]"
          />
          <UploadCard
            field="promo2Url"
            title="Promoção 2"
            helpText="Segundo card — hoje: Boas-vindas."
            currentUrl={promo2Url}
            aspectClass="aspect-[5/3]"
          />
          <UploadCard
            field="promo3Url"
            title="Promoção 3"
            helpText="Terceiro card — hoje: Depósito via Pix."
            currentUrl={promo3Url}
            aspectClass="aspect-[5/3]"
          />
        </div>
      </div>

      <SupportChatUrlField />
    </div>
  );
}
