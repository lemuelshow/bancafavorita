import Image from "next/image";
import { useDesign } from "@/contexts/DesignContext";

/**
 * Painel de marca das telas de Entrar/Cadastrar. Tamanho fixo (440×660px) — igual ao
 * card do formulário nas duas telas (a altura foi calculada pelo formulário de
 * Cadastro, o mais alto dos dois). A imagem enviada pelo admin em /admin/design é
 * recortada com object-cover para preencher esse espaço; recomendamos enviar em pelo
 * menos 1200×1800px (mesma proporção, 2:3) para ficar nítida.
 */
export default function AuthBrandPanel({ variant }: { variant: "login" | "register" }) {
  const { logoUrl, loginImageUrl, registerImageUrl } = useDesign();
  const imageUrl = variant === "login" ? loginImageUrl : registerImageUrl;

  return (
    <div className="hidden h-[660px] w-[440px] shrink-0 overflow-hidden rounded-[20px] border border-line shadow-[0_16px_50px_#0004] lg:block">
      <div className="relative h-full w-full">
        {imageUrl ? (
          <Image src={imageUrl} alt="Banca Favorita" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#174d9b,#0a2348_50%,#071a39_80%)] p-8 text-center">
            <Image
              src={logoUrl ?? "/logo.png"}
              alt="Banca Favorita"
              width={200}
              height={200}
              unoptimized={!!logoUrl}
              className="mb-6 w-[min(200px,65%)] object-contain"
            />
            <p className="max-w-[300px] text-lg font-black text-gold">
              Segurança para jogar, confiança para receber. Recebimento imediato.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
