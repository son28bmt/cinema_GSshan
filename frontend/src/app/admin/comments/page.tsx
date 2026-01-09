"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PAGE_SIZE = 6;
const POLL_INTERVAL_MS = 5000;

type Comment = {
  id: number;
  author_name: string;
  author_email: string | null;
  author_ip: string | null;
  content: string;
  status: string;
  report_reason: string | null;
  parent_id: number | null;
  created_at: string;
  movie_title: string | null;
  episode_number: number | null;
};

type CommentStats = {
  total: number;
  pending: number;
  approved: number;
  reported: number;
  pinned: number;
};

const statusLabels: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  reported: "Báo cáo",
  pinned: "Đã ghim",
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-300",
  approved: "bg-green-500/15 text-green-400",
  reported: "bg-red-500/15 text-red-300",
  pinned: "bg-blue-500/15 text-blue-300",
};

const formatDateTime = (value: string) => new Date(value).toLocaleString("vi-VN");

type StatusFilter = "all" | "pending" | "approved" | "reported" | "pinned";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<CommentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    reported: 0,
    pinned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [token, setToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("cinema_token"));
  }, []);

  const fetchComments = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/comments?limit=200`, {
        cache: "no-store",
      });
      if (!response.ok) {
        setError("không thể tải được bình luận.");
        return;
      }
      const data = await response.json();
      setComments(data.comments || []);
      setStats(
        data.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          reported: 0,
          pinned: 0,
        }
      );
    } catch (err) {
      setError("Không thể kết nối backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComments(false);
  }, [fetchComments]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchComments(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchComments]);

  const filteredComments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return comments.filter((comment) => {
      const matchesTerm =
        !term ||
        comment.content.toLowerCase().includes(term) ||
        comment.author_name.toLowerCase().includes(term) ||
        (comment.author_email || "").toLowerCase().includes(term) ||
        (comment.movie_title || "").toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ? true : comment.status === statusFilter;
      return matchesTerm && matchesStatus;
    });
  }, [comments, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredComments.length / PAGE_SIZE));
  const paginatedComments = filteredComments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleDelete = async (comment: Comment) => {
    if (!token) {
      setError("bạn cần đăng nhập để bình luận.");
      return;
    }
    if (!window.confirm("Xoa binh luan nay?")) {
      return;
    }

    setDeletingId(comment.id);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/comments/${comment.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Khong the xoa binh luan.");
        return;
      }

      setComments((prev) => prev.filter((item) => item.id !== comment.id));
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        pending: comment.status === "pending" ? Math.max(0, prev.pending - 1) : prev.pending,
        approved: comment.status === "approved" ? Math.max(0, prev.approved - 1) : prev.approved,
        reported: comment.status === "reported" ? Math.max(0, prev.reported - 1) : prev.reported,
        pinned: comment.status === "pinned" ? Math.max(0, prev.pinned - 1) : prev.pinned,
      }));
    } catch (err) {
      setError("Khong the ket noi backend.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kiểm duyệt bình luận</h1>
          <p className="mt-1 text-sm text-white/60">
            Theo dõi và xử lý nội dung bình luận từ người dùng.
          </p>
        </div>
        <button className="rounded-xl border border-white/10 bg-[#111b26] px-4 py-2 text-sm text-white/70">
          Xuat bao cao
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Tổng bình luận", value: stats.total, tone: "text-green-300" },
          { label: "Chờ duyệt", value: stats.pending, tone: "text-yellow-300" },
          { label: "Đã duyệt", value: stats.approved, tone: "text-green-300" },
          { label: "Báo cáo", value: stats.reported, tone: "text-red-300" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/5 bg-[#162333] p-5"
          >
            <p className="text-xs text-white/50">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            <p className={`mt-2 text-xs ${stat.tone}`}>Cập nhật mới nhất</p>
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-white/5 bg-[#162333] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white/60">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L17 17" />
            </svg>
            <input
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              placeholder="Tìm kiếm nội dung, người dùng, phim..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          {(
            [
              { label: "Tất cả", value: "all" },
              { label: "chờ Duyệt", value: "pending" },
              { label: "Đã Duyệt", value: "approved" },
              { label: "Đã Ghim", value: "pinned" },
              { label: "Báo cáo", value: "reported" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-xl px-3 py-2 text-xs ${
                statusFilter === tab.value
                  ? "bg-[#1f8ef1] text-white"
                  : "border border-white/10 bg-[#111b26] text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
          <div className="grid grid-cols-[0.7fr_1.6fr_1fr_0.8fr_0.9fr_0.7fr] bg-[#111b26] items-center justify-items-center px-4 py-3 text-xs text-white/50" >
            <span>Người dùng</span>
            <span>nội dung bình luận</span>
            <span>Phim / Tập</span>
            <span>Trạng thái</span>
            <span>Ngày tạo</span>
            <span>Hành động</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="flex items-center gap-3 px-4 py-6 text-sm text-white/60">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
                 Đang tải dữ liệu...
              </div>
            ) : paginatedComments.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/60">Chưa có bình luận.</div>
            ) : (
              paginatedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="grid grid-cols-[0.7fr_1.6fr_1fr_0.8fr_0.9fr_0.7fr] justify-items-center  items-center px-4 py-4 text-sm"
                >
                  <div >
                    <p className="font-semibold text-white">{comment.author_name}</p>
                    <p className="text-xs text-white/50">
                      {comment.author_email || comment.author_ip || "-"}
                    </p>
                  </div>
                  <div className="text-xs text-white/60">
                    <p>{comment.content}</p>
                    {comment.report_reason ? (
                      <p className="mt-2 text-[11px] text-red-300">
                        Ly do báo cáo: {comment.report_reason}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs text-white/60">
                    {comment.movie_title || "-"}
                    {comment.episode_number ? ` · Tap ${comment.episode_number}` : ""}
                  </p>
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] ${
                      statusStyles[comment.status] || "bg-white/10 text-white/70"
                    }`}
                  >
                    {statusLabels[comment.status] || comment.status}
                  </span>
                  <span className="text-xs text-white/60">
                    {formatDateTime(comment.created_at)}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => handleDelete(comment)}
                      disabled={deletingId === comment.id}
                    >
                      {deletingId === comment.id ? "Dang xoa" : "Xoa"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {refreshing ? (
          <p className="mt-3 text-xs text-white/40">Dang cap nhat...</p>
        ) : null}

        {error ? <p className="mt-4 text-xs text-red-300">{error}</p> : null}

        <div className="mt-4 flex items-center justify-between text-xs text-white/50">
          <span>
            Hien thi {filteredComments.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} den{" "}
            {Math.min(currentPage * PAGE_SIZE, filteredComments.length)} ket qua
          </span>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded-lg border text-xs ${
                  page === currentPage
                    ? "border-transparent bg-[#1f8ef1] text-white"
                    : "border-white/10 bg-[#111b26] text-white/70"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
