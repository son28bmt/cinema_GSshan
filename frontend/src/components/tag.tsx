import type { ReactNode } from "react";

type TagProps = {
  children: ReactNode;
  active?: boolean;
};

export default function Tag({ children, active }: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-[var(--accent)] bg-[rgba(239,43,79,0.16)] text-white"
          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
      }`}
    >
      {children}
    </span>
  );
}
