import Link from "next/link";

export type MovieCardProps = {
  title: string;
  subtitle?: string;
  rating?: number;
  badge?: string;
  episodes?: string;
  cover?: string;
  href?: string;
};

const getPosterStyle = (cover?: string) => {
  if (cover) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 10%, rgba(0,0,0,0.75) 90%), url(${cover})`,
    };
  }

  return {
    backgroundImage:
      "radial-gradient(60% 80% at 80% 20%, rgba(239,43,79,0.35), transparent 70%), linear-gradient(140deg, #2b1016 0%, #16080c 60%, #0b0507 100%)",
  };
};

export default function MovieCard({
  title,
  subtitle,
  rating,
  badge,
  episodes,
  cover,
  href,
}: MovieCardProps) {
  const card = (
    <article className="group space-y-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[var(--panel)]">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={getPosterStyle(cover)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide">
            {badge}
          </span>
        ) : null}
        {episodes ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[10px] text-white/80">
            {episodes}
          </span>
        ) : null}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle ? <p className="text-xs text-white/50">{subtitle}</p> : null}
        {typeof rating === "number" ? (
          <div className="flex items-center gap-1 text-xs text-white/70">
            <svg
              className="h-3 w-3 text-yellow-400"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.8-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3z" />
            </svg>
            {rating.toFixed(1)}
          </div>
        ) : null}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
