"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";

export type CambistaClient = { id: string; name: string; phone: string; address: string | null };

export default function ClientesCambista({ onChange }: { onChange?: (clients: CambistaClient[]) => void }) {
  const { token } = useAuth();
  const [clients, setClients] = useState<CambistaClient[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    if (!token) return;
    const data = await request<{ clients: CambistaClient[] }>("/api/cambista/clients", { token });
    setClients(data.clients);
    onChange?.(data.clients);
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(carregar, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await request("/api/cambista/clients", {
        method: "POST",
        token,
        body: JSON.stringify({ name, phone, address }),
      });
      setName("");
      setPhone("");
      setAddress("");
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível cadastrar o cliente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <Card className="mb-6">
        <h2 className="mb-1 text-lg font-black">Cadastrar cliente</h2>
        <p className="mb-4 text-sm text-muted">
          Clientes presenciais que não têm conta própria — você aposta por eles usando seu saldo.
        </p>
        <form onSubmit={adicionar} className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Nome</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Telefone</span>
            <input
              required
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Endereço (opcional)</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
            />
          </label>
          <Button type="submit" disabled={enviando} className="sm:col-span-3">
            {enviando ? "Cadastrando..." : "Adicionar cliente"}
          </Button>
        </form>
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
      </Card>

      <h2 className="mb-3 text-lg font-black">Meus clientes</h2>
      {clients?.length === 0 && <Card className="text-center text-muted">Nenhum cliente cadastrado ainda.</Card>}
      <div className="space-y-2">
        {clients?.map((c) => (
          <div key={c.id} className="rounded-lg border border-line bg-panel-2 p-3 text-sm">
            <b>{c.name}</b>
            <p className="text-xs text-muted">
              {c.phone}
              {c.address ? ` · ${c.address}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
