"use client";

import { useEffect, useState } from "react";
import MovieCard from "./movie-card";
import SectionHeading from "./section-heading";

type ApiEpisode = {
  id: number;
  episode_number: number;
  title: string | null;
  thumbnail_url: string | null;
  created_at: string;
  released_at: string | null;
  live_start_at?: string | null;
  status: string;
  movie_title: string;
  movie_slug: string;
  movie_poster: string | null;
};

const pickScheduleTime = (episode: ApiEpisode) =>
  episode.live_start_at || episode.released_at || episode.created_at;

export default function UpcomingSection({
  initialEpisodes,
}: {
  initialEpisodes: ApiEpisode[];
}) {
  const [episodes, setEpisodes] = useState<ApiEpisode[]>(initialEpisodes);

  useEffect(() => {
    const checkSchedule = () => {
      const now = Date.now();
      setEpisodes(
        initialEpisodes.filter((ep) => {
          const timeStr = pickScheduleTime(ep);
          if (!timeStr) return false;
          const time = new Date(timeStr).getTime();
          // Only show if time is in the future
          return time > now;
        })
      );
    };

    // Check ngay lập tức
    checkSchedule();

    // Check mỗi giây
    const interval = setInterval(checkSchedule, 1000);
    return () => clearInterval(interval);
  }, [initialEpisodes]);

  if (episodes.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        title="Sắp chiếu"
        subtitle="Các tập phim sẽ phát sóng trong thời gian tới"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        {episodes.map((episode) => {
          const timeStr = pickScheduleTime(episode);
          const date = timeStr ? new Date(timeStr) : null;

          let timeDisplay = "";
          if (date) {
            const today = new Date();
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();

            const timePart = date.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            });

            timeDisplay = isToday
              ? timePart
              : `${date.getDate()}/${date.getMonth() + 1} ${timePart}`;
          }

          return (
            <div key={episode.id}>
              <MovieCard
                title={episode.movie_title}
                subtitle={`Tập ${episode.episode_number}`}
                badge={timeDisplay}
                cover={
                  episode.movie_poster || episode.thumbnail_url || undefined
                }
                href={`/watch/${episode.id}`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
