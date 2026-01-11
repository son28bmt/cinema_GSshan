import Link from "next/link";
import { notFound } from "next/navigation";
import HlsPlayer from "../../../components/hls-player";
import EpisodeComments from "../../../components/episode-comments";
import SectionHeading from "../../../components/section-heading";
import SiteFooter from "../../../components/site-footer";
import SiteHeader from "../../../components/site-header";
import WatchHistoryTracker from "../../../components/watch-history-tracker";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type EpisodeDetail = {
  id: number;
  movie_id: number;
  episode_number: number;
  title: string | null;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  status: string;
  views: number;
  is_premiere?: number;
  live_start_at?: string | null;
  movie_title: string;
  movie_slug: string;
  movie_poster: string | null;
  release_year: number | null;
  country: string | null;
  movie_description: string | null;
  movie_status: string;
  genres: string | null;
};

type EpisodeListItem = {
  id: number;
  episode_number: number;
};

type ServerItem = {
  id: number;
  name: string;
  endpoint_url: string;
  load_percent: number;
  status: "active" | "maintenance" | "disabled";
};

const statusLabels: Record<string, string> = {
  ongoing: "Đang tiến hành",
  completed: "Hoàn thành",
  upcoming: "Sắp chiếu",
};

const getEpisodeDetail = async (id: string): Promise<EpisodeDetail | null> => {
  try {
    const response = await fetch(`${API_URL}/api/episodes/${id}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.episode || null;
  } catch {
    return null;
  }
};

const getEpisodeList = async (movieId: number): Promise<EpisodeListItem[]> => {
  try {
    const response = await fetch(`${API_URL}/api/episodes?movieId=${movieId}`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.episodes || []).map((item: EpisodeListItem) => ({
      id: item.id,
      episode_number: item.episode_number,
    }));
  } catch {
    return [];
  }
};

const getServers = async (): Promise<ServerItem[]> => {
  try {
    const response = await fetch(`${API_URL}/api/servers`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return data.servers || [];
  } catch {
    return [];
  }
};

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const detail = await getEpisodeDetail(id);
  if (!detail) notFound();

  const startTime = detail.live_start_at
    ? new Date(detail.live_start_at).getTime()
    : null;
  const isPremiere = Boolean(detail.is_premiere);
  const isLocked = isPremiere && startTime !== null && Date.now() < startTime;
  const startLabel = startTime
    ? new Date(startTime).toLocaleString("vi-VN")
    : null;

  const [episodes, servers] = await Promise.all([
    getEpisodeList(detail.movie_id),
    getServers(),
  ]);

  const subtitleParts: string[] = [];
  if (detail.release_year) subtitleParts.push(detail.release_year.toString());
  if (detail.country) subtitleParts.push(detail.country);
  if (detail.genres) subtitleParts.push(detail.genres);
  const subtitleText = subtitleParts.join(" | ");

  const currentEpisodeLabel = detail.episode_number
    ? `Tập ${detail.episode_number}`
    : "Tập";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <WatchHistoryTracker movieId={detail.movie_id} episodeId={detail.id} />

      <main className="mx-auto max-w-6xl space-y-10 px-4 pb-20 pt-10 sm:px-6">
        <section className="grid gap-4 sm:rounded-3xl sm:border sm:border-white/10 sm:bg-[rgba(255,255,255,0.02)] sm:p-6 lg:grid-cols-[1.6fr_0.8fr]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Player */}
            <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel)]">
              <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-black/40">
                {detail.video_url && !isLocked ? (
                  <HlsPlayer
                    src={detail.video_url}
                    poster={detail.thumbnail_url || detail.movie_poster || undefined}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: detail.thumbnail_url
                        ? `linear-gradient(180deg, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.8) 90%), url(${detail.thumbnail_url})`
                        : "linear-gradient(180deg, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.8) 90%), radial-gradient(60% 80% at 50% 20%, rgba(239,43,79,0.35), transparent 70%)",
                    }}
                  />
                )}

                {!detail.video_url ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-white/70">
                    <span>Chưa có link cho tập này</span>
                  </div>
                ) : null}

                {isLocked ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-4 text-center text-sm text-white/80">
                    <span className="text-lg font-semibold text-white">
                      Sắp chiếu
                    </span>
                    {startLabel ? <span>Lên sóng lúc {startLabel}</span> : null}
                    <span className="text-xs text-white/60">
                      Video sẽ tự mở khi đến giờ
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Episode header + servers */}
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <SectionHeading
                title={`${detail.movie_title} - ${currentEpisodeLabel}`}
                subtitle={
                  subtitleText
                    ? `${subtitleText} | ${
                        statusLabels[detail.movie_status] || detail.movie_status
                      }`
                    : statusLabels[detail.movie_status] || detail.movie_status
                }
              />

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {servers.length === 0 ? (
                  <span className="text-xs text-white/60">Chưa có server.</span>
                ) : (
                  servers.map((server, index) => {
                    const isPrimary = index === 0 && server.status === "active";
                    const isDisabled = server.status === "disabled";
                    const isMaintenance = server.status === "maintenance";

                    return (
                      <button
                        key={server.id}
                        disabled={isDisabled}
                        title={server.endpoint_url}
                        className={`rounded-full px-4 py-2 ${
                          isDisabled
                            ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/30"
                            : isPrimary
                              ? "border border-transparent bg-[var(--accent)] text-white"
                              : isMaintenance
                                ? "border border-white/10 bg-[rgba(255,255,255,0.06)] text-white/60"
                                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {server.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <SectionHeading title="Danh sách tập" />
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {episodes.length === 0 ? (
                  <p className="col-span-full text-xs text-white/60">
                    Chưa có tập nào.
                  </p>
                ) : (
                  episodes.map((episode) => {
                    const isActive = episode.id === detail.id;
                    return (
                      <Link
                        key={episode.id}
                        href={`/watch/${episode.id}`}
                        className={`flex h-9 items-center justify-center rounded-xl border text-xs ${
                          isActive
                            ? "border-transparent bg-[var(--accent)] text-white"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {episode.episode_number}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            <EpisodeComments episodeId={detail.id} movieId={detail.movie_id} />
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
