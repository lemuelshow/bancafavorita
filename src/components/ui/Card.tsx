import type { ReactNode } from "react";

export default function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] border border-line bg-panel p-6 shadow-[0_16px_50px_#0004] ${className}`}>
      {children}
    </div>
  );
}
