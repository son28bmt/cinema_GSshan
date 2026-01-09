import type { ReactNode } from "react";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function SectionHeading({
  title,
  subtitle,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-white/60">{subtitle}</p> : null}
      </div>
      {action ? <div className="text-sm text-white/60">{action}</div> : null}
    </div>
  );
}
