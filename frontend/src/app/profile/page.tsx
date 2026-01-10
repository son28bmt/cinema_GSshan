"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MovieCard from "../../components/movie-card";
import SectionHeading from "../../components/section-heading";
import SiteFooter from "../../components/site-footer";
import SiteHeader from "../../components/site-header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type UserProfile = {
  id: number;
  email: string;
  name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  role?: "user" | "admin" | string;
  status?: string;
  created_at?: string;
};

type ProfileStats = {
  movies_watched: number;
  watch_hours: number;
  ratings_count: number;
  favorites_count: number;
};

type FavoriteMovie = {
  id: number;
  title: string;
  slug: string;
  poster_url: string | null;
  release_year: number | null;
};

type HistoryItem = {
  id: number;
  movie_id: number;
  episode_id: number | null;
  title: string;
  slug: string;
  poster_url: string | null;
  release_year: number | null;
  episode_number: number | null;
  watched_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cinema_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("cinema_token");
            setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          } else {
            setError(data.message || "Không thể tải hồ sơ.");
          }
          setUser(null);
          setStats(null);
          setFavorites([]);
          setHistory([]);
          return;
        }

        setError(null);
        setUser(data.user || null);
        setStats(data.stats || null);
        setFavorites(data.favorites || []);
        setHistory(data.history || []);
      } catch (err) {
        setError("Không thể tải hồ sơ.");
        setUser(null);
        setStats(null);
        setFavorites([]);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const displayName =
    user?.display_name || user?.name || user?.email || "Khach";
  const joinYear = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : "2023";
  const roleLabel = user?.role === "admin" ? "Admin" : "Member";
  const statItems = useMemo(
    () => [
      { label: "Phim đã xem", value: `${stats?.movies_watched ?? 0}` },
      {
        label: "Giờ xem",
        value: `${stats ? stats.watch_hours.toFixed(1) : "0"}`,
      },
      { label: "Đánh giá", value: `${stats?.ratings_count ?? 0}` },
      { label: "Danh sách yêu thích", value: `${stats?.favorites_count ?? 0}` },
    ],
    [stats]
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-4 pb-20 pt-10 sm:px-6">
        <section className="rounded-3xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={displayName}
                  className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5" />
              )}
              <div>
                <h2 className="font-display text-xl font-semibold">
                  {loading ? "Đang tải..." : displayName}
                </h2>
                <p className="text-xs text-white/60">
                  {loading ? "" : `${roleLabel} - Tham gia từ ${joinYear}`}
                </p>
                <p className="mt-2 text-xs text-white/50">
                  {user?.bio ||
                    "tiểu sử cá nhân chưa được cập nhật."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/profile/edit"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
              >
                Chỉnh sửa hồ sơ
              </Link>
              <Link
                href="/profile/settings"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
              >
                Cài đặt tài khoản
              </Link>
            </div>
          </div>

          {!loading && error ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          ) : null}

          {!loading && !user && !error ? (
            <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-100">
              Bạn chưa đăng nhập. Vui lòng
              <Link  href="/login" className="ml-1 text-white underline">
                đăng nhập
              </Link>
              .
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-xs text-white/50">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </section>

        <SectionHeading
          title="Phim đang theo dõi"
          action={
            <Link href="/movies" className="text-xs text-[var(--accent-2)]">
              Xem tất cả
            </Link>
          }
        />
        <div className="grid gap-4 grid-cols-2 sm:p-6 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.length === 0 ? (
            <div className="col-span-full flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-sm text-white/50">
              Chưa có phim nào trong danh sách.
            </div>
          ) : (
            favorites.map((movie) => (
              <MovieCard
                key={movie.id}
                title={movie.title}
                subtitle={movie.release_year ? `${movie.release_year}` : "Chưa rõ"}
                cover={movie.poster_url || undefined}
                href={`/movies/${movie.slug}`}
              />
            ))
          )}
        </div>

        <SectionHeading
          title="Lịch sử xem"
          action={
            <Link href="/movies" className="text-xs text-[var(--accent-2)]">
              Xem toàn bộ
            </Link>
          }
        />
        <div className="grid gap-4 grid-cols-2 sm:p-6 sm:grid-cols-3 lg:grid-cols-3">
          {history.length === 0 ? (
            <div className="col-span-full flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-sm text-white/50">
              Chưa có lịch sử xem nào.
            </div>
          ) : (
            history.map((item) => (
              <MovieCard
                key={item.id}
                title={item.title}
                subtitle={
                  item.episode_number
                    ? `Tập ${item.episode_number}`
                    : item.release_year
                    ? `${item.release_year}`
                    : "Chưa Rõ"
                }
                cover={item.poster_url || undefined}
                href={`/movies/${item.slug}`}
              />
            ))
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
