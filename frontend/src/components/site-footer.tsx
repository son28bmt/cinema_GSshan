import Link from "next/link";

const footerLinks = {
  "Khám phá": [
    { label: "Phim mới", href: "/movies" },
    { label: "Phim bộ", href: "/movies?type=series" },
    { label: "Phim lẻ", href: "/movies?type=single" },
    { label: "Bảng xếp hạng", href: "/rankings" },
  ],
  "Hỗ trợ": [
    { label: "FAQ", href: "/about" },
    { label: "Điều khoản", href: "/about" },
    { label: "Báo lỗi", href: "/about" },
    { label: "Liên hệ", href: "/about" },
  ],
  "Xã hội": [
    { label: "Facebook", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "YouTube", href: "#" },
  ],
};

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-[var(--panel)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_1fr_1fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-white">
              GS
            </span>
            CineStream
          </div>
          <p className="text-sm text-white/60">
            Nền tảng xem phim trực tuyến chất lượng cao, tập trung donghua và
            cộng đồng fan đam mê.
          </p>
        </div>

        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title} className="space-y-3 text-sm">
            <p className="font-semibold text-white/80">{title}</p>
            <ul className="space-y-2 text-white/60">
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-white/50 md:flex-row">
          <span>© 2026 CineStream. All rights reserved.</span>
          <span>Thiết kế riêng cho nền tảng donghua.</span>
        </div>
      </div>
    </footer>
  );
}
