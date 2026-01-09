import Link from "next/link";
import FavoriteButton from "../components/favorite-button";
import GenreStrip from "../components/genre-strip";
import MovieCard from "../components/movie-card";
import SectionHeading from "../components/section-heading";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import Tag from "../components/tag";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ApiMovie = {
  id: number;
  title: string;
  slug: string;
  release_year: number | null;
  poster_url: string | null;
  backdrop_url?: string | null;
  description?: string | null;
  genres?: string | null;
  status?: string | null;
};

type ApiRankingMovie = {
  id: number;
  title: string;
  slug: string;
  release_year: number | null;
  poster_url: string | null;
  genres: string | null;
  rating: number;
  rating_count: number;
};

type ApiEpisode = {
  id: number;
  episode_number: number;
  title: string | null;
  thumbnail_url: string | null;
  created_at: string;
  released_at: string | null;
  status: string;
  movie_title: string;
  movie_slug: string;
  movie_poster: string | null;
};

const statusLabels: Record<string, string> = {
  ongoing: "Đang tiến hành",
  completed: "Hoàn thành",
  upcoming: "Sắp chiếu",
};

const getLatestMovies = async () => {
  try {
    const response = await fetch(`${API_URL}/api/movies?limit=6`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return (data.movies || []) as ApiMovie[];
  } catch (err) {
    return [];
  }
};

const getTopRatedMovies = async () => {
  try {
    const response = await fetch(`${API_URL}/api/movies/ranking?limit=3`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return (data.movies || []) as ApiRankingMovie[];
  } catch (err) {
    return [];
  }
};

const getMovie = async (slug: string): Promise<ApiMovie | null> => {
  try {
    const response = await fetch(`${API_URL}/api/movies/${slug}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.movie || null;
  } catch (err) {
    return null;
  }
};

const getEpisodes = async (movieId: number) => {
  try {
    const response = await fetch(`${API_URL}/api/episodes?movieId=${movieId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.episodes || [];
  } catch (err) {
    return [];
  }
};

const getLatestEpisodes = async () => {
  try {
    const response = await fetch(`${API_URL}/api/episodes/latest?limit=5`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return (data.episodes || []) as ApiEpisode[];
  } catch (err) {
    return [];
  }
};

const getScheduleEpisodes = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch(
      `${API_URL}/api/episodes/schedule?date=${today}&limit=4`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return (data.episodes || []) as ApiEpisode[];
  } catch (err) {
    return [];
  }
};

const formatTime = (value: string | null) => {
  if (!value) {
    return "Đang cập nhật";
  }
  const date = new Date(value);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const getScheduleStatus = (value: string | null) => {
  if (!value) {
    return "Đang cập nhật";
  }
  const date = new Date(value);
  return date.getTime() <= Date.now() ? "Đang chiếu" : "Sắp chiếu";
};

export default async function Home() {
  const [latestMovies, topRatedMovies, latestEpisodes, scheduleEpisodes] =
    await Promise.all([
      getLatestMovies(),
      getTopRatedMovies(),
      getLatestEpisodes(),
      getScheduleEpisodes(),
    ]);

  const featuredSlug = topRatedMovies[0]?.slug || latestMovies[0]?.slug;
  const featuredMovie = featuredSlug ? await getMovie(featuredSlug) : null;
  const featured = featuredMovie || latestMovies[0] || null;
  const featuredEpisodes = featured ? await getEpisodes(featured.id) : [];

  const heroTags = featured?.genres
    ? featured.genres.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];
  const heroWatchHref = featuredEpisodes[0]
    ? `/watch/${featuredEpisodes[0].id}`
    : featured
      ? `/movies/${featured.slug}`
      : "#";

  const scheduleTimes = scheduleEpisodes
    .map((item) => formatTime(item.released_at || item.created_at))
    .slice(0, 4);

  const rankingList = topRatedMovies.map((movie, index) => ({
    rank: index + 1,
    title: movie.title,
    subtitle: movie.genres ? movie.genres.split(",")[0]?.trim() : "Chưa phân loại",
    rating: movie.rating,
    ratingCount: movie.rating_count,
    href: `/movies/${movie.slug}`,
  }));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-14 px-6 pb-20 pt-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel)] p-8">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70"
              style={{
                backgroundImage: featuredMovie?.backdrop_url
                  ? `linear-gradient(140deg, rgba(5,5,7,0.1) 10%, rgba(10,10,12,0.9) 70%), url(${featuredMovie.backdrop_url})`
                  : "linear-gradient(140deg, rgba(5,5,7,0.1) 10%, rgba(10,10,12,0.9) 70%), radial-gradient(60% 80% at 80% 0%, rgba(239,43,79,0.45), transparent 60%)",
              }}
            />
          </div>
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
                <span className="rounded-full bg-[var(--accent)] px-2 py-1 text-[10px] font-semibold uppercase">
                  {featuredMovie ? "Top #1 Trending" : "Đang cập nhật"}
                </span>
                {featured?.release_year ? featured.release_year : "—"} •{" "}
                {featured?.status
                  ? statusLabels[featured.status] || "Đang cập nhật"
                  : "Đang cập nhật"}
              </div>
              <div className="space-y-4">
                <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
                  {featured?.title || "Chưa có phim nổi bật"}
                </h1>
                <p className="max-w-xl text-sm text-white/70">
                  {featured?.description || "Đang cập nhật nội dung phim."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {heroTags.length > 0 ? (
                  heroTags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                ) : (
                  <Tag>Chưa phân loại</Tag>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {featured ? (
                  <Link
                    href={heroWatchHref}
                    className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(239,43,79,0.35)]"
                  >
                    Xem ngay
                  </Link>
                ) : (
                  <button className="rounded-full bg-white/10 px-5 py-3 text-sm text-white/60">
                    Chưa có tập
                  </button>
                )}
                {featured ? <FavoriteButton movieId={featured.id} /> : null}
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs text-white/60">Lịch chiếu hôm nay</p>
                {scheduleTimes.length === 0 ? (
                  <p className="mt-3 text-xs text-white/50">Chưa có lịch chiếu.</p>
                ) : (
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                    {scheduleTimes.map((time) => (
                      <span
                        key={time}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-white/70"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-5">
                <p className="text-xs text-white/60">Bảng xếp hạng</p>
                <div className="mt-4 space-y-3 text-sm">
                  {rankingList.length === 0 ? (
                    <p className="text-xs text-white/50">Chưa có bảng xếp hạng.</p>
                  ) : (
                    rankingList.map((item) => (
                      <Link
                        key={item.rank}
                        href={item.href}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">#{item.rank}</p>
                          <p className="text-xs text-white/50">{item.title}</p>
                        </div>
                        <span className="text-xs text-yellow-400">
                          ⭐ {item.ratingCount > 0 ? item.rating.toFixed(1) : "—"}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading title="Thể loại nổi bật" />
          <GenreStrip />
        </section>

        <section className="space-y-6">
          <SectionHeading
            title="Phim đang hot"
            subtitle="Nội dung nổi bật trong tuần, cập nhật liên tục"
            action={<Link href="/movies">Xem tất cả</Link>}
          />
          {latestMovies.length === 0 ? (
            <p className="text-sm text-white/60">Chưa có dữ liệu phim.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  title={movie.title}
                  subtitle={movie.release_year ? `${movie.release_year}` : "Chưa rõ"}
                  cover={movie.poster_url || undefined}
                  href={`/movies/${movie.slug}`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1.2fr]">
          <div className="space-y-6">
            <SectionHeading
              title="Lịch chiếu hôm nay"
              subtitle="Những tập mới sẽ lên sóng trong 24h tới"
            />
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[var(--panel)] p-5">
              {scheduleEpisodes.length === 0 ? (
                <p className="text-sm text-white/60">Chưa có lịch chiếu.</p>
              ) : (
                scheduleEpisodes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{item.movie_title}</p>
                      <p className="text-xs text-white/50">
                        Tập {item.episode_number}
                      </p>
                    </div>
                    <div className="text-right text-xs text-white/60">
                      <p>{formatTime(item.released_at || item.created_at)}</p>
                      <p className="text-[10px] uppercase text-[var(--accent-2)]">
                        {getScheduleStatus(item.released_at || item.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="space-y-6">
            <SectionHeading title="Tập mới cập nhật" />
            <div className="grid gap-4">
              {latestEpisodes.length === 0 ? (
                <p className="text-sm text-white/60">Chưa có tập mới.</p>
              ) : (
                latestEpisodes.map((episode) => (
                  <MovieCard
                    key={episode.id}
                    title={episode.movie_title}
                    subtitle={episode.title || `Tập ${episode.episode_number}`}
                    badge={`Tập ${episode.episode_number}`}
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
