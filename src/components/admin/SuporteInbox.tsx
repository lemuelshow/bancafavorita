"use client";

import { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";

type Conversa = { userId: string; name: string; phone: string; ultimaMensagem: string; ultimoRemetente: string; atualizadoEm: string | null };
type Mensagem = { id: string; sender: string; message: string; createdAt: string };

const POLL_MS = 5000;

export default function SuporteInbox() {
  const { token } = useAuth();
  const [conversas, setConversas] = useState<Conversa[] | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [cliente, setCliente] = useState<{ name: string; phone: string } | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  async function carregarConversas() {
    if (!token) return;
    const data = await request<{ conversas: Conversa[] }>("/api/admin/suporte", { token });
    setConversas(data.conversas);
  }

  async function carregarThread(userId: string) {
    if (!token) return;
    const data = await request<{ cliente: { name: string; phone: string }; mensagens: Mensagem[] }>(
      `/api/admin/suporte/${userId}`,
      { token }
    );
    setCliente(data.cliente);
    setMensagens(data.mensagens);
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(carregarConversas, 0);
    const poll = setInterval(carregarConversas, POLL_MS);
    return () => {
      clearTimeout(id);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!selecionado) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da conversa selecionada, não há dado a derivar do estado anterior.
    carregarThread(selecionado);
    const poll = setInterval(() => carregarThread(selecionado), POLL_MS);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionado, token]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!selecionado) return;
    const message = texto.trim();
    if (!message) return;
    setEnviando(true);
    try {
      await request(`/api/admin/suporte/${selecionado}`, { method: "POST", token, body: JSON.stringify({ message }) });
      setTexto("");
      await carregarThread(selecionado);
      await carregarConversas();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="p-0">
        <div className="max-h-[560px] overflow-y-auto">
          {conversas === null && <p className="p-4 text-center text-sm text-muted">Carregando...</p>}
          {conversas !== null && conversas.length === 0 && (
            <p className="p-4 text-center text-sm text-muted">Nenhuma conversa ainda.</p>
          )}
          {conversas?.map((c) => (
            <button
              key={c.userId}
              onClick={() => setSelecionado(c.userId)}
              className={`block w-full border-b border-line-soft p-3 text-left hover:bg-white/5 ${
                selecionado === c.userId ? "bg-white/5" : ""
              }`}
            >
              <b className="text-sm">{c.name}</b>
              <p className="truncate text-xs text-muted">
                {c.ultimoRemetente === "equipe" ? "Você: " : ""}
                {c.ultimaMensagem}
              </p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex h-[560px] flex-col p-0">
        {!selecionado ? (
          <p className="m-auto text-sm text-muted">Selecione uma conversa.</p>
        ) : (
          <>
            <div className="border-b border-line-soft p-3">
              <b className="text-sm">{cliente?.name}</b>
              <p className="text-xs text-muted">{cliente?.phone}</p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {mensagens?.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "equipe" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                      m.sender === "equipe" ? "bg-gold text-navy" : "border border-line bg-panel-2 text-text"
                    }`}
                  >
                    {m.message}
                    <p className={`mt-1 text-[10px] ${m.sender === "equipe" ? "text-navy/60" : "text-muted"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={fimRef} />
            </div>
            <form onSubmit={enviar} className="flex gap-2 border-t border-line-soft p-3">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Responder..."
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-2.5 text-sm"
              />
              <Button size="sm" type="submit" disabled={enviando || !texto.trim()}>
                Enviar
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
