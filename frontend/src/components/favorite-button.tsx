"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type FavoriteButtonProps = {
  movieId: number;
  className?: string;
  variant?: "button" | "icon";
};

export default function FavoriteButton({
  movieId,
  className = "",
  variant = "button",
}: FavoriteButtonProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("cinema_token"));
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!token) {
        return;
      }
      try {
        const response = await fetch(
          `${API_URL}/api/favorites?movieId=${movieId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setIsFavorite(Boolean(data.isFavorite));
      } catch (err) {
        // ignore
      }
    };

    fetchStatus();
  }, [movieId, token]);

  const handleToggle = async () => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/favorites${isFavorite ? `/${movieId}` : ""}`,
        {
          method: isFavorite ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: isFavorite ? undefined : JSON.stringify({ movieId }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Không thể cập nhật danh sách.");
        return;
      }

      setIsFavorite((prev) => !prev);
    } catch (err) {
      setError("Không thể kết nối dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <div className={`flex flex-col items-start gap-2 ${className}`}>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`rounded-full border px-4 py-3 text-sm transition disabled:opacity-60 ${
            isFavorite
              ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
              : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
          }`}
          aria-pressed={isFavorite}
          aria-label="Yêu thích"
          title={isFavorite ? "Đã thêm vào danh sách" : "Thêm vào danh sách"}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M12 20s-7-4.4-9.2-8C1 9 2.7 6 5.6 6c2 0 3.3 1.2 4.4 2.6C11.1 7.2 12.4 6 14.4 6 17.3 6 19 9 21.2 12c-2.2 3.6-9.2 8-9.2 8z" />
          </svg>
        </button>
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <button
        onClick={handleToggle}
        disabled={loading}
        className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm text-white/80 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Đang xử lý..." : isFavorite ? "Đã thêm" : "+ Danh sách"}
      </button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
