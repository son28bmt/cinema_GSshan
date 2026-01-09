"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FavoriteButton from "../../components/favorite-button";
import MovieCard from "../../components/movie-card";
import SectionHeading from "../../components/section-heading";
import SiteFooter from "../../components/site-footer";
import SiteHeader from "../../components/site-header";
import Tag from "../../components/tag";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ApiEpisode = {
  id: number;
  movie_id: number;
  episode_number: number;
  title: string | null;
  thumbnail_url: string | null;
  created_at: string;
  released_at: string | null;
  status: string;
  movie_title: string;
  movie_slug: string;
  movie_poster: string | null;
  genres: string | null;
};

type Genre = {
  id: number;
  name: string;
  slug: string;
};

const formatDateLabel = (value: Date) =>
  value.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

const formatTime = (value: string | null) => {
  if (!value) {
    return "Đang cập nhật";
  }
  const date = new Date(value);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const getStatusLabel = (value: string | null) => {
  if (!value) {
    return "Đang cập nhật";
  }
  return new Date(value).getTime() <= Date.now() ? "Đang chiếu" : "Sắp chiếu";
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export default function SchedulePage() {
  const today = useMemo(() => new Date(), []);
  const [baseDate, setBaseDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [dateInput, setDateInput] = useState(toDateKey(today));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [scheduleEpisodes, setScheduleEpisodes] = useState<ApiEpisode[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<ApiEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await fetch(`${API_URL}/api/genres`, { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setGenres(data.genres || []);
      } catch (err) {
        setError("Không thể tải thể loại.");
      }
    };

    loadGenres();
  }, []);

  useEffect(() => {
    const loadLatest = async () => {
      try {
        const response = await fetch(`${API_URL}/api/episodes/latest?limit=6`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setLatestEpisodes(data.episodes || []);
      } catch (err) {
        setError("Không thể tải tập mới.");
      }
    };

    loadLatest();
  }, []);

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_URL}/api/episodes/schedule?date=${selectedDate}&limit=20`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          setError("Không tải được lịch chiếu.");
          return;
        }
        const data = await response.json();
        setScheduleEpisodes(data.episodes || []);
      } catch (err) {
        setError("Không thể kết nối backend.");
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [selectedDate]);

  const genreMap = useMemo(() => {
    return Object.fromEntries(genres.map((genre) => [genre.slug, genre.name]));
  }, [genres]);

  const filteredSchedule = useMemo(() => {
    if (selectedGenre === "all") {
      return scheduleEpisodes;
    }
    const genreName = genreMap[selectedGenre];
    if (!genreName) {
      return scheduleEpisodes;
    }
    return scheduleEpisodes.filter((episode) =>
      (episode.genres || "").toLowerCase().includes(genreName.toLowerCase())
    );
  }, [scheduleEpisodes, selectedGenre, genreMap]);

  const filteredLatest = useMemo(() => {
    if (selectedGenre === "all") {
      return latestEpisodes;
    }
    const genreName = genreMap[selectedGenre];
    if (!genreName) {
      return latestEpisodes;
    }
    return latestEpisodes.filter((episode) =>
      (episode.genres || "").toLowerCase().includes(genreName.toLowerCase())
    );
  }, [latestEpisodes, selectedGenre, genreMap]);

  const dateTabs = useMemo(() => {
    const start = new Date(baseDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        label: formatDateLabel(date),
        value: toDateKey(date),
      };
    });
  }, [baseDate]);

  const featuredEpisode = filteredSchedule[0] || filteredLatest[0] || null;
  const featuredTags = featuredEpisode?.genres
    ? featuredEpisode.genres.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  const handleDatePick = (value: string) => {
    if (!value) {
      return;
    }
    const next = new Date(value);
    setBaseDate(next);
    setSelectedDate(value);
    setDateInput(value);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-6 pb-20 pt-10">
        <SectionHeading
          title="Lịch phát sóng"
          subtitle="Cập nhật lịch chiếu phim mới nhất hôm nay"
          action={
            <div className="flex gap-2">
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                onClick={() => setShowDatePicker((prev) => !prev)}
              >
                Xem theo tháng
              </button>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                Lọc
              </button>
            </div>
          }
        />

        {showDatePicker ? (
          <div className="flex items-center gap-3 text-xs text-white/70">
            <span>Chọn ngày:</span>
            <input
              type="date"
              value={dateInput}
              onChange={(event) => handleDatePick(event.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {dateTabs.map((date) => (
            <button
              key={date.value}
              onClick={() => setSelectedDate(date.value)}
              className={`rounded-full px-4 py-2 text-xs ${
                selectedDate === date.value
                  ? "bg-[var(--accent)] text-white"
                  : "border border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {date.label}
            </button>
          ))}
        </div>

        {showFilters ? (
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setSelectedGenre("all")}>
              <Tag active={selectedGenre === "all"}>Tất cả</Tag>
            </button>
            {genres.map((genre) => (
              <button key={genre.id} onClick={() => setSelectedGenre(genre.slug)}>
                <Tag active={selectedGenre === genre.slug}>{genre.name}</Tag>
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <section className="rounded-3xl border border-white/10 bg-[var(--panel)] p-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-semibold uppercase">
                Độc quyền
              </span>
              <h2 className="font-display text-3xl font-semibold">
                {featuredEpisode?.movie_title || "Chưa có lịch chiếu"}
              </h2>
              <p className="text-sm text-white/60">
                {featuredEpisode?.title
                  ? `Tập ${featuredEpisode.episode_number}: ${featuredEpisode.title}`
                  : featuredEpisode
                    ? `Tập ${featuredEpisode.episode_number} đang cập nhật`
                    : "Đang cập nhật lịch chiếu."}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {featuredTags.length > 0 ? (
                  featuredTags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                ) : (
                  <Tag>Chưa phân loại</Tag>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {featuredEpisode ? (
                  <Link
                    href={`/watch/${featuredEpisode.id}`}
                    className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Xem ngay
                  </Link>
                ) : (
                  <button className="rounded-full bg-white/10 px-5 py-3 text-sm text-white/60">
                    Chưa có tập
                  </button>
                )}
                {featuredEpisode ? (
                  <FavoriteButton movieId={featuredEpisode.movie_id} />
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-right">
              <p className="text-xs text-white/50">
                {featuredEpisode
                  ? getStatusLabel(featuredEpisode.released_at || featuredEpisode.created_at)
                  : "Đang cập nhật"}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {featuredEpisode
                  ? formatTime(featuredEpisode.released_at || featuredEpisode.created_at)
                  : "--:--"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <SectionHeading title="Mới cập nhật" action={<span className="text-xs text-green-400">LIVE</span>} />
            <div className="grid gap-4">
              {loading ? (
                <p className="text-sm text-white/60">Đang tải dữ liệu...</p>
              ) : filteredLatest.length === 0 ? (
                <p className="text-sm text-white/60">Chưa có tập mới.</p>
              ) : (
                filteredLatest.map((episode) => (
                  <MovieCard
                    key={episode.id}
                    title={episode.movie_title}
                    subtitle={episode.title || `Tập ${episode.episode_number}`}
                    badge={`EP ${episode.episode_number}`}
                    cover={episode.movie_poster || episode.thumbnail_url || undefined}
                    href={`/watch/${episode.id}`}
                  />
                ))
              )}
            </div>
          </div>
          <div className="space-y-6">
            <SectionHeading title="Sắp chiếu tối nay" />
            <div className="grid gap-4">
              {loading ? (
                <p className="text-sm text-white/60">Đang tải dữ liệu...</p>
              ) : filteredSchedule.length === 0 ? (
                <p className="text-sm text-white/60">Chưa có lịch chiếu.</p>
              ) : (
                filteredSchedule.map((episode) => (
                  <MovieCard
                    key={episode.id}
                    title={episode.movie_title}
                    subtitle={`Tập ${episode.episode_number}`}
                    badge={formatTime(episode.released_at || episode.created_at)}
                    cover={episode.movie_poster || episode.thumbnail_url || undefined}
                    href={`/watch/${episode.id}`}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
