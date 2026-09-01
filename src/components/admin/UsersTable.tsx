"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";
import { formatCpf } from "@/lib/cpf";

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf: string;
  balance: string;
  isAffiliate: boolean;
  isCambista: boolean;
  bannedAt: string | null;
  createdAt: string;
};

export default function UsersTable() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [senhaModal, setSenhaModal] = useState<UserRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function carregar(targetPage: number, query: string) {
    if (!token) return;
    const params = new URLSearchParams({ page: String(targetPage) });
    if (query) params.set("q", query);
    const data = await request<{ users: UserRow[]; total: number; pageSize: number }>(
      `/api/admin/users?${params.toString()}`,
      { token }
    );
    setUsers(data.users);
    setTotal(data.total);
    setPageSize(data.pageSize);
    setPage(targetPage);
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => carregar(1, ""), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function toggleAfiliado(u: UserRow) {
    setBusyId(u.id);
    try {
      await request(`/api/admin/users/${u.id}/toggle-affiliate`, { method: "POST", token });
      await carregar(page, q);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleCambista(u: UserRow) {
    setBusyId(u.id);
    try {
      await request(`/api/admin/users/${u.id}/toggle-cambista`, { method: "POST", token });
      await carregar(page, q);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleBan(u: UserRow) {
    setBusyId(u.id);
    try {
      await request(`/api/admin/users/${u.id}/ban`, { method: "POST", token });
      await carregar(page, q);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && carregar(1, q)}
          placeholder="Buscar por nome, e-mail, celular ou CPF"
          className="w-full max-w-sm rounded-lg border border-[#2d619f] bg-panel-2 p-3 text-sm"
        />
        <Button size="sm" variant="secondary" onClick={() => carregar(1, q)}>
          Buscar
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Saldo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-line bg-panel last:border-0">
                <td className="px-4 py-3">
                  <b>{u.name}</b>
                  <p className="text-xs text-muted">{formatCpf(u.cpf)}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {u.phone}
                  <br />
                  {u.email ?? "—"}
                </td>
                <td className="px-4 py-3">{formatBRL(Number(u.balance))}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.isAffiliate && <Badge tone="pending">Afiliado</Badge>}
                    {u.isCambista && <Badge tone="pending">Cambista</Badge>}
                    {u.bannedAt && <Badge tone="loss">Banido</Badge>}
                    {!u.isAffiliate && !u.isCambista && !u.bannedAt && <Badge tone="muted">Ativo</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" disabled={busyId === u.id} onClick={() => toggleAfiliado(u)}>
                      {u.isAffiliate ? "Remover afiliado" : "Tornar afiliado"}
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busyId === u.id} onClick={() => toggleCambista(u)}>
                      {u.isCambista ? "Remover cambista" : "Tornar cambista"}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setSenhaModal(u)}>
                      Alterar senha
                    </Button>
                    <Button
                      size="sm"
                      variant={u.bannedAt ? "secondary" : "ghost"}
                      className={u.bannedAt ? "" : "text-danger hover:bg-danger/10"}
                      disabled={busyId === u.id}
                      onClick={() => toggleBan(u)}
                    >
                      {u.bannedAt ? "Desbanir" : "Banir usuário"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users !== null && users.length === 0 && (
        <Card className="mt-4 text-center text-muted">Nenhum usuário encontrado.</Card>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => carregar(page - 1, q)}>
            ← Anterior
          </Button>
          <span className="text-sm text-muted">
            Página {page} de {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => carregar(page + 1, q)}>
            Próxima →
          </Button>
        </div>
      )}

      {senhaModal && (
        <TrocarSenhaModal
          user={senhaModal}
          onClose={() => setSenhaModal(null)}
        />
      )}
    </div>
  );
}

function TrocarSenhaModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const { token } = useAuth();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function salvar() {
    setErro(null);
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      await request(`/api/admin/users/${user.id}/password`, {
        method: "POST",
        token,
        body: JSON.stringify({ password: senha }),
      });
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Alterar senha — ${user.name}`}>
      {sucesso ? (
        <div className="text-center">
          <p className="mb-4 text-sm text-win">Senha alterada com sucesso.</p>
          <Button className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      ) : (
        <>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Nova senha</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
            />
          </label>
          {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}
          <Button className="w-full" disabled={enviando} onClick={salvar}>
            {enviando ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </>
      )}
    </Modal>
  );
}
