import Link from "next/link"
import { notFound } from "next/navigation"
import FavoriteButton from "../../../components/favorite-button"
import MovieCard from "../../../components/movie-card"
import MovieDescription from "../../../components/movie-description"
import MovieReviews from "../../../components/movie-reviews"
import NotifyButton from "../../../components/notify-button"
import SectionHeading from "../../../components/section-heading"
import SiteFooter from "../../../components/site-footer"
import SiteHeader from "../../../components/site-header"
import Tag from "../../../components/tag"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

type Movie = {
  id: number
  title: string
  original_title: string | null
  studio: string | null
  total_episodes: number | null
  slug: string
  release_year: number | null
  poster_url: string | null
  backdrop_url: string | null
  trailer_url: string | null
  status: string
  description: string | null
  country: string | null
  genres: string | null
  views: number | null
}

type Episode = {
  id: number
  episode_number: number
}

type ApiMovieList = {
  id: number
  title: string
  slug: string
  release_year: number | null
  poster_url: string | null
  genres: string | null
}

const statusLabels: Record<string, string> = {
  ongoing: "Dang tien hanh",
  completed: "Hoan thanh",
  upcoming: "Sap chieu",
}

const formatCount = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return `${value}`
}

const getMovie = async (slug: string): Promise<Movie | null> => {
  try {
    const response = await fetch(`${API_URL}/api/movies/${slug}`, {
      cache: "no-store",
    })
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data.movie || null
  } catch (err) {
    return null
  }
}

const getEpisodes = async (movieId: number): Promise<Episode[]> => {
  try {
    const response = await fetch(`${API_URL}/api/episodes?movieId=${movieId}`, {
      cache: "no-store",
    })
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    return data.episodes || []
  } catch (err) {
    return []
  }
}

const getRelated = async (): Promise<ApiMovieList[]> => {
  try {
    const response = await fetch(`${API_URL}/api/movies?limit=4`, {
      cache: "no-store",
    })
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    return data.movies || []
  } catch (err) {
    return []
  }
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const movie = await getMovie(slug)
  if (!movie) {
    notFound()
  }

  const [episodes, related] = await Promise.all([getEpisodes(movie.id), getRelated()])

  const genreTags = movie.genres
    ? movie.genres
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : []
  const watchHref = episodes.length > 0 ? `/watch/${episodes[0].id}` : null
  const relatedMovies = related.filter((item) => item.slug !== movie.slug).slice(0, 3)
  const viewCount = formatCount(Number(movie.views || 0))
  const episodeProgress = movie.total_episodes
    ? `${episodes.length}/${movie.total_episodes}`
    : episodes.length
      ? `${episodes.length}`
      : "--"

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-3 pb-16 pt-6 sm:space-y-12 sm:px-4 sm:pb-20 sm:pt-10">
        <section className="grid gap-6 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-3 sm:p-6">
              <div className="grid gap-4 md:grid-cols-[0.6fr_1fr]">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: movie.poster_url
                        ? `linear-gradient(180deg, rgba(0,0,0,0) 10%, rgba(0,0,0,0.7) 90%), url(${movie.poster_url})`
                        : "radial-gradient(60% 80% at 60% 20%, rgba(239,43,79,0.3), transparent 70%)",
                    }}
                  />
                  <span className="absolute right-3 top-3 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-semibold">
                    {statusLabels[movie.status] || "Full HD"}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-white/60">Trang chủ / Phim / {movie.title}</p>
                    <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{movie.title}</h1>
                    <p className="text-xs text-white/60 sm:text-sm">{movie.original_title || ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-white/60">
                    <span>{movie.release_year || "--"}</span>
                    <span>•</span>
                    <span>{movie.country || "--"}</span>
                    <span>•</span>
                    <span>{statusLabels[movie.status] || movie.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {genreTags.length === 0 ? (
                      <Tag>Chưa phân loại</Tag>
                    ) : (
                      genreTags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-wrap sm:items-center sm:gap-3">
                    {watchHref ? (
                      <Link
                        href={watchHref}
                        className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-center text-sm font-semibold text-white sm:px-5 sm:py-3"
                      >
                        Xem ngay
                      </Link>
                    ) : (
                      <button
                        className="rounded-full bg-white/10 px-5 py-2.5 text-center text-sm font-semibold text-white/60 sm:py-3"
                        disabled
                      >
                        Chưa có tập
                      </button>
                    )}
                    <div className="flex gap-2">
                      {movie.trailer_url ? (
                        <a
                          href={movie.trailer_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-center text-sm text-white/70 sm:flex-none sm:py-3"
                        >
                          Trailer
                        </a>
                      ) : (
                        <button
                          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm text-white/40 sm:flex-none sm:py-3"
                          disabled
                        >
                          Trailer
                        </button>
                      )}
                      <div className="flex gap-2">
                        <FavoriteButton movieId={movie.id} variant="icon" />
                        <NotifyButton movieId={movie.id} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-5">
                  <h3 className="text-sm font-semibold">Nội dung phim</h3>
                  <MovieDescription description={movie.description} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              {[
                { label: "Lượt xem", value: viewCount, note: "Tổng lượt xem" },
                {
                  label: "Studio",
                  value: movie.studio || "Đang cập nhật",
                  note: movie.studio ? "Nhà sản xuất" : "Đang cập nhật",
                },
                {
                  label: "Cập nhật",
                  value: episodeProgress,
                  note: movie.total_episodes ? "Tập đã ra / Tổng tập" : "Đang cập nhật",
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-5">
                  <p className="text-xs text-white/50">{stat.label}</p>
                  <p className="mt-1.5 text-base sm:mt-2 sm:text-lg font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-white/40">{stat.note}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-3 sm:p-6">
              <SectionHeading title="Danh sách tập" />
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
                {episodes.length === 0 ? (
                  <p className="text-sm text-white/60">Chưa có tập nào.</p>
                ) : (
                  episodes.map((episode) => (
                    <Link
                      key={episode.id}
                      href={`/watch/${episode.id}`}
                      className={`flex h-8 w-9 items-center justify-center rounded-xl border text-xs sm:h-9 sm:w-10 ${
                        episode.episode_number === 1
                          ? "border-transparent bg-[var(--accent)] text-white"
                          : "border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      {episode.episode_number}
                    </Link>
                  ))
                )}
              </div>
            </div>

            <MovieReviews movieId={movie.id} />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-3 sm:p-6">
              <h3 className="text-sm font-semibold">Có thể bạn thích</h3>
              <div className="mt-4 grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-3">
                {relatedMovies.length === 0 ? (
                  <p className="text-xs text-white/50">Chưa có dữ liệu.</p>
                ) : (
                  relatedMovies.map((item) => (
                    <MovieCard
                      key={item.id}
                      title={item.title}
                      subtitle={item.release_year ? `${item.release_year}` : "Chua rõ"}
                      cover={item.poster_url || undefined}
                      href={`/movies/${item.slug}`}
                    />
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-6 text-xs sm:text-sm text-white/70">
              <p className="font-semibold text-white">Từ khóa phổ biến</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {genreTags.length > 0
                  ? genreTags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                  : ["Cổ trang", "Tu tiên", "2026"].map((tag) => <Tag key={tag}>{tag}</Tag>)}
              </div>
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
