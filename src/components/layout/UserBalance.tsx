import Link from "next/link";
import Button from "@/components/ui/Button";
import { formatBRL } from "@/lib/format";

export default function UserBalance({ balance }: { balance: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-full border border-line bg-panel-2 px-4 py-1.5 leading-tight">
        <p className="text-[10px] text-muted">Saldo disponível</p>
        <p className="text-sm font-black text-gold">{formatBRL(balance)}</p>
      </div>
      <Link href="/carteira">
        <Button size="sm">Depositar</Button>
      </Link>
    </div>
  );
}
