"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function NotifyButton({
  movieId,
  className = "",
}: {
  movieId: number;
  className?: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
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
          `${API_URL}/api/subscriptions?movieId=${movieId}`,
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
        setIsSubscribed(Boolean(data.isSubscribed));
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
        `${API_URL}/api/subscriptions${isSubscribed ? `/${movieId}` : ""}`,
        {
          method: isSubscribed ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: isSubscribed ? undefined : JSON.stringify({ movieId }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Không thể cập nhật thông báo.");
        return;
      }

      setIsSubscribed((prev) => !prev);
    } catch (err) {
      setError("Không thể kết nối dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`rounded-full border px-4 py-3 text-sm transition disabled:opacity-60 ${
          isSubscribed
            ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
            : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
        }`}
        aria-pressed={isSubscribed}
        aria-label="Thông báo tập mới"
        title={isSubscribed ? "Đã bật thông báo" : "Nhận thông báo"}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill={isSubscribed ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M18 16H6c1.2-1.3 2-3.2 2-5.3V9a4 4 0 018 0v1.7c0 2.1.8 4 2 5.3z" />
          <path d="M9.5 19a2.5 2.5 0 005 0" />
        </svg>
      </button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
