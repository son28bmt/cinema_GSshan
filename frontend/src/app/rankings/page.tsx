"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SectionHeading from "../../components/section-heading";
import SiteFooter from "../../components/site-footer";
import SiteHeader from "../../components/site-header";
import Tag from "../../components/tag";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ApiMovie = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  poster_url: string | null;
  genres: string | null;
  rating: number;
  rating_count: number;
  views: number;
  favorite_count: number;
};

type Genre = {
  id: number;
  name: string;
  slug: string;
  movie_count?: number;
};

const stripHtml = (value: string | null | undefined) =>
  (value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .trim();

type RankingMode = "views" | "rating" | "favorites";

const modeLabels: Record<RankingMode, string> = {
  views: "Top Views",
  rating: "Top Rating",
  favorites: "Top Theo dõi",
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const formatViews = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
};

export default function RankingsPage() {
  const [mode, setMode] = useState<RankingMode>("views");
  const [movies, setMovies] = useState<ApiMovie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [topWatchHref, setTopWatchHref] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [movieRes, genreRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/movies?sort=${mode}&limit=8`, {
            cache: "no-store",
          }),
          fetch(`${API_URL}/api/genres?includeCounts=1`, { cache: "no-store" }),
          fetch(`${API_URL}/api/users/leaderboard?limit=5`, {
            cache: "no-store",
          }),
        ]);

        if (movieRes.ok) {
          const movieData = await movieRes.json();
          setMovies(movieData.movies || []);
        }
        if (genreRes.ok) {
          const genreData = await genreRes.json();
          setGenres(genreData.genres || []);
        }
        if (userRes.ok) {
          const userData = await userRes.json();
          setTopUsers(userData.users || []);
        }
      } catch (err) {
        setError("Không thể kết nối dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mode]);

  const topMovie = movies[0];
  const highlightCards = movies.slice(1, 3);
  const tableMovies = movies.slice(3);
  const topDescription = stripHtml(topMovie?.description);

  useEffect(() => {
    const loadTopWatch = async () => {
      if (!topMovie) {
        setTopWatchHref("");
        return;
      }
      try {
        const response = await fetch(
          `${API_URL}/api/episodes?movieId=${topMovie.id}`,
          {
            cache: "no-store",
          }
        );
        if (!response.ok) {
          setTopWatchHref(`/movies/${topMovie.slug}`);
          return;
        }
        const data = await response.json();
        const episodes = data.episodes || [];
        setTopWatchHref(
          episodes.length > 0
            ? `/watch/${episodes[0].id}`
            : `/movies/${topMovie.slug}`
        );
      } catch (err) {
        setTopWatchHref(`/movies/${topMovie.slug}`);
      }
    };

    loadTopWatch();
  }, [topMovie]);

  const topGenres = useMemo(() => {
    return [...genres]
      .sort((a, b) => (b.movie_count || 0) - (a.movie_count || 0))
      .slice(0, 7);
  }, [genres]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-4 pb-20 pt-10 sm:px-6">
        <SectionHeading
          title="Bảng xếp hạng"
          subtitle="Cập nhật liên tục các bộ phim hot nhất trên nền tảng"
          action={
            <div className="flex flex-wrap gap-2">
              {(Object.keys(modeLabels) as RankingMode[]).map((label) => (
                <button
                  key={label}
                  onClick={() => setMode(label)}
                  className={`rounded-full px-4 py-2 text-xs ${
                    mode === label
                      ? "bg-[var(--accent)] text-white"
                      : "border border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {modeLabels[label]}
                </button>
              ))}
            </div>
          }
        />

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[var(--panel)] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold">
                  #1 Trending
                </span>
                {topMovie ? (
                  <Link
                    href={topWatchHref || `/movies/${topMovie.slug}`}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                  >
                    Xem ngay
                  </Link>
                ) : (
                  <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50">
                    Xem ngay
                  </button>
                )}
              </div>
              <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  <h2 className="font-display text-xl font-semibold sm:text-2xl">
                    {topMovie?.title || "Chưa có dữ liệu"}
                  </h2>
                  <p className="text-sm text-white/60 max-h-24 overflow-hidden md:max-h-none">
                    {topDescription || "Đang cập nhật nội dung phim."}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(topMovie?.genres
                      ? topMovie.genres
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                      : ["Chưa phân loại"]
                    ).map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    {mode === "views" ? (
                      <Tag>{formatViews(topMovie?.views || 0)} views</Tag>
                    ) : null}
                    {mode === "rating" ? (
                      <Tag>
                        {topMovie?.rating_count
                          ? topMovie.rating.toFixed(1)
                          : "—"}{" "}
                        rating
                      </Tag>
                    ) : null}
                    {mode === "favorites" ? (
                      <Tag>
                        {formatNumber(topMovie?.favorite_count || 0)} theo dõi
                      </Tag>
                    ) : null}
                  </div>
                </div>
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: topMovie?.poster_url
                        ? `linear-gradient(180deg, rgba(0,0,0,0) 10%, rgba(0,0,0,0.7) 90%), url(${topMovie.poster_url})`
                        : "linear-gradient(180deg, rgba(0,0,0,0) 10%, rgba(0,0,0,0.7) 90%), radial-gradient(60% 80% at 70% 20%, rgba(239,43,79,0.35), transparent 70%)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                  Đang tải dữ liệu...
                </div>
              ) : highlightCards.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                  Chưa có dữ liệu.
                </div>
              ) : (
                highlightCards.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <p className="text-xs text-white/50">#{index + 2}</p>
                    <p className="mt-2 text-base font-semibold sm:text-lg">
                      {movie.title}
                    </p>
                    <p className="text-xs text-white/50">
                      {movie.genres || "Chưa phân loại"}
                    </p>
                    <p className="mt-3 text-xs text-yellow-400">
                      ⭐ {movie.rating_count ? movie.rating.toFixed(1) : "—"}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <div className="space-y-3 sm:hidden">
                {tableMovies.length === 0 ? (
                  <p className="text-sm text-white/60">Chưa có dữ liệu.</p>
                ) : (
                  tableMovies.map((movie, index) => (
                    <div
                      key={movie.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>#{index + 4}</span>
                        <span>
                          {movie.views ? formatViews(movie.views) : "--"} views
                        </span>
                      </div>
                      <p className="mt-2 text-base font-semibold">
                        {movie.title}
                      </p>
                      <p className="text-xs text-white/50">
                        {movie.genres || "--"}
                      </p>
                      <p className="mt-2 text-xs text-yellow-400">
                        ⭐ {movie.rating_count ? movie.rating.toFixed(1) : "--"}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[420px] grid grid-cols-[0.6fr_1.4fr_0.6fr_0.6fr] text-xs text-white/50">
                  <span>Hạng</span>
                  <span>Phim</span>
                  <span>Đánh giá</span>
                  <span>Lượt xem</span>
                </div>
                <div className="mt-4 space-y-4">
                  {tableMovies.length === 0 ? (
                    <p className="text-sm text-white/60">Chưa có dữ liệu.</p>
                  ) : (
                    tableMovies.map((movie, index) => (
                      <div
                        key={movie.id}
                        className="min-w-[420px] grid grid-cols-[0.6fr_1.4fr_0.6fr_0.6fr] items-center text-sm"
                      >
                        <span className="text-white/60">{index + 4}</span>
                        <div>
                          <p className="font-semibold">{movie.title}</p>
                          <p className="text-xs text-white/50">
                            {movie.genres || "--"}
                          </p>
                        </div>
                        <span className="text-yellow-400">
                          {movie.rating_count ? movie.rating.toFixed(1) : "--"}
                        </span>
                        <span className="text-white/60">
                          {movie.views ? formatViews(movie.views) : "--"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6 overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Thể loại thịnh hành</h3>
                <Link href="/movies" className="text-xs text-[var(--accent-2)]">
                  Xem tất cả
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {topGenres.length === 0 ? (
                  <p className="text-xs text-white/50">Chưa có thể loại.</p>
                ) : (
                  topGenres.map((tag) => <Tag key={tag.id}>{tag.name}</Tag>)
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6 overflow-x-auto">
              <h3 className="text-sm font-semibold">Top Thành viên</h3>
              <div className="mt-4 space-y-3">
                {topUsers.length === 0 ? (
                  <p className="text-xs text-white/50">Chưa có dữ liệu.</p>
                ) : (
                  topUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className="flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              user.role === "admin"
                                ? "!text-red-500 font-bold"
                                : ""
                            }`}
                            style={{
                              color:
                                user.role === "admin" ? "#ef4444" : undefined,
                            }}
                          >
                            {user.name || user.display_name || "User"}
                          </p>
                          <p className="text-[10px] text-white/50">
                            {user.email
                              ? user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
                              : "---"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] text-white">
                        {user.role === "admin"
                          ? "Trùm cuối"
                          : `LV. ${Math.floor((user.xp || 0) / 100) + 1}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <p className="mt-4 text-center text-[10px] text-white/40">
                Tích cực hoạt động để leo rank!
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-6 text-center">
              <p className="text-sm font-semibold">MovieWorld Premium</p>
              <p className="mt-2 text-xs text-white/60">
                Xem phim không quảng cáo
              </p>
              <button className="mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">
                Nâng cấp ngay
              </button>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
