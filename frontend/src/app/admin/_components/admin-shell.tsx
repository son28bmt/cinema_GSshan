"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type SearchResult = {
  type: "movie" | "genre" | "user";
  id: number;
  title: string;
  subtitle?: string;
  href: string;
};

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
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  ),
  film: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4 5h16v14H4z" />
      <path
        d="M4 9h16M9 5v14M15 5v14"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
  clips: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6 4h12v5H6zM4 11h16v9H4z" />
    </svg>
  ),
  server: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4 4h16v6H4zM4 14h16v6H4z" />
      <circle cx="8" cy="7" r="1" fill="#0f1720" />
      <circle cx="8" cy="17" r="1" fill="#0f1720" />
    </svg>
  ),
  tag: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4 7h10l6 5-6 5H4z" />
    </svg>
  ),
  users: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 11a4 4 0 100-8 4 4 0 000 8zM16 13a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M2 20c1.6-3 4.3-5 7-5s5.4 2 7 5" />
      <path d="M14 20c.8-1.6 2.3-2.8 4-3.3" />
    </svg>
  ),
  bell: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2a6 6 0 016 6v4l2 3H4l2-3V8a6 6 0 016-6z" />
    </svg>
  ),
  chat: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results: SearchResult[] = [];
        const query = searchQuery.trim().toLowerCase();

        // Search movies
        const moviesRes = await fetch(`${API_URL}/api/movies?limit=20`);
        if (moviesRes.ok) {
          const moviesData = await moviesRes.json();
          const movies = (moviesData.movies || [])
            .filter((m: any) => m.title?.toLowerCase().includes(query))
            .slice(0, 3)
            .map((m: any) => ({
              type: "movie" as const,
              id: m.id,
              title: m.title,
              subtitle: m.release_year ? `Phim ${m.release_year}` : "Phim",
              href: `/admin/movies/new?movieId=${m.id}`,
            }));
          results.push(...movies);
        }

        // Search genres
        const genresRes = await fetch(`${API_URL}/api/genres`);
        if (genresRes.ok) {
          const genresData = await genresRes.json();
          const genres = (genresData.genres || [])
            .filter((g: any) => g.name?.toLowerCase().includes(query))
            .slice(0, 3)
            .map((g: any) => ({
              type: "genre" as const,
              id: g.id,
              title: g.name,
              subtitle: `Thể loại`,
              href: `/admin/genres`,
            }));
          results.push(...genres);
        }

        // Search users (if API exists)
        try {
          const usersRes = await fetch(`${API_URL}/api/users?limit=10`);
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            const users = (usersData.users || [])
              .filter(
                (u: any) =>
                  u.username?.toLowerCase().includes(query) ||
                  u.email?.toLowerCase().includes(query)
              )
              .slice(0, 3)
              .map((u: any) => ({
                type: "user" as const,
                id: u.id,
                title: u.username || u.email,
                subtitle: u.email || "Người dùng",
                href: `/admin/users`,
              }));
            results.push(...users);
          }
        } catch {
          // Users API might not exist
        }

        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const isActive = (href: string) => {
    const currentPath = pathname || "";
    if (href === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("cinema_token");
    router.replace("/login");
  };

  const handleResultClick = (href: string) => {
    setShowDropdown(false);
    setSearchQuery("");
    router.push(href);
  };

  const getResultIcon = (type: string) => {
    if (type === "movie") return "🎬";
    if (type === "genre") return "🏷️";
    if (type === "user") return "👤";
    return "📄";
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#0f1720] text-slate-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/5 bg-[#0c131c] transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1f8ef1] text-white">
                GS
              </div>
              <div>
                <p className="text-base font-semibold">GuangShan Admin</p>
                <p className="text-xs text-white/50">Quản lý hệ thống</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1 text-white/60 hover:bg-white/5 lg:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
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
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2a6 6 0 016 6v4h2v4h-2a6 6 0 01-12 0H4v-4h2V8a6 6 0 016-6z" />
                </svg>
              </span>
              Cài Đặt
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-[#111b26]/90 px-6 py-4 backdrop-blur-md">
            {/* Left Group (Hamburger + Logo) */}
            <div className="flex items-center gap-3 order-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="mr-2 rounded-lg p-1 text-white/60 hover:bg-white/5 lg:hidden"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-[#6bb7ff]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 3l7 5v9a2 2 0 01-2 2H7a2 2 0 01-2-2V8l7-5z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <p className="text-lg font-semibold">Admin Bảng điều khiển</p>
                <p className="text-xs text-white/50">MovieWorld</p>
              </div>
            </div>

            {/* Right Group (User Profile) - Moved up in DOM for mobile order */}
            <div className="flex items-center gap-3 order-2 lg:order-3">
              <Link
                href="/admin/notifications"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5"
                aria-label="Thông báo"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2a6 6 0 016 6v4l2 3H4l2-3V8a6 6 0 016-6z" />
                </svg>
              </Link>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-white/20" />
                <div className="hidden text-xs sm:block">
                  <p className="font-semibold text-white">Admin</p>
                  <p className="text-white/50">Super User</p>
                </div>
              </div>
              <button
                className="hidden sm:block rounded-xl border border-white/10 bg-[#1f8ef1] px-4 py-2 text-xs font-semibold text-white"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>

            {/* Middle Group (Search) - Full width on mobile */}
            <div
              ref={searchRef}
              className="relative w-full order-3 lg:order-2 lg:w-auto lg:max-w-md lg:flex-1 lg:px-8"
            >
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c131c] px-4 py-2 text-sm text-white/60">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20L17 17" />
                </svg>
                <input
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="Tìm kiếm phim, thể loại, người dùng ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() =>
                    searchResults.length > 0 && setShowDropdown(true)
                  }
                />
                {isSearching && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
                )}
              </label>

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-[#111b26] shadow-2xl z-50">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      onClick={() => handleResultClick(result.href)}
                    >
                      <span className="text-2xl">
                        {getResultIcon(result.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-white/50">
                          {result.subtitle}
                        </p>
                      </div>
                      <svg
                        className="h-4 w-4 text-white/30"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                  {searchQuery &&
                    searchResults.length === 0 &&
                    !isSearching && (
                      <div className="px-4 py-6 text-center text-sm text-white/50">
                        Không tìm thấy kết quả cho "{searchQuery}"
                      </div>
                    )}
                </div>
              )}
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
