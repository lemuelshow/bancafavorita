"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const AUTOPLAY_MS = 5000;

/**
 * Carrossel de banners da home. Exibe apenas os banners configurados em
 * /admin/design (1 a 3). Proporção de exibição: 1200×375px (16:5) — recomendamos
 * enviar em pelo menos 2400×750px (2x) para ficar nítido em telas HiDPI. A altura
 * é fluida (aspect-ratio) para redimensionar corretamente em telas mobile.
 */
export default function HeroCarousel({ banners }: { banners: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative mx-auto aspect-[1200/375] w-full max-w-[1200px] overflow-hidden rounded-[20px] border border-line shadow-[0_16px_50px_#0004]">
      {banners.map((url, i) => (
        <Image
          key={url + i}
          src={url}
          alt={`Banner ${i + 1}`}
          fill
          unoptimized
          className={`object-cover transition-opacity duration-500 ${i === index ? "opacity-100" : "opacity-0"}`}
          priority={i === 0}
        />
      ))}

      {banners.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              aria-label={`Banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-gold" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
