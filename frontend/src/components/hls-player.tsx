"use client";
// import { cn } from "@/lib/utils"
import Hls from "hls.js";
import { useEffect, useRef } from "react";

type HlsPlayerProps = {
  src?: string | null;
  poster?: string;
  className?: string;
};

export default function HlsPlayer({ src, poster, className }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
