import Image from "next/image";
import Card from "@/components/ui/Card";

export default function TabelasPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-black">Calendário do Bicho + Placa Mercosul</h1>
      <p className="mb-6 text-sm text-muted">
        Consulte os 25 grupos, suas dezenas e a conversão de letras para números da placa Mercosul.
      </p>
      <Card>
        <Image
          src="/tabela-bicho-mercosul.png"
          alt="Calendário do Bicho e Tabela de Placa Mercosul"
          width={1536}
          height={1024}
          className="h-auto w-full rounded-xl"
        />
      </Card>
    </div>
  );
}
