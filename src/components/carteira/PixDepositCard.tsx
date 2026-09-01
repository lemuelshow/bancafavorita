"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";

type Charge = { externalId: string; qrcode: string; amount: number };
type Status = "idle" | "gerando" | "aguardando" | "concluido" | "falhou";

const POLL_MS = 3000;

export default function PixDepositCard({ onConfirmado }: { onConfirmado: () => void }) {
  const { token } = useAuth();
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [charge, setCharge] = useState<Charge | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function verificar(externalId: string) {
    try {
      const data = await request<{ status: string; amount: number }>(`/api/carteira/pix/deposit/${externalId}`, { token });
      if (data.status === "COMPLETED") {
        setStatus("concluido");
        if (pollRef.current) clearInterval(pollRef.current);
        onConfirmado();
      } else if (data.status === "FAILED") {
        setStatus("falhou");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      // tenta de novo no próximo ciclo
    }
  }

  async function gerarPix() {
    setErro(null);
    const amount = Number(valor.replace(",", "."));
    if (!(amount > 0)) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    setStatus("gerando");
    try {
      const data = await request<Charge>("/api/carteira/pix/deposit", {
        method: "POST",
        token,
        body: JSON.stringify({ amount }),
      });
      setCharge(data);
      const img = await QRCode.toDataURL(data.qrcode, { width: 240, margin: 1 });
      setQrImage(img);
      setStatus("aguardando");
      pollRef.current = setInterval(() => verificar(data.externalId), POLL_MS);
    } catch (err) {
      setStatus("idle");
      setErro(err instanceof Error ? err.message : "Não foi possível gerar a cobrança Pix.");
    }
  }

  function copiarCodigo() {
    if (!charge) return;
    navigator.clipboard.writeText(charge.qrcode).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function reiniciar() {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus("idle");
    setCharge(null);
    setQrImage(null);
    setValor("");
    setErro(null);
  }

  if (status === "idle" || status === "gerando") {
    return (
      <Card className="mb-6">
        <h2 className="mb-1 text-lg font-black">Depositar via Pix</h2>
        <p className="mb-4 text-sm text-muted">Gere uma cobrança Pix e o valor entra na sua carteira assim que o pagamento for confirmado.</p>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Valor (R$)</span>
          <input
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
          />
        </label>
        {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}
        <Button className="w-full" disabled={status === "gerando"} onClick={gerarPix}>
          {status === "gerando" ? "Gerando cobrança..." : "Gerar Pix"}
        </Button>
      </Card>
    );
  }

  if (status === "aguardando" && charge) {
    return (
      <Card className="mb-6 text-center">
        <h2 className="mb-1 text-lg font-black">Pague com Pix para concluir</h2>
        <p className="mb-4 text-sm text-muted">Escaneie o QR code ou copie o código para pagar no app do seu banco.</p>
        {qrImage && (
          <Image
            src={qrImage}
            alt="QR code Pix"
            width={220}
            height={220}
            unoptimized
            className="mx-auto mb-4 size-[220px] rounded-xl border border-line bg-white p-2"
          />
        )}
        <Button variant="secondary" className="w-full" onClick={copiarCodigo}>
          {copiado ? "Código copiado!" : "Copiar código Pix"}
        </Button>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gold">
          <span className="inline-block size-2 animate-pulse rounded-full bg-gold" /> Aguardando confirmação do pagamento...
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="w-full" onClick={() => verificar(charge.externalId)}>
            Já paguei, verificar
          </Button>
          <Button variant="ghost" className="w-full" onClick={reiniciar}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  if (status === "concluido") {
    return (
      <Card className="mb-6 text-center">
        <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-win/15 text-2xl text-win">✓</span>
        <h2 className="text-lg font-black">Depósito confirmado!</h2>
        <p className="mt-1 text-sm text-muted">O valor já está disponível na sua carteira.</p>
        <Button className="mt-4 w-full" onClick={reiniciar}>
          Fazer novo depósito
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mb-6 text-center">
      <h2 className="text-lg font-black text-danger">Pagamento não concluído</h2>
      <p className="mt-1 text-sm text-muted">A cobrança expirou ou foi recusada. Tente novamente.</p>
      <Button className="mt-4 w-full" onClick={reiniciar}>
        Tentar novamente
      </Button>
    </Card>
  );
}
