"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AddToListButton({ movieId }: { movieId: number }) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const add = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/me/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ nếu backend dùng cookie session
        body: JSON.stringify({ movie_id: movieId }),
      });

      if (!res.ok) throw new Error("Add failed");
      setAdded(true);
    } catch (e) {
      alert("Không thể thêm vào danh sách. Bạn đã đăng nhập chưa?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={add}
      disabled={loading || added}
      className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm text-white/80 transition hover:border-white/40 disabled:opacity-60"
    >
      {added ? "✓ Đã thêm" : loading ? "Đang thêm..." : "+ Danh sách"}
    </button>
  );
}
