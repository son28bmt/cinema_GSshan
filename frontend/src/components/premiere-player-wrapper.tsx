"use client";

import { useEffect, useMemo, useState } from "react";
import HlsPlayer from "./hls-player";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type PremierePlayerWrapperProps = {
  videoUrl: string | null;
  thumbnailUrl?: string | null;
  moviePoster?: string | null;
  liveStartAt?: string | null;
  isPremiere?: boolean;
  movieId: number;
  episodeId: number;
};

export default function PremierePlayerWrapper({
  videoUrl: initialVideoUrl,
  thumbnailUrl,
  moviePoster,
  liveStartAt,
  isPremiere,
  movieId,
  episodeId,
}: PremierePlayerWrapperProps) {
  // Convert liveStartAt to timestamp
  const premiereMs = useMemo(
    () => (liveStartAt ? new Date(liveStartAt).getTime() : null),
    [liveStartAt]
  );

  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);

  // Locked condition: We are premiere mode + It is BEFORE time + We don't have a URL yet
  // If we have a URL, we are always UNLOCKED.
  const isLocked =
    isPremiere && premiereMs !== null && now < premiereMs && !videoUrl;

  useEffect(() => {
    // 1. Tick for UI Countdown
    const tick = setInterval(() => setNow(Date.now()), 1000);

    // 2. Schedule Fetch
    let timer: NodeJS.Timeout;

    if (isPremiere && premiereMs && !videoUrl) {
      const msUntilPremiere = premiereMs - Date.now();

      // Delay fetch: wait until premiere time + 500ms buffer
      // If time already passed but no URL, fetch immediately (delay 0)
      const delay = Math.max(0, msUntilPremiere);

      timer = setTimeout(async () => {
        try {
          setLoading(true);
          const res = await fetch(`${API_URL}/api/episodes/${episodeId}`, {
            cache: "no-store",
          });
          if (res.ok) {
            const data = await res.json();
            const url = data?.episode?.video_url || null;
            if (url) {
              setVideoUrl(url);
            }
          }
        } catch (err) {
          console.error("Auto unlock fetch failed", err);
        } finally {
          setLoading(false);
        }
      }, delay + 500);
    }

    return () => {
      clearInterval(tick);
      if (timer) clearTimeout(timer);
    };
  }, [isPremiere, premiereMs, videoUrl, episodeId]);

  // If unlocked (has videoUrl), Render Player
  if (videoUrl) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel)]">
        <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-black/40">
          <HlsPlayer
            src={videoUrl}
            poster={thumbnailUrl || moviePoster || undefined}
            className="absolute inset-0 h-full w-full object-cover"
            movieId={movieId}
            episodeId={episodeId}
          />
        </div>
      </div>
    );
  }

  // --- LOCKED STATE RENDERING ---

  const titleStr = "Sắp công chiếu";
  let startLabel = "";
  if (premiereMs) {
    startLabel = new Date(premiereMs).toLocaleString("vi-VN");
  }

  // Countdown calc
  let countdownStr = "--:--:--";
  let secondsRemaining = 0;
  if (premiereMs) {
    const remain = Math.max(0, premiereMs - now);
    const secs = Math.floor(remain / 1000);
    secondsRemaining = secs;

    const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
    const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    countdownStr = `${hh}:${mm}:${ss}`;
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel)]">
      <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-black/40">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: thumbnailUrl
              ? `linear-gradient(180deg, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.8) 90%), url(${thumbnailUrl})`
              : "linear-gradient(180deg, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.8) 90%), radial-gradient(60% 80% at 50% 20%, rgba(239,43,79,0.35), transparent 70%)",
          }}
        />

        {/* Locked Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60 px-4 text-center text-sm text-white/80 backdrop-blur-sm">
          <span className="text-lg font-semibold text-white animate-pulse">
            {titleStr}
          </span>
          {startLabel && <span>Lên sóng lúc {startLabel}</span>}

          <span
            className={`rounded-full px-4 py-2 text-xs text-white/90 border ${
              loading
                ? "bg-red-500/20 border-red-500/50"
                : "bg-white/10 border-white/10"
            }`}
          >
            {loading ? "Đang mở khóa..." : `Còn ${countdownStr}`}
          </span>

          <span className="text-xs text-white/60">
            Video sẽ tự mở khi đến giờ
          </span>

          {/* Manual Check Button (Only shows if time has passed but still locked/loading failed) */}
          {secondsRemaining === 0 && !loading && (
            <button
              onClick={() => {
                setLoading(true);
                fetch(`${API_URL}/api/episodes/${episodeId}`, {
                  cache: "no-store",
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data?.episode?.video_url)
                      setVideoUrl(data.episode.video_url);
                  })
                  .finally(() => setLoading(false));
              }}
              className="mt-2 text-xs underline opacity-80 hover:opacity-100"
            >
              Kiểm tra lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
