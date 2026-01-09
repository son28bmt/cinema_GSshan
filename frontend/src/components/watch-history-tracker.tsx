"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type WatchHistoryTrackerProps = {
  movieId: number;
  episodeId?: number;
};

export default function WatchHistoryTracker({
  movieId,
  episodeId,
}: WatchHistoryTrackerProps) {
  useEffect(() => {
    const token = localStorage.getItem("cinema_token");
    if (!token || !movieId) {
      return;
    }

    const controller = new AbortController();
    const record = async () => {
      try {
        await fetch(`${API_URL}/api/profile/history`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ movieId, episodeId }),
          signal: controller.signal,
        });
      } catch (err) {
        // ignore
      }
    };

    record();

    return () => controller.abort();
  }, [movieId, episodeId]);

  return null;
}
