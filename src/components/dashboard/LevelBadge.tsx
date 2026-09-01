import Image from "next/image";
import type { LevelTier } from "@/lib/levels";

export default function LevelBadge({ tier, size = 20 }: { tier: LevelTier; size?: number }) {
  if (tier.badge) {
    return (
      <Image src={tier.badge} alt={tier.label} width={size} height={size} className="inline-block shrink-0 object-contain" />
    );
  }
  return <span style={{ fontSize: size * 0.8 }}>{tier.icon}</span>;
}
