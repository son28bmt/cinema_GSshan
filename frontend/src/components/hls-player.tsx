"use client";
import Hls from "hls.js";
import { useEffect, useRef } from "react";
type HlsPlayerProps = {
  src?: string | null;
  poster?: string;
  className?: string;
  movieId?: number;
  episodeId?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function HlsPlayer({
  src,
  poster,
  className,
  movieId,
  episodeId,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync watch history
  useEffect(() => {
    if (!movieId) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.currentTime < 5) return;

      const token = localStorage.getItem("cinema_token");
      if (!token) return;

      fetch(`${API_URL}/api/profile/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId,
          episodeId,
          watchSeconds: Math.floor(video.currentTime),
          isProgressUpdate: true,
        }),
      }).catch(() => {});
    }, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [movieId, episodeId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) {
      return;
    }

    let hls: Hls | null = null;

    if (poster) {
      video.poster = poster;
    }

    if (src.endsWith(".m3u8")) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      }
    } else {
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [src, poster]);

  return (
    <video
      ref={videoRef}
      className={className}
      controls
      playsInline
      preload="metadata"
    />
  );
}
