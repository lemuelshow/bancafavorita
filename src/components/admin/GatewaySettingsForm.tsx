"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";

type GatewayData = {
  veopagClientId: string;
  veopagCallbackUrl: string;
  hasClientSecret: boolean;
  hasWebhookSecret: boolean;
};

export default function GatewaySettingsForm() {
  const { token } = useAuth();
  const [data, setData] = useState<GatewayData | null>(null);
  const [clientId, setClientId] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function carregar() {
    if (!token) return;
    const d = await request<GatewayData>("/api/admin/gateway", { token });
    setData(d);
    setClientId(d.veopagClientId);
    setCallbackUrl(d.veopagCallbackUrl);
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(carregar, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function salvar(extra: Record<string, boolean> = {}) {
    setErro(null);
    setSucesso(false);
    setSalvando(true);
    try {
      await request("/api/admin/gateway", {
        method: "POST",
        token,
        body: JSON.stringify({
          veopagClientId: clientId,
          veopagCallbackUrl: callbackUrl,
          veopagClientSecret: clientSecret,
          veopagWebhookSecret: webhookSecret,
          ...extra,
        }),
      });
      setClientSecret("");
      setWebhookSecret("");
      setSucesso(true);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (!data) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <Card>
      <h2 className="mb-1 text-lg font-black">VeoPag — credenciais Pix</h2>
      <p className="mb-5 text-sm text-muted">
        Gere as credenciais em{" "}
        <span className="font-mono text-gold">dashboard.veopag.com/credentials</span>. Sem sandbox — o ambiente é de
        produção, então teste com um valor pequeno.
      </p>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Client ID</span>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="client_id"
            className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
          />
        </label>

        <div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Client Secret</span>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={data.hasClientSecret ? "•••••••••••••• (configurado — deixe em branco para manter)" : "client_secret"}
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
            />
          </label>
          {data.hasClientSecret && (
            <button
              type="button"
              disabled={salvando}
              onClick={() => salvar({ clearClientSecret: true })}
              className="mt-1.5 text-xs font-bold text-danger hover:underline"
            >
              Remover client secret
            </button>
          )}
        </div>

        <div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Webhook Secret</span>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={data.hasWebhookSecret ? "•••••••••••••• (configurado — deixe em branco para manter)" : "webhook_secret"}
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">Em Settings → Credentials no dashboard VeoPag.</p>
          {data.hasWebhookSecret && (
            <button
              type="button"
              disabled={salvando}
              onClick={() => salvar({ clearWebhookSecret: true })}
              className="mt-1.5 text-xs font-bold text-danger hover:underline"
            >
              Remover webhook secret
            </button>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">URL de callback (webhook)</span>
          <input
            value={callbackUrl}
            onChange={(e) => setCallbackUrl(e.target.value)}
            placeholder="https://seusite.com/api/pix/webhook"
            className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
          />
          <span className="mt-1.5 block text-xs text-muted">
            Cadastre essa mesma URL no painel VeoPag para receber as confirmações de pagamento.
          </span>
        </label>
      </div>

      {erro && <p className="mt-4 text-sm text-danger">{erro}</p>}
      {sucesso && <p className="mt-4 text-sm text-win">Credenciais salvas.</p>}

      <Button className="mt-5 w-full" disabled={salvando} onClick={() => salvar()}>
        {salvando ? "Salvando..." : "Salvar credenciais"}
      </Button>
    </Card>
  );
}
