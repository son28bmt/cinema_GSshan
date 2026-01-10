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
  ongoing: "Dang tien hanh",
  completed: "Hoan thanh",
  upcoming: "Sap chieu",
};

const getEpisodeDetail = async (id: string): Promise<EpisodeDetail | null> => {
  try {
    const response = await fetch(`${API_URL}/api/episodes/${id}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.episode || null;
  } catch (err) {
    return null;
  }
};

const getEpisodeList = async (movieId: number): Promise<EpisodeListItem[]> => {
  try {
    const response = await fetch(`${API_URL}/api/episodes?movieId=${movieId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return (data.episodes || []).map((item: EpisodeListItem) => ({
      id: item.id,
      episode_number: item.episode_number,
    }));
  } catch (err) {
    return [];
  }
};

const getServers = async (): Promise<ServerItem[]> => {
  try {
    const response = await fetch(`${API_URL}/api/servers`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.servers || [];
  } catch (err) {
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

  if (!detail) {
    notFound();
  }

  const episodes = await getEpisodeList(detail.movie_id);
  const servers = await getServers();
  const subtitleParts = [] as string[];
  if (detail.release_year) subtitleParts.push(detail.release_year.toString());
  if (detail.genres) subtitleParts.push(detail.genres);
  const subtitleText = subtitleParts.join(" | ");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <WatchHistoryTracker movieId={detail.movie_id} episodeId={detail.id} />
      <main className="mx-auto max-w-6xl space-y-10 px-4 pb-20 pt-10 sm:px-6">
        <section className="grid gap-4 sm:p-6 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="space-y-6">
            <div className="relative aspect-video rounded-3xl border border-white/10 bg-[var(--panel)] overflow-hidden">
              <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-black/40 " style={{ aspectRatio: "16 / 9" }}>
                {detail.video_url ? (
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-white/70">
                    <span>Chưa có Link cho tập này</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <SectionHeading
                title={`${detail.movie_title} - Tập ${detail.episode_number}`}
                subtitle={
                  subtitleText
                    ? `${subtitleText} | ${statusLabels[detail.movie_status] || detail.movie_status}`
                    : statusLabels[detail.movie_status] || detail.movie_status
                }
              />
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                {servers.length === 0 ? (
                  <span className="text-xs text-white/60">chưa có server.</span>
                ) : (
                  servers.map((server, index) => {
                    const isPrimary = index === 0 && server.status === "active";
                    const isDisabled = server.status === "disabled";
                    return (
                      <button
                        key={server.id}
                        disabled={isDisabled}
                        className={`rounded-full px-4 py-2 ${
                          isPrimary
                            ? "bg-[var(--accent)] text-white"
                            : "border border-white/10 bg-white/5 text-white/70"
                        } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                        title={server.endpoint_url}
                      >
                        {server.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <SectionHeading title="Danh sách tập" />
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {episodes.length === 0 ? (
                  <p className="col-span-full text-xs text-white/60">Chưa có tập nào.</p>
                ) : (
                  episodes.map((episode) => (
                    <Link
                      key={episode.id}
                      href={`/watch/${episode.id}`}
                      className={`flex h-9 items-center justify-center rounded-xl border text-xs ${
                        episode.id === detail.id
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
            <EpisodeComments episodeId={detail.id} movieId={detail.movie_id} />
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

