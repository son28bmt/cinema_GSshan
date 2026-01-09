"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

const navItems = [
  { label: "Tổng quan", href: "/admin", icon: "grid" },
  { label: "Phim", href: "/admin/movies", icon: "film" },
  { label: "Tập phim", href: "/admin/episodes", icon: "clips" },
  { label: "Server Video", href: "/admin/servers", icon: "server" },
  { label: "Thể loại", href: "/admin/genres", icon: "tag" },
  { label: "Người dùng", href: "/admin/users", icon: "users" },
  { label: "Thông báo", href: "/admin/notifications", icon: "bell" },
  { label: "Bình luận", href: "/admin/comments", icon: "chat" },
];

const iconMap = {
  grid: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  ),
  film: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5h16v14H4z" />
      <path d="M4 9h16M9 5v14M15 5v14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  clips: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 4h12v5H6zM4 11h16v9H4z" />
    </svg>
  ),
  server: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h16v6H4zM4 14h16v6H4z" />
      <circle cx="8" cy="7" r="1" fill="#0f1720" />
      <circle cx="8" cy="17" r="1" fill="#0f1720" />
    </svg>
  ),
  tag: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 7h10l6 5-6 5H4z" />
    </svg>
  ),
  users: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 11a4 4 0 100-8 4 4 0 000 8zM16 13a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M2 20c1.6-3 4.3-5 7-5s5.4 2 7 5" />
      <path d="M14 20c.8-1.6 2.3-2.8 4-3.3" />
    </svg>
  ),
  bell: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a6 6 0 016 6v4l2 3H4l2-3V8a6 6 0 016-6z" />
    </svg>
  ),
  chat: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5h16v10H8l-4 4z" />
    </svg>
  ),
};

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const requireAuth = () => {
    if (typeof window === "undefined") {
      return;
    }
    const token = localStorage.getItem("cinema_token");
    if (!token) {
      router.replace("/login");
    }
  };

  useEffect(() => {
    requireAuth();
  }, [pathname]);

  useEffect(() => {
    const handleAuthCheck = () => requireAuth();
    window.addEventListener("pageshow", handleAuthCheck);
    window.addEventListener("focus", handleAuthCheck);
    document.addEventListener("visibilitychange", handleAuthCheck);
    return () => {
      window.removeEventListener("pageshow", handleAuthCheck);
      window.removeEventListener("focus", handleAuthCheck);
      document.removeEventListener("visibilitychange", handleAuthCheck);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("cinema_token");
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f1720] text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col border-r border-white/5 bg-[#0c131c]">
          <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1f8ef1] text-white">
              GS
            </div>
            <div>
              <p className="text-base font-semibold">GuangShan Admin</p>
              <p className="text-xs text-white/50">Quản lý hệ thống</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive(item.href)
                    ? "bg-[#1f8ef1] text-white"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-[#8ec3ff]">
                  {iconMap[item.icon as keyof typeof iconMap]}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-white/5 px-6 py-5 text-sm text-white/60">
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 hover:bg-white/5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-[#8ec3ff]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2a6 6 0 016 6v4h2v4h-2a6 6 0 01-12 0H4v-4h2V8a6 6 0 016-6z" />
                </svg>
              </span>
              Cài Đặt
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-[#111b26] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-[#6bb7ff]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 3l7 5v9a2 2 0 01-2 2H7a2 2 0 01-2-2V8l7-5z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold">Admin Bảng điều khiển</p>
                <p className="text-xs text-white/50">MovieWorld</p>
              </div>
            </div>

            <label className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-[#0c131c] px-4 py-2 text-sm text-white/60">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20L17 17" />
              </svg>
              <input
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                placeholder="Tìm kiếm phim, người dùng..."
              />
            </label>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/notifications"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5"
                aria-label="Thông báo"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2a6 6 0 016 6v4l2 3H4l2-3V8a6 6 0 016-6z" />
                </svg>
              </Link>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-white/20" />
                <div className="text-xs">
                  <p className="font-semibold text-white">Admin</p>
                  <p className="text-white/50">Super User</p>
                </div>
              </div>
              <button
                className="rounded-xl border border-white/10 bg-[#1f8ef1] px-4 py-2 text-xs font-semibold text-white"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          </header>

          <main className="flex-1 space-y-8 bg-[#0f1720] px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
