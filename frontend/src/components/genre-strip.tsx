"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Tag from "./tag";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Genre = {
  id: number;
  name: string;
  slug: string;
};

export default function GenreStrip() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await fetch(`${API_URL}/api/genres`);
        const data = await response.json();
        setGenres(data.genres || []);
      } catch (err) {
        setError("Không tải được thể loại.");
      }
    };

    loadGenres();
  }, []);

  if (error) {
    return <p className="text-xs text-white/50">{error}</p>;
  }

  if (genres.length === 0) {
    return <p className="text-xs text-white/50">Chưa có thể loại.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <Link key={genre.id} href={`/movies?genre=${genre.slug}`}>
          <Tag>{genre.name}</Tag>
        </Link>
      ))}
    </div>
  );
}
