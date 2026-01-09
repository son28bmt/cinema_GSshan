"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { label: "Trang chủ", href: "/" },
  { label: "Danh sách", href: "/movies" },
  // { label: "Phim bộ", href: "/movies?type=series" },
  // { label: "Phim lẻ", href: "/movies?type=single" },
  { label: "Lịch chiếu", href: "/schedule" },
  { label: "Bảng xếp hạng", href: "/rankings" },
  { label: "Cộng đồng", href: "/community" },
  { label: "Giới thiệu", href: "/about" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type MovieSuggestion = {
  id: number;
  title: string;
  slug: string;
  release_year: number | null;
  poster_url: string | null;
};

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAuthed, setIsAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncAuth = () => {
    if (typeof window === "undefined") {
      return;
    }
    setIsAuthed(Boolean(localStorage.getItem("cinema_token")));
  };

  const fetchUnreadCount = async () => {
    if (typeof window === "undefined") {
      return;
    }
    const token = localStorage.getItem("cinema_token");
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok) {
        setUnreadCount(0);
        return;
      }
      const data = await response.json();
      setUnreadCount(Number(data.total) || 0);
    } catch (err) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    setMounted(true);
    syncAuth();
  }, [pathname]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    setQuery(searchParams.get("q") || "");
  }, [mounted, searchParams]);

  useEffect(() => {
    const handleAuthChange = () => {
      syncAuth();
      fetchUnreadCount();
    };
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("pageshow", handleAuthChange);
    window.addEventListener("focus", handleAuthChange);
    document.addEventListener("visibilitychange", handleAuthChange);
    window.addEventListener("notifications-updated", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("pageshow", handleAuthChange);
      window.removeEventListener("focus", handleAuthChange);
      document.removeEventListener("visibilitychange", handleAuthChange);
      window.removeEventListener("notifications-updated", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (isAuthed) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [mounted, isAuthed, pathname]);

  useEffect(() => {
    if (!mounted || !isAuthed) {
      return;
    }
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);
    return () => clearInterval(interval);
  }, [mounted, isAuthed]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `${API_URL}/api/movies?limit=6&q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("tìm kiếm thất bại!!");
        }
        const data = await response.json();
        setSuggestions(data.movies || []);
        setSearchError("");
      } catch (err) {
        const error = err as { name?: string };
        if (error?.name === "AbortError") {
          return;
        }
        setSuggestions([]);
        setSearchError("Không tìm thấy dữ liệu.");
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [mounted, query]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    setIsSuggestionsOpen(false);
  }, [mounted, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("cinema_token");
    setIsAuthed(false);
    setUnreadCount(0);
    router.replace("/login");
  };

  const handleSearchSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    setIsSuggestionsOpen(false);
    router.push(`/movies?q=${encodeURIComponent(trimmed)}`);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    setIsSuggestionsOpen(true);
  };

  const handleBlur = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = setTimeout(() => {
      setIsSuggestionsOpen(false);
    }, 150);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(16,7,10,0.85)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-white">
            GS
          </span>
          CineStream
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-4 text-[13px] text-white/75 lg:flex xl:gap-5 xl:text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <label className="relative hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 xl:flex">
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
              className="w-48 bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none"
              placeholder="Tim kiem phim"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearchSubmit();
                }
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            {mounted && isSuggestionsOpen && query.trim().length > 0 ? (
              <div className="absolute left-0 top-full mt-3 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f141d] text-xs text-white/70 shadow-xl">
                {isSearching ? (
                  <div className="px-4 py-3 text-white/60">Đang tìm...</div>
                ) : searchError ? (
                  <div className="px-4 py-3 text-red-300">{searchError}</div>
                ) : suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-white/60">Không có kết quả.</div>
                ) : (
                  <div className="max-h-72 overflow-auto">
                    {suggestions.map((movie) => (
                      <Link
                        key={movie.id}
                        href={`/movies/${movie.slug}`}
                        onClick={() => setIsSuggestionsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
                      >
                        <div className="h-10 w-8 overflow-hidden rounded-lg bg-white/10">
                          {movie.poster_url ? (
                            <img
                              src={movie.poster_url}
                              alt={movie.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{movie.title}</p>
                          <p className="text-[11px] text-white/50">
                            {movie.release_year ? movie.release_year : "Chua ro"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </label>

          {mounted && isAuthed ? (
            <>
              <Link
                href="/notifications"
                className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-sm"
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
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/30"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[rgba(239,43,79,0.35)]"
            >
              Đăng Nhập
            </Link>
          )}

          <Link
            href="/profile"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-sm"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.8-3.3 5-5 8-5s6.2 1.7 8 5" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
